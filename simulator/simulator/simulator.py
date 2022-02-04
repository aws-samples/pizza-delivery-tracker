import threading
import os
import boto3
import json
import time
import datetime as dt
import logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("simulator-logger")

QUEUE_URL = os.environ.get("REQ_QUEUE_URL")
TRACKER_NAME = os.environ.get("TRACKER_NAME")
SQS_CLIENT = boto3.client("sqs")
SPEED = 30
SIMULATIONS_SEMPHORE = threading.Semaphore(10)


def get_new_position_index(final_position_index, current_position_index):
    """ Calculates latest position for the delivery request and returns its index. """
    if current_position_index is None:
        return 0

    new_position_index = current_position_index + int(SPEED / 10)
    if new_position_index > final_position_index:
        return final_position_index
    return new_position_index


def validate_delivery_request(dr):
    delivery_request = json.loads(dr["Body"])
    if "lineString" in delivery_request and "deviceId" in delivery_request:
        return delivery_request

    log.warning(f"##MALFORMED DELIVERY REQUEST. CANNOT BE DELIVERED. {delivery_request}")
    return None


def simulate_delivery(delivery_requests):
    """ Parses incoming delivery requests and sends batch location updates to Amazon Location Service tracker. """
    for dr in delivery_requests:
        v = validate_delivery_request(dr)
        if v:
            log.info(f"## STARTING DELIVERY ORDER: {v}")
            SIMULATIONS_SEMPHORE.acquire()
            t = threading.Thread(target=run_position_simulation, args=(v,))
            t.start()


def run_position_simulation(delivery_request):
    location_client = boto3.client("location")
    current_position_index = None
    final_position_index = len(delivery_request["lineString"]) - 1
    while True:
        current_position_index = get_new_position_index(
            final_position_index,
            current_position_index,
        )

        position = delivery_request["lineString"][current_position_index]
        update = {
            "DeviceId": delivery_request["deviceId"],
            "SampleTime": dt.datetime.utcnow(),
            "Position": position,
            "Accuracy": {
                "Horizontal": 0.25, # optimistic accuracy, adjust based on available hardware sensor
            }
        }
        r = location_client.batch_update_device_position(
            TrackerName=TRACKER_NAME,
            Updates=[update]
        )
        if r["Errors"]:
            log.error("## Error with location update:", r)

        if current_position_index >= final_position_index:
            # We have arrived at our destination. This is the last update to send.
            log.info(f"## Delivery {delivery_request['deviceId']} finished at position {current_position_index}: {position}")
            break
        else:
            log.info(f"## Delivery {delivery_request['deviceId']} at position {current_position_index} out of {final_position_index}: {position}")

        time.sleep(1.2)

    SIMULATIONS_SEMPHORE.release()


if __name__ == "__main__":
    log.info(f"##PIZZA ORDER PROCESSING STARTED.")
    while True:
        delivery = SQS_CLIENT.receive_message(
            QueueUrl=QUEUE_URL, WaitTimeSeconds=5, MaxNumberOfMessages=5
        )
        if "Messages" in delivery:
            entries = [
                {"Id": message["MessageId"], "ReceiptHandle": message["ReceiptHandle"]}
                for message in delivery["Messages"]
            ]

            # Delete them now from the queue, because stale messages are worthless to the user.
            SQS_CLIENT.delete_message_batch(QueueUrl=QUEUE_URL, Entries=entries)

            # Simulate!
            simulate_delivery(delivery["Messages"])

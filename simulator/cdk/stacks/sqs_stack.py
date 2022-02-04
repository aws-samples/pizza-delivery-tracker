from aws_cdk import aws_sqs as sqs, NestedStack
from constructs import Construct


class SqsStack(NestedStack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        self._req_queue = sqs.Queue(
            self,
            "ReqQueue",
            queue_name="simulator-req-queue.fifo",
            fifo=True,
            encryption=sqs.QueueEncryption.KMS_MANAGED,
        )

    @property
    def req_queue(self) -> sqs.QueueBase:
        return self._req_queue

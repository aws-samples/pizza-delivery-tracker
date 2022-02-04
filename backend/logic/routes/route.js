var express = require('express');
var router = express.Router();

const { v4: uuidv4 } = require('uuid');
const { LocationClient, CalculateRouteCommand } = require('@aws-sdk/client-location')
const { DynamoDB } = require("@aws-sdk/client-dynamodb")
const { marshall } = require('@aws-sdk/util-dynamodb');
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

// DynamoDB table name, SQS queue URL, Amazon Location Service route calculator name
const DDB_TABLE = process.env.DDB_TABLE;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const ROUTE_CALCULATOR = process.env.ROUTE_CALCULATOR;

const ddb_client = new DynamoDB();
const sqs_client = new SQSClient();
const loc_client = new LocationClient()

router.options('/', function(req, res, next) {
    res.send('ok');
})

/* GET route to pizza */
router.get('/', async function(req, res, next) {
    const { departure_long, departure_lat, destination_long, destination_lat } = req.query;
    const coordinates = [departure_long, departure_lat, destination_long, destination_lat];

    if (coordinates.includes(undefined)) {
        res.status(400).send('Request is missing departure or destination coordinates as query params.');
        return;
    }

    console.log("$$$$$$$$$$$$$$ New Pizza Order $$$$$$$$$$$$$$$$",
        `\nDeparture position: lat ${departure_lat} long ${departure_long}`,
        `\nDestination position: lat ${destination_lat} long ${destination_long}`,
    );

    function parse_coordinates(long, lat) { return [parseFloat(long), parseFloat(lat)]; }
    const route = await calculateRoute(coordinates);
    let line_string;

    try {
        line_string = [parse_coordinates(departure_long, departure_lat)]
            .concat(route["Legs"][0]["Geometry"]["LineString"])
            .concat([parse_coordinates(destination_long, destination_lat)]);
    } catch (error) {
        console.log("Error construcing route line string: ", error);
        res.status(500).send('Error calculating the route.');
        return;
    }

    const order_id = uuidv4();
    const response = {
        "order_id": order_id,
        "Legs": route["Legs"],
        "Summary": route["Summary"],
    };
    saveOrderDDB(order_id, coordinates);
    sendOrderSQS(order_id, line_string);

    res.send(response)
});

async function calculateRoute(coordinates) {
    const [departure_long, departure_lat, destination_long, destination_lat] = coordinates;
    const command = new CalculateRouteCommand({
        CalculatorName: ROUTE_CALCULATOR,
        TravelMode: "Walking",
        DepartNow: true,
        DeparturePosition: [departure_long, departure_lat],
        DestinationPosition: [destination_long, destination_lat],
        IncludeLegGeometry: true
    });

    try {
        return await loc_client.send(command);
    } catch (error) {
        console.log('Error calculating the route: ', error);
        return {};
    }
}

async function saveOrderDDB(order_id, coordinates) {
    const [departure_long, departure_lat, destination_long, destination_lat] = coordinates;
    const params = {
        TableName: DDB_TABLE,
        Item: marshall({
            orderId: order_id,
            departureLong: departure_long,
            departureLat: departure_lat,
            destinationLong: destination_long,
            destinationLat: destination_lat,
            lastPositionLong: departure_long,
            lastPositionLat: departure_lat,
            timestamp: new Date().toISOString(),
        }),
    };

    try {
        await ddb_client.putItem(params);
    } catch (error) {
        console.log('DDB putItem (error): ', error);
    }
}

async function sendOrderSQS(order_id, line_string) {
    const sqsCommand = new SendMessageCommand({
        DelaySeconds: 0,
        MessageDeduplicationId: uuidv4(), // replace with a meaningful deduplication ID
        MessageGroupId: 0,
        MessageAttributes: {
            deviceId: {
                DataType: "String",
                StringValue: order_id,
            },
            timestamp: {
                DataType: "String",
                StringValue: new Date().toISOString(),
            },
            lineString: {
                DataType: "String",
                StringValue: JSON.stringify(line_string),
            },
        },
        MessageBody: JSON.stringify({
            deviceId: order_id,
            lineString: line_string
        }),
        QueueUrl: SQS_QUEUE_URL
    });

    try {
        await sqs_client.send(sqsCommand);
    } catch (error) {
        console.log('SQS SendMessageCommand (error): ', error);
    }
}


module.exports = router;

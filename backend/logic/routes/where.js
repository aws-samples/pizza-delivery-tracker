var express = require('express');
var router = express.Router();

const { LocationClient, GetDevicePositionCommand } = require('@aws-sdk/client-location');
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const TRACKER = process.env.TRACKER;
const DDB_TABLE = process.env.DDB_TABLE;
const loc_client = new LocationClient();
const ddb_client = new DynamoDB();

// Cache order object locally
var cached_item = {
    orderId: " ",
    item: {}
};

/* GET location of pizza */
router.get('/', async function(req, res, next) {
    const order_id = req.query.order_id;
    if (order_id === undefined) {
        res.status(400).send('Request is missing the order_id query param.');
        return;
    }

    const order_data = await getOrderPosition(order_id);
    // Get the order details from DynamoDB or cache, i.e. local variable
    let saved_order = await getSavedPosition(order_id, true);

    if ('Position' in order_data) {
        order_data['Delivered'] = compareLocations(saved_order, order_data.Position);
        updateSavedPosition(order_id, order_data.Position);
    } else {
        saved_order = await getSavedPosition(order_id);
        order_data['Position'] = [saved_order.lastPositionLong, saved_order.lastPositionLat]
    }

    res.send(order_data)
})

function compareLocations(order, position) {
    //3 decimals:   0.001 deg	->  111 m distance
    //4 decimals: 	0.0001 deg 	->  11.1 m distance
    //5 decimals:	0.00001 deg ->  1.11 m distance
    const decimals = 4;

    const long_a = order.destinationLong;
    const long_b = position[0];
    const lat_a = order.destinationLat;
    const lat_b = position[1];

    const distance = Math.sqrt(Math.pow(long_a - long_b, 2) + Math.pow(lat_a - lat_b, 2));
    const precision = Math.pow(10, -decimals);
    const is_delivered = distance < precision;

    console.log('Pizza Location: ', [long_b, lat_b]);
    console.log(`Distance to deliver: ${distance} < ${precision} = ${is_delivered}`);

    return is_delivered;
}

async function getOrderPosition(order_id, retry = 1) {
    const order_data = {
        DeviceId: order_id,
        TrackerName: TRACKER
    };

    const position_command = new GetDevicePositionCommand(order_data);

    try {
        const loc_data = await loc_client.send(position_command);
        return {
            DeviceId: order_id,
            Position: loc_data["Position"],
            Delivered: false,
        }
    } catch (error) {
        console.log(`ERROR: GetDevicePositionCommand: ${error}, retries left: ${retry}`);
        if (retry === 0) return {};
        return await getOrderPosition(order_id, retry - 1);
    }
}

async function getSavedPosition(order_id, get_cached = false) {
    if (get_cached && (order_id === cached_item.orderId)) return cached_item.item;

    const params = {
        TableName: DDB_TABLE,
        Key: marshall({ orderId: order_id })
    };

    try {
        const { Item } = await ddb_client.getItem(params);
        const item = unmarshall(Item);
        cached_item.orderId = order_id;
        cached_item.item = item;
        return item;
    } catch (error) {
        console.log('DDB getItem (error): ', error);
        return {};
    }
}

function updateSavedPosition(order_id, position) {
    const params = {
        TableName: DDB_TABLE,
        Key: marshall({
            "orderId": order_id,
        }),
        UpdateExpression: "SET lastPositionLong = :long, lastPositionLat = :lat",
        ExpressionAttributeValues: marshall({
            ":long": position[0],
            ":lat": position[1]
        }),
        ReturnValues: "UPDATED_NEW"
    };

    ddb_client.updateItem(params).then(
        (res) => {
            console.log(JSON.stringify(res));
        },
        (error) => {
            console.log("DDB updateItem (error): ", error);
        }
    );
}


module.exports = router;

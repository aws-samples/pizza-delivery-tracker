# Backend Component on AWS App Runner

The backend consists of the following stacks as is defined as CDK JavaScript.
- DynamoDB Table
- Amazon Location Service: Route Calculator
- AWS App Runner: Application

## Backend Logic
The backend exposes two API endpoints to the frontend:
- `/route_to_my_pizza` which is implemented in `routes/route.js`. \
This endpoint takes the departure and destination coordinates for the pizza order and returns an order ID and the calculted route. \
The order is saved to DynamoDB ans sent to the delivery simulator via an SQS queue.
- `/where_is_my_pizza` which is implemented in `routes/where.js`.
This endpoint takes the order ID and returns the current position of the pizza order and its delivery status. \
The current delivery position is retrieved from Amazon Location Service and updated in DynamoDB.

## Backend Environment Variables

The backend service expects the following environment variables:

- `PORT` - the port that the server is listening to. Defaults to port 80.
- `TRACKER` - the name of the pizza deliver tracker (Amazon Location Service).
- `ROUTE_CALCULATOR` - the name of the route calculator (Amazon Location Service).
- `DDB_TABLE` - the name of the DynamoDB table used to store the pizza orders.
- `SQS_QUEUE_URL` - the URL of the SQS queue used to communicate the order to the delivery simulator.

## Structure

* `cdk/` contains a CDK app to deploy the backend on AWS App Runner.
* `logic/` contains an NodeJS app as container.

## Local Development

Go into the `logic` directory, and run these commands:

* `npm install`
* `npm start`

This will compile and package all resources and start a local development server.

## Deploy to your AWS Account as CDK app

This CDK app deploys the backend as container on AWS App Runner.

It also builds and uploads the container image from `logic/`.

Change the following parameters in `cdk/cdk.json`, under `context`, based on
the outputs from the other components:

* `TRACKER`, e.g., "PizzaDeliveryTracker",
* `TRACKER_ARN`, e.g., "arn:aws:geo:REGION:ACCOUNT_ID:tracker/TRACKER_NAME",
* `SQS_QUEUE_URL`, e.g., "https://sqs.REGION.amazonaws.com/ACCOUNT_ID/SQS-ReqQueueID.fifo",
* `SQS_ARN`, e.g., "arn:aws:sqs:REGION:ACCOUNT_ID:SQS-ReqQueueID.fifo"

Go into the `cdk` directory, and run these commands:

* `npm install`
* `cdk bootstrap`
* `cdk deploy --all`

### Clean up

Go into the `cdk` directory, and run these commands:

* `cdk destroy --all`

## Security Considerations

This component uses Amazon ECR to store a container image. If you need to
restrict all traffic to within your VPC, consider using VPC endpoints to reach
ECR from your ECR cluster to pull these images through your VPC.

# Pizza Delivery Tracker

This sample project contains a map-based pizza ordering app with real-time
tracking of your delivery. The browser-based frontend shows a map with your
current location and lists all pizza places nearby. You can select one to order
a pizza from there. Shortly after ordering, a delivery route is calculated and
you can monitor the delivery progress in real-time while the pizza icon is
moving closer and closer to your location on the map.

![](demo.gif?raw=true)

There are three main components:

* Frontend: an AWS Amplify app written in TypeScript, using the Amazon Location
  Service to render a map and show pizza places with maplibre-js
* Backend: a containerized web application written in JavaScript using NodeJS,
  hosted on AWS App Runner with a Amazon DynamoDB table as storage backend
* Simulator: a containerized demo component to simulate the pizza location
  updates, using Amazon ECS on AWS Fargate and Amazon SQS

Each component can be deployed individually to your AWS account with
infrastructure as code and detailed instructions.

This architecture diagram describes the individual components and resources:
![](architecture.png?raw=true)

## Resources

* AWS App Runner: https://aws.amazon.com/apprunner/
* AWS Amplify: https://aws.amazon.com/amplify/
* Amplify Geo and Location Service: https://docs.amplify.aws/lib/geo/getting-started/q/platform/js/

## Prerequisites

* Python 3 or later
  * check version with `python3 -V`
* NodeJS 14 or later
  * check version with `node --version`
* Docker or similar container engine
  * integrated with CDK constructs to build container images locally
* CDK v2.8.0 or later
  * install aws-cdk via NPM: `npm install -g aws-cdk`, check version with `cdk --version`

## Deployment

All components can be deployed using CDK. Some resources are created and passed
to the next component. Please deploy in this order:

* Deploy simulator
  * see `simulator/README.md`
* Deploy backend
  * see `backend/README.md`
  * use SQS URL and ARN and Location Tracker name and ARN from simulator
* Deploy frontend
  * see `frontend/README.md`
  * use App Runner URL from backend

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more
information.

Please see the security sections for each component for additional deployment
considerations.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

Emoji SVG files designed by OpenMoji – the open-source emoji and icon project. License: CC BY-SA 4.0

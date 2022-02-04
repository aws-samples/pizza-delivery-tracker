# Simulator Component using Amazon ECS

The simulator component mimics the behavior of a driver out for a delivery run,
by sending regular location updates that are fetched by the backend and
displayed on the map.  

AWS Fargate tasks poll orders from an Amazon SQS queue, which contains the path
a driver has to take for the delivery. The simulator then sends batch updates of
the current location (depending upon the speed) to an Amazon Location Service
tracker. AWS Fargate tasks scale depending upon the depth of the order queue.
There is a minimum of 1 task running at all times.

## Structure

* `cdk/` contains a CDK app to deploy the simulator on Amazon ECS.
* `simulator/` contains a Python 3 application that simulates a pizza delivery.

## Local Development

### Python virtual environment

Create Python virtual environment:

```sh
# from the cdk folder

$ python3 -m venv .venv
$ pip install --upgrade pip
```

Activate virtual environment and install requirements:

```sh
# from the cdk folder

$ source .venv/bin/activate
$ pip install -Ur requirements.txt
```

## Deploy to your AWS Account as CDK app

This CDK app deploys the simulator as container on ECS and creates related resources.

It also builds and uploads the container image from `simulator/`.

Go into the `cdk` directory, and run these commands:

* `cdk bootstrap`
* `cdk deploy`

_**NOTE:** :warning: AWS CDK CLI will ask for your permissions to deploy specific *IAM Roles* and *IAM Polices* resources. When asked, please acknowledge with `y` and press **Enter**._

### Clean up

Go into the `cdk` directory, and run these commands:

* `cdk destroy`

## Security Considerations

This component uses Amazon ECR to store a container image. If you need to
restrict all traffic to within your VPC, consider using VPC endpoints to reach
ECR from your ECR cluster to pull these images through your VPC.

from aws_cdk import Stack, CfnOutput
from constructs import Construct

from stacks.vpc_stack import VpcStack
from stacks.sqs_stack import SqsStack
from stacks.location_tracker_stack import LocationTracker
from stacks.ecs_stack import EcsStack
from stacks.fargate_task_stack import FargateTaskStack


class SimulatorStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        vpc = VpcStack(self, "VPC")
        queue = SqsStack(self, "SQS")
        tracker = LocationTracker(self, "LocationTracker")
        ecs_cluster = EcsStack(self, "ECS", vpc=vpc)
        FargateTaskStack(
            self,
            "FargateTask",
            ecs_cluster=ecs_cluster,
            queue=queue,
            tracker=tracker,
        )

        CfnOutput(self, "tracker-name", value=tracker.delivery_tracker.tracker_name)
        CfnOutput(self, "tracker-arn", value=tracker.delivery_tracker.attr_tracker_arn)
        CfnOutput(self, "sqs-arn", value=queue.req_queue.queue_arn)
        CfnOutput(self, "sqs-url", value=queue.req_queue.queue_url)

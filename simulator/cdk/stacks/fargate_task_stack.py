import pathlib

from aws_cdk import aws_ecs as ecs, aws_ecs_patterns, aws_iam as iam, NestedStack
from constructs import Construct

from stacks.ecs_stack import EcsStack
from stacks.sqs_stack import SqsStack
from stacks.location_tracker_stack import LocationTracker


class FargateTaskStack(NestedStack):
    def __init__(
        self,
        scope: Construct,
        id: str,
        ecs_cluster: EcsStack,
        queue: SqsStack,
        tracker: LocationTracker,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        simulator_image = ecs.ContainerImage.from_asset(
            directory=str(pathlib.Path(__file__).resolve().parents[2] / "simulator")
        )

        simulator_service = aws_ecs_patterns.QueueProcessingFargateService(
            self,
            "simulator-service",
            service_name="simulator-service",
            cpu=512,
            memory_limit_mib=1024,
            image=simulator_image,
            cluster=ecs_cluster.instance,
            log_driver=ecs.AwsLogDriver(
                stream_prefix="ecs", log_group=ecs_cluster.simulator_log_group
            ),
            queue=queue.req_queue,
            environment={
                "REQ_QUEUE_URL": queue.req_queue.queue_url,
                "TRACKER_NAME": tracker.delivery_tracker.tracker_name,
            },
            max_scaling_capacity=10,
            scaling_steps=[
                {"upper": 0, "change": -1},
                {"lower": 100, "change": +1},
                {"lower": 200, "change": +2},
            ],
        )

        iam.Policy(
            self,
            "UpdateTracker",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=["geo:BatchUpdateDevicePosition"],
                    resources=[
                        tracker.delivery_tracker.attr_tracker_arn,
                    ],
                ),
            ],
            roles=[simulator_service.task_definition.task_role],
        )

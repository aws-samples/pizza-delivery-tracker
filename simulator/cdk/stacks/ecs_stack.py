from aws_cdk import (
    aws_ecs as ecs,
    aws_iam as iam,
    aws_logs,
    NestedStack,
    Resource,
    RemovalPolicy,
)
from constructs import Construct

from stacks.vpc_stack import VpcStack


class EcsStack(NestedStack):
    def __init__(self, scope: Construct, id: str, vpc: VpcStack, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        self.task_execution_role = iam.Role(
            self,
            "FargateTaskExecutionRole",
            role_name="FargateTaskExecutionRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ],
        )

        self._instance = ecs.Cluster(
            self,
            "SimulatorCluster",
            cluster_name="SimulatorCluster",
            vpc=vpc.instance,
            container_insights=True,
        )

        self.simulator_log_group = aws_logs.LogGroup(
            self,
            "simulatorLogGroup",
            log_group_name="/ecs/simulator",
            retention=aws_logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
        )

    @property
    def instance(self) -> Resource:
        return self._instance

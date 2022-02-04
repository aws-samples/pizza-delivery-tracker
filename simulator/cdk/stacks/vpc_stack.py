from aws_cdk import aws_ec2 as ec2, NestedStack, Resource
from constructs import Construct


class VpcStack(NestedStack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        self._instance = ec2.Vpc(
            self,
            "simulator-vpc",
            max_azs=2,
        )

    @property
    def instance(self) -> Resource:
        return self._instance

from aws_cdk import (
    aws_location as location,
    NestedStack,
    CfnResource,
    RemovalPolicy,
)
from constructs import Construct


class LocationTracker(NestedStack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        self._pizza_delivery_tracker = location.CfnTracker(
            self,
            "PizzaDeliveryTracker",
            tracker_name="PizzaDeliveryTracker",
            pricing_plan="RequestBasedUsage",
            position_filtering="AccuracyBased",
        )

        self._pizza_delivery_tracker.apply_removal_policy(policy=RemovalPolicy.DESTROY)

    @property
    def delivery_tracker(self) -> CfnResource:
        return self._pizza_delivery_tracker

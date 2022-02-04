const location = require("@aws-cdk/aws-location")
const cdk = require("@aws-cdk/core")

class LocationServiceRouteCalculatorStack extends cdk.NestedStack {
    constructor(scope, id, props) {
        super(scope, id, props);

        this.cfnRouteCalculator = new location.CfnRouteCalculator(
            this,
            "PizzaRouteCalculator", {
                calculatorName: "PizzaDeliveryRouteCalculator",
                dataSource: "Esri",
                pricingPlan: "RequestBasedUsage"
            }
        );
    }
}

module.exports = { LocationServiceRouteCalculatorStack };

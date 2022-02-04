const cdk = require("@aws-cdk/core")
const { DBStack } = require("./db-stack")
const { AppRunnerStack } = require("./apprunner-stack")
const { LocationServiceRouteCalculatorStack } = require("./location-service-route-calculator-stack")

class BackendStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);

        const db = new DBStack(this, "DBStack", {});

        const routeCalculator = new LocationServiceRouteCalculatorStack(
            this,
            "LocationServiceRouteCalculatorStack", {
                ROUTE_CALCULATOR_NAME: this.node.tryGetContext("ROUTE_CALCULATOR_NAME")
            }
        );

        const appRunner = new AppRunnerStack(this, "AppRunnerStack", {
            TRACKER: this.node.tryGetContext("TRACKER"),
            TRACKER_ARN: this.node.tryGetContext("TRACKER_ARN"),
            SQS_QUEUE_URL: this.node.tryGetContext("SQS_QUEUE_URL"),
            SQS_ARN: this.node.tryGetContext("SQS_ARN"),
            DDB_TABLE: db.table,
            ROUTE_CALCULATOR_NAME: routeCalculator.cfnRouteCalculator.calculatorName,
            ROUTE_CALCULATOR_ARN: routeCalculator.cfnRouteCalculator.attrCalculatorArn
        });

        new cdk.CfnOutput(this, "AppRunnerServiceUrl", {
            value: "https://" + appRunner.service.serviceUrl
        });
    }
}

module.exports = { BackendStack };

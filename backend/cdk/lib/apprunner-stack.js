const path = require("path")
const cdk = require("@aws-cdk/core")
const ecr_assets = require("@aws-cdk/aws-ecr-assets")
const apprunner = require("@aws-cdk/aws-apprunner")
const iam = require("@aws-cdk/aws-iam")

class AppRunnerStack extends cdk.NestedStack {
    constructor(scope, id, props) {
        super(scope, id, props);

        const asset = new ecr_assets.DockerImageAsset(this, "MyBuildImage", {
            directory: path.join(__dirname, "../../logic/")
        });

        const role = new iam.Role(this, "apprunner-instance-role", {
            assumedBy: new iam.ServicePrincipal("tasks.apprunner.amazonaws.com")
        });

        role.addToPolicy(
            new iam.PolicyStatement({
                resources: [props.DDB_TABLE.tableArn],
                actions: ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"]
            })
        );

        role.addToPolicy(
            new iam.PolicyStatement({
                resources: [props.SQS_ARN],
                actions: ["sqs:SendMessage"]
            })
        );

        role.addToPolicy(
            new iam.PolicyStatement({
                resources: [props.TRACKER_ARN],
                actions: ["geo:GetDevicePosition"]
            })
        );

        role.addToPolicy(
            new iam.PolicyStatement({
                resources: [props.ROUTE_CALCULATOR_ARN],
                actions: ["geo:CalculateRoute"]
            })
        );

        this.service = new apprunner.Service(this, "Service", {
            instanceRole: role,
            source: apprunner.Source.fromAsset({
                asset: asset,
                imageConfiguration: {
                    environment: {
                        TRACKER: props.TRACKER,
                        ROUTE_CALCULATOR: props.ROUTE_CALCULATOR_NAME,
                        SQS_QUEUE_URL: props.SQS_QUEUE_URL,
                        DDB_TABLE: props.DDB_TABLE.tableName,
                    }
                }
            })
        });
    }
}

module.exports = { AppRunnerStack };

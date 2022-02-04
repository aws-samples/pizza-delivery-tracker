const cdk = require("@aws-cdk/core")
const dynamodb = require("@aws-cdk/aws-dynamodb")

class DBStack extends cdk.NestedStack {
    constructor(scope, id, props) {
        super(scope, id, props);

        this.table = new dynamodb.Table(this, "Pizza-Table", {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            partitionKey: { name: "orderId", type: dynamodb.AttributeType.STRING }
        });
    }
}

module.exports = { DBStack };

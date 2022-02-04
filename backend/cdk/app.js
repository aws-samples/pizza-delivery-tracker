const cdk = require("@aws-cdk/core")
const { BackendStack } = require("./lib/backend-stack")

const app = new cdk.App();

new BackendStack(app, "BackendStack", {});

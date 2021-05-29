import * as apigtw from "@aws-cdk/aws-apigatewayv2";
import * as httpIntegrations from "@aws-cdk/aws-apigatewayv2-integrations";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import path from "path";
import config from "../stack.config.json";

export class ApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    const handler = new lambda.Function(this, "handler", {
      code: new lambda.AssetCode(path.resolve(__dirname, "dist")),
      handler: `index.${config.api.handler}`,
      runtime: lambda.Runtime.NODEJS_14_X,
      description: "An lambda to test",
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        UPSTASH_REDISS: "rediss://:5faa9cfe16d44ed1adbe366ab22623a7@us1-merry-worm-33404.upstash.io:33404",
      },
    });

    const integration = new httpIntegrations.LambdaProxyIntegration({
      handler: handler,
    });

    const endpoint = new apigtw.HttpApi(this, `Endpoint${config.apiName}`, {
      apiName: `${config.apiName}`,
      createDefaultStage: true,
      description: "Integrating HTTP API to Lambda",
      corsPreflight: {
        allowCredentials: true,
        allowHeaders: ["Origin", "Content-Type", "Accept"],
        allowMethods: [
          apigtw.CorsHttpMethod.POST,
          apigtw.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ["http://localhost:3000"],
      },
    });

    endpoint.addRoutes({
      path: "/submit",
      integration: integration,
      methods: [apigtw.HttpMethod.POST],
    });

    new cdk.CfnOutput(this, "Endpoint: ", { value: endpoint.apiEndpoint });
  }
}

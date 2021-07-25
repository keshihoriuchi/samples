import { WebSocketApi, WebSocketStage } from "@aws-cdk/aws-apigatewayv2";
import { LambdaWebSocketIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import { Stack, StackProps, Construct } from "@aws-cdk/core";

export class ApiGatewayWebsocketEchoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const defaultHandler = new NodejsFunction(this, "WsEchoDefault", {
      entry: "lambda/default.ts",
    });

    const webSocketApi = new WebSocketApi(this, "WsEcho", {
      defaultRouteOptions: {
        integration: new LambdaWebSocketIntegration({
          handler: defaultHandler,
        }),
      },
    });
    const stage = new WebSocketStage(this, "DevStage", {
      webSocketApi,
      stageName: "dev",
      autoDeploy: true,
    });

    const wsManageConnPolicy = new PolicyStatement({
      actions: ["execute-api:ManageConnections"],
      resources: [
        this.formatArn({
          service: "execute-api",
          resourceName: `${stage.stageName}/POST/*`,
          resource: webSocketApi.apiId,
        }),
      ],
    });
    defaultHandler.addToRolePolicy(wsManageConnPolicy);
  }
}

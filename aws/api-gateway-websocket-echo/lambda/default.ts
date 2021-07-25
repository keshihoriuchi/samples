import { APIGatewayProxyEvent, APIGatewayProxyResultV2 } from "aws-lambda";
import { ApiGatewayManagementApi } from "aws-sdk";

exports.handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const apigw = new ApiGatewayManagementApi({ endpoint });
    const connId = event.requestContext.connectionId!;
    await apigw
      .postToConnection({
        ConnectionId: connId,
        Data: event.body!,
      })
      .promise();
  } catch (e) {
    console.error(e);
    return { statusCode: 500 };
  }
  return { statusCode: 200 };
};

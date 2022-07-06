import { FirehoseClient, PutRecordCommand } from "@aws-sdk/client-firehose";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { TextEncoder } from "util";

const profile = "default";
const client = new FirehoseClient({
  credentials: fromIni({ profile }),
});

const params = {
  login_timestamp: new Date().toISOString(),
  user_id: "horiuchi",
};

const command = new PutRecordCommand({
  DeliveryStreamName: "sample_app1-login_request",
  Record: {
    Data: new TextEncoder().encode(JSON.stringify(params)),
  },
});

(async () => {
  const res = await client.send(command);
  console.log(res);
})();

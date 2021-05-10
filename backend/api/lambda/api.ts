import middy from "@middy/core";
import jsonBodyParser from "@middy/http-json-body-parser";
import idempotent from "middy-idempotent";
import Redis from "ioredis";

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

async function baseHandler(
  _event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const message = {
    data: {
      message: "Hello from the other Side!",
    },
  };

  return {
    statusCode: 200,
    body: JSON.stringify(message, null, 2),
  };
}

let handler = middy(baseHandler);
handler.use(jsonBodyParser()).use(
  idempotent({
    client: new Redis(process.env.UPSTASH_REDISS),
  })
);

export { handler };

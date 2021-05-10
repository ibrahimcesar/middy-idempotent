import crypto from "crypto";

interface Idempotent {
  client?: any;
}

const createHash = (event: any): string => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(event))
    .digest("base64");
};

const defaults = { client: null };

const idempotent = ({ ...opts }: Idempotent) => {
  const options = { ...defaults, ...opts };
  const idempotentBefore = async (request: any): Promise<any> => {
    const hash = createHash(request.event);

    const getByHash = await options.client.get(hash);

    if (getByHash) {
      return JSON.parse(getByHash);
    }
  };
  const idempotentAfter = async (request: any) => {
    const hash = createHash(request.event);

    const responseStr = JSON.stringify(request.response);

    await options.client.set(hash, responseStr);
  };
  const idempotentOnError = async (request: any) => {
    console.error(request);
  };

  return {
    after: idempotentAfter,
    before: idempotentBefore,
    onError: idempotentOnError,
  };
};

export default idempotent;

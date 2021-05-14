import crypto from "crypto";

interface Idempotent {
  client?: any;
  path?: "rawPath" | "rawQueryString";
  header?: string;
  body?: true | string;
}

const createHash = (event: any): string => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(event))
    .digest("base64");
};

class Persistence {

  adapter: any;
  hash: string;
  response?: string;

  constructor(adapter: any, hash: string, response?: string) {
    this.adapter = adapter,
    this.hash = hash
    this.response = response
  }

  async get(): Promise<string> {
    return await this.adapter.get(this.hash);
  }

  async set(): Promise<any> {
    return await this.adapter.set(this.hash, this.response)
  }

}

const defaults = { body: null, client: null, header: null, path: null };

const idempotent = ({ ...opts }: Idempotent) => {
  const options = { ...defaults, ...opts };
  const idempotentBefore = async (request: any): Promise<any> => {
    let hash = "";

    hash = createHash(request.event);

    if (options.path) {
      hash = createHash(request.event[options.path]);
    }

    if (options.header) {
      hash = createHash(request.event.headers[options.header]);
    }

    if (options.body) {
      hash = createHash(request.event.body);

      if (typeof options.body === "string") {
        hash = createHash(request.event.body[options.body]);
      }
    }

    const getByHash = await new Persistence(options.client, hash).get();

    if (getByHash) {
      return JSON.parse(getByHash);
    }
  };
  const idempotentAfter = async (request: any) => {
    const hash = createHash(request.event);

    const responseStr = JSON.stringify(request.response);

    await new Persistence(options.client, hash, responseStr).set();
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

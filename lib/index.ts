import crypto from "crypto";
type Adapters = 'redis' | 'dynamoDB' | 'upstash' | 'DynamoDB'
interface Idempotent {
  adapter: {
    client: any,
    port: Adapters
  }
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

const portError = `Adapter not found. Did you check you are passing one valid client and a port name?
For client check if is the correct one and if is being shipped in the lambda.
For port, possibles values are: 'redis', 'dynamoDB', 'upstash','DynamoDB'`

class Port {

  adapter: any;
  port: Adapters;
  hash: string;
  response?: string;

  constructor(adapter: any, port: Adapters, hash: string, response?: string) {
    this.adapter = adapter,
    this.hash = hash
    this.response = response
    this.port = port
  }
  
  async get(): Promise<string> {

    if (this.port === 'DynamoDB' || 'dynamodb') {
      // TODO: Logic for DynamoDB
    }

    if (this.port === 'upstash' || 'redis') {
      return await this.adapter.get(this.hash);
    }

    throw new Error(portError)
  }

  async set(): Promise<any> {
    if (this.port === 'DynamoDB' || 'dynamodb') {
      // TODO: Logic for DynamoDB
    }

    if (this.port === 'upstash' || 'redis' ) {
      return await this.adapter.set(this.hash, this.response)
    }

    throw new Error(portError)
  }

}

const defaults = { body: null, port: null, header: null, path: null };

const idempotent = ({ ...opts }: Idempotent) => {
  const options = { ...defaults, ...opts };
  const idempotentBefore = async (request: any): Promise<any> => {
    let hash = "";

    if (options.adapter.port !== 'redis' || 'dynamoDB' || 'upstash' || 'DynamoDB') {
      throw new Error(`You need to pass a valid value for adapter name. possibles values are: 'redis', 'dynamoDB', 'upstash','DynamoDB'. And you need use their respectives clients`)
    }

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

    const getByHash = await new Port(
      options.adapter.client, 
      options.adapter.port, 
      hash).get();

    if (getByHash) {
      return JSON.parse(getByHash);
    }
  };
  const idempotentAfter = async (request: any) => {
    const hash = createHash(request.event);

    const responseStr = JSON.stringify(request.response);

    await new Port(
      options.adapter.client,
      options.adapter.port,
      hash,
      responseStr).set();
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

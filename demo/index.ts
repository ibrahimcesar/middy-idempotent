import * as cdk from "@aws-cdk/core";
import { ApiStack } from "./api";
import { buildSync } from "esbuild";
import path from "path";
import config from "./stack.config.json";

buildSync({
  bundle: true,
  entryPoints: [path.resolve(__dirname, "api", "lambda", "index.ts")],
  external: ["aws-sdk"],
  format: "cjs",
  outfile: path.join(__dirname, "api", "dist", "index.js"),
  platform: "node",
  sourcemap: true,
  target: "node12",
});

const app = new cdk.App();
new ApiStack(app, `${config.apiName}-stack`);

import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import typescript from "rollup-plugin-typescript2";
import copy from 'rollup-plugin-copy'
import banner2 from 'rollup-plugin-banner2'
import json from "@rollup/plugin-json"
import { terser }  from "rollup-plugin-terser"

import packageJson from "./package.json";

const {
  version,
  name,
  license,
  repository,
  author,
} = packageJson;

export default {
  input: "./lib/index.ts",
  external: [ 'ioredis', 'crypto' ],
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true,
      exports: "default",
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true,
    }
  ],
  plugins: [peerDepsExternal(), resolve({preferBuiltins: false}), commonjs(), typescript(), terser({
  output: {
    comments: "all",
  },
}), json(), banner2(() => `/**
* ${name} v${version}
*  ${repository.url}
*
*  Copyright (c) ${author.name} < ${author.email} > and project contributors.
*
*  This source code is licensed under the ${license} license found in the
*  LICENSE file in the root directory of this source tree.
*
*  Author site: ${author.url}
*/
    `),
  copy({
      targets: [
        { src: './LICENSE', dest: 'dist' }
      ]
    })]
};
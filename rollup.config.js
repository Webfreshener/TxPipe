import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from '@rollup/plugin-json';

export default {
    input: "src/index.js",
    output: {
        file: "./dist/txpipe.js",
        format: "umd",
        name: "TxPipe",
    },
    context: "window",
    plugins: [nodeResolve(), commonjs(), json()],
};

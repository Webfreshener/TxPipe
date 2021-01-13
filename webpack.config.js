const path = require("path");
const webpackRxjsExternals = require("webpack-rxjs-externals");

module.exports = [{
    externals: [
        // webpackRxjsExternals(),
    ],
    output: {
        path: path.join(__dirname, "dist"),
        filename: 'txpipe.js',
        libraryTarget: "window",
        library: "TxPipe",
    },
    module: {
        rules: [
        ],
    },
}, {
    externals: [
        webpackRxjsExternals(),
    ],
    output: {
        path: path.join(__dirname, "dist"),
        filename: 'txpipe.node.js',
        libraryTarget: "commonjs",
        library: "TxPipe",
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
        ],
    },
}];

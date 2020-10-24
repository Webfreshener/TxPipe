/* ############################################################################
The MIT License (MIT)

Copyright (c) 2019 Van Schroeder
Copyright (c) 2019 Webfreshener, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

############################################################################ */
module.exports = {
    $id: "http://schemas.webfreshener.com/wf-express-server/service-options#",
    $schema: "http://json-schema.org/draft-07/schema#",
    additionalProperties: false,
    type: "object",
    anyOf: [
        {$ref: "#/definitions/cluster"},
        {$ref: "#/definitions/compressed"},
        {$ref: "#/definitions/empty"},
        {$ref: "#/definitions/jsonEncoding"},
        {$ref: "#/definitions/serverless"},
        {$ref: "#/definitions/staticAssetOptions"},
        {$ref: "#/definitions/routerConfigOptions"},
        {$ref: "#/definitions/urlEncoding"},
        {$ref: "#/definitions/viewEnabled"},
        {$ref: "#/definitions/verbose"},
    ],
    definitions: {
        /***
         * Clustering Config
         */
        cluster: {
            $id: "#/definitions/cluster",
            oneOf: [{
                $id: "#/definitions/cluster/oneOf/0",
                type: "boolean",
                title: "Clustering Toggle",
                default: false,
                examples: [
                    false,
                ],
            }, {
                $id: "#/definitions/cluster/oneOf/1",
                type: "boolean",
                properties: {
                    count: {
                        $id: "#/definitions/cluster/properties/count",
                        type: "number",
                        title: "Clustering Count Configuration",
                        examples: [
                            2,
                        ],
                    },
                },
            }],
        },

        /***
         * Compression
         */
        compressed: {
            $id: "#/definitions/compressed/",
            type: "boolean",
            properties: {
                compress: {
                    $id: "#/definitions/compressed/properties/compress",
                    type: "boolean",
                    title: "The Compress Schema",
                    default: true,
                    examples: [
                        true,
                    ],
                },
            },
        },

        /***
         * Empty Schema
         */
        empty: {
            $id: "#/definitions/empty",
            properties: {},
        },

        /**
         * Expose Server ID
         */
        exposeServerId: {
            $id: "#/definitions/exposeServerId",
            type: "boolean",
            default: true,
            examples: [
                true,
                false
            ]
        },

        /***
         * Host Address
         */
        host: {
            type: "string",
            pattern: "/^[a-zA-Z0-9\.\-]+$/",
            default: "0.0.0.0",
        },

        /***
         * Host Port
         */
        port: {
            type: "number",
            max: 49151,
            default: 3000,
        },

        /***
         * JSON Encoding
         */
        jsonEncoding: {
            $id: "#/definitions/jsonEncoding",
            oneOf: [{
                $id: "#/definitions/jsonEncoding/oneOf/0",
                type: "boolean",
                default: true,
            }, {
                $ref: "#/definitions/jsonEncodingOptions",
            }],
        },

        jsonEncodingOptions: {
            $id: "#/definitions/jsonEncodingOptions",
            type: "object",
            properties: {
                inflate: {
                    $id: "#/definitions/jsonEncodingOptions/properties/inflate",
                    type: "boolean",
                    title: "jsonEncoded inflate",
                    default: true,
                    examples: [
                        true,
                    ],
                },
                limit: {
                    $id: "#/definitions/jsonEncodingOptions/properties/limit",
                    type: ["number", "string"],
                    title: "jsonEncoded inflate",
                    default: "100kb",
                    examples: [
                        "100kb",
                    ],
                },
                reviver: {
                    $id: "#/definitions/jsonEncodingOptions/properties/reviver",
                    type: "string",
                    title: "json string reviver",
                    default: null,
                    examples: [
                        null,
                    ],
                },
                strict: {
                    $id: "#/definitions/jsonEncodingOptions/properties/strict",
                    type: "boolean",
                    title: "jsonEncoded strict",
                    default: true,
                    examples: [
                        true,
                    ],
                },
                type: {
                    $id: "#/definitions/jsonEncodingOptions/properties/type",
                    title: "json decode strict",
                    oneOf: [{
                        type: "string",
                        pattern: "/^[\-\w]+\/[\-\w]+$/",
                    }, {
                        type: "object",
                        properties: {},
                    }],
                    default: "application/json",
                    examples: [
                        "application/json",
                    ],
                },
                verify: {
                    $id: "#/definitions/jsonEncodingOptions/properties/verify",
                    title: "jsonEncoded strict",
                    default: void 0,
                    examples: [
                        "verify(req, res, buf, encoding) { ... }",
                    ],
                },
            },
        },

        /***
         * Router Config Options
         */
        routerConfigOptions: {
            $id: "#/definitions/routerConfigOptions",
            type: "object",
            properties: {
                caseSensitive: {
                    $id: "#/definitions/routerConfigOptions/properties/caseSensitive",
                    type: "boolean",
                    title: "Case Sensitive",
                    default: false,
                    examples: [
                        false,
                    ],
                },
                mergeParams: {
                    $id: "#/definitions/routerConfigOptions/properties/mergeParams",
                    type: "boolean",
                    title: "Merge Child and Parent Router Request Params",
                    default: false,
                    examples: [
                        false,
                    ],
                },
                strict: {
                    $id: "#/definitions/routerConfigOptions/properties/strict",
                    type: "boolean",
                    title: "Enable strict routing",
                    default: false,
                    examples: [
                        false,
                    ],
                },
            },
        },

        /***
         * AWS Serverless Support
         */
        serverless: {
            $id: "#/definitions/serverless",
            type: "boolean",
            properties: {
                enableAWSServerless: {
                    $id: "#/definitions/serverless/properties/enableAWSServerless",
                    type: "boolean",
                    title: "Execute in AWS Lambda Environment",
                    default: false,
                    examples: [
                        false,
                    ],
                },
            },
        },

        /***
         * Static Asset Options
         */
        staticAssetOptions: {
            $id: "#/definitions/staticAssetOptions",
            type: "object",
            properties: {
                dotfiles: {
                    $id: "#/definitions/staticAssets/properties/dotfiles",
                    type: "string",
                    title: "staticAssets dotFiles",
                    default: "ignore",
                    examples: [
                        "ignore",
                    ],
                },
                etag: {
                    $id: "#/definitions/staticAssets/properties/etag",
                    type: "boolean",
                    title: "staticAssets etag",
                    default: true,
                    examples: [
                        true,
                    ],
                },
                extensions: {
                    $id: "#/definitions/staticAssets/properties/extensions",
                    title: "staticAssets extensions",
                    oneOf: [{
                        type: "boolean",
                        enum: [false],
                    }, {
                        type: "string",
                        pattern: "/^[\-\w]+\/[\-\w]+$/",
                    }, {
                        type: "array",
                        items: {
                            type: "string",
                            pattern: "/^[a-zA-Z0-9]{1,4}/",
                        },
                    }],
                    default: "application/json",
                    examples: [
                        "application/json",
                    ],
                },
                fallthrough: {
                    $id: "#/definitions/staticAssets/properties/fallthrough",
                    type: "boolean",
                    title: "staticAssets fallthrough",
                    default: true,
                    examples: [
                        true,
                    ],
                },
                immutable: {
                    $id: "#/definitions/staticAssets/properties/immutable",
                    type: "boolean",
                    title: "staticAssets immutable",
                    default: true,
                    examples: [
                        true,
                    ],
                },
                index: {
                    $id: "#/definitions/staticAssets/properties/extensions",
                    title: "staticAssets extensions",
                    oneOf: [{
                        type: "boolean",
                        enum: [false],
                    }, {
                        type: "string",
                        pattern: "/^[\-a-zA-Z]+\.[\-a-zA-Z]{1,4}$/",
                    }],
                    default: "index.html",
                    examples: [
                        "index.html",
                        false,
                    ],
                },
                lastModified: {
                    $id: "#/definitions/staticAssets/properties/lastModified",
                    type: "boolean",
                    title: "staticAssets lastModified",
                    default: true,
                    examples: [
                        true,
                    ],
                },
                maxAge: {
                    $id: "#/definitions/staticAssets/properties/maxAge",
                    type: "number",
                    title: "staticAssets lastModified",
                    default: 0,
                    examples: [
                        0,
                    ],
                },
                redirect: {
                    $id: "#/definitions/staticAssets/properties/lastModified",
                    type: "boolean",
                    title: "staticAssets lastModified",
                    default: true,
                    examples: [
                        true,
                    ],
                },
                setHeaders: {
                    $id: "#/definitions/jsonEncoded/properties/verify",
                    title: "staticAssets setHeaders",
                    default: void 0,
                    examples: [
                        "fn(res, path, stat) { ... }",
                    ],
                },
            },
        },

        /***
         * URL Encoding
         */
        urlEncoding: {
            $id: "#/definitions/urlEncoding",
            oneOf: [{
                type: "boolean",
                default: true,
            }, {
                $ref: "#/definitions/urlEncodingOptions",
            }]
        },

        /***
         * URL Encoding Options
         */
        urlEncodingOptions: {
            $id: "#/definitions/urlEncodingOptions",
            type: "object",
            required: ["extended"],
            properties: {
                extended: {
                    $id: "#/definitions/urlEncoding/properties/extended",
                    type: "boolean",
                    title: "urlEncoding extended",
                    default: true,
                    examples: [
                        true,
                    ],
                },
                inflate: {
                    $id: "#/definitions/urlEncoding/properties/inflate",
                    type: "boolean",
                    title: "urlEncoding inflate",
                    default: true,
                    examples: [
                        true,
                    ],
                },
                limit: {
                    $id: "#/definitions/urlEncoding/properties/limit",
                    type: ["number", "string"],
                    title: "urlEncoding limit",
                    default: "100kb",
                    examples: [
                        "100kb",
                    ],
                },
                type: {
                    $id: "#/definitions/urlEncoding/properties/type",
                    title: "urlEncoding type",
                    oneOf: [{
                        type: "string",
                        pattern: "/^[\-\w]+\/[\-\w]+$/",
                    }, {
                        type: "object",
                        properties: {},
                    }],
                    default: "application/json",
                    examples: [
                        "application/json",
                    ],
                },
                verify: {
                    $id: "#/definitions/urlEncoding/properties/verify",
                    title: "urlEncoding verify",
                    default: void 0,
                    examples: [
                        "verify(req, res, buf, encoding) { ... }",
                    ],
                },
            },
        },

        /**
         * Verbose Logging Output
         */
        verbose: {
            $id: "#/definitions/verboseOutput",
            properties: {
              verboseOutput: {
                  $id: "#/definitions/verbose/properties/verboseOutput",
                  type: "boolean",
                  default: true,
              }
            },
        },

        /***
         * View Rendering Configuration
         */
        viewEnabled: {
            type: "object",
            required: ["templateEngine", "templatePath"],
            properties: {
                templateEngine: {
                    $id: "#/definitions/viewEnabled/properties/templateEngine",
                    type: "string",
                    title: "Enable Template Rendering",
                    default: "pug",
                    examples: [
                        "pug",
                    ],
                    pattern: "/^[a-zA-Z0-9\-_]+$/",
                },
                templatePath: {
                    $id: "#/definitions/viewEnabled/properties/templatePath",
                    type: "string",
                    title: "The Template File Path",
                    default: "pug",
                    examples: [
                        "pug",
                    ],
                    pattern: "/^[a-zA-Z0-9_\:\-\s\.]+$/",
                },
            },
        },
    },
};

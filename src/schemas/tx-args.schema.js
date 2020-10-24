export default {
    $id: "http://schemas.webfreshener.com/v1/tx-args#",
    $schema: "http://json-schema.org/draft-07/schema#",
    anyOf: [
        {$ref: "#/definitions/Schemas"},
        {$ref: "#/definitions/Schema"},
        {$ref: "#/definitions/Config"},
    ],
    definitions: {
        Config: {
            $id: "#/definitions/Config",
            type: "object",
            allOf: [{
                required: ["schemas"],
                additionalProperties: false,
                properties: {
                    schemas: {
                        $ref: "#/definitions/Schemas",
                    },
                    meta: {
                        $ref: "#/definitions/Schemas",
                    },
                    use: {
                        type: "string",
                    },
                },
            }]
        },
        Schemas: {
            $id: "#/definitions/Schemas",
            type: "array",
            items: {
                allOf: [
                    {
                        type: "object"
                    }, {
                        $ref: "#/definitions/Schema",
                    }
                ]

            },
            minItems: 1,
            maxItems: 2,
        },
        Schema: {
            $id: "#/definitions/Schema",
            properties: {
                exec: {
                    not: {},
                },
                execute: {
                    not: {},
                },
                iterate: {
                    not: {},
                },
                loop: {
                    not: {},
                },
                schemas: {
                    not: {},
                },
                meta: {
                    not: {},
                },
                use: {
                    not: {},
                },
            },
        },
    },
};

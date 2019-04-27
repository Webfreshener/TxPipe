export default {
    $id: "http://schemas.webfreshener.com/v1/tx-args#",
    schema: "http://json-schema.org/draft-07/schema#",
    oneOf: [
        {
            $ref: "#/definitions/Schema",
        },
        {
            type: "object",
            required: ["schemas"],
            properties: {
                schemas: {
                    $ref: "#/definitions/Schema",
                },
                meta: {
                    $ref: "#/definitions/Schema",
                },
                use: {
                    type: "string",
                },
            },
        },

    ],
    definitions: {
        Schema: {
            $ref: "http://json-schema.org/draft-07/schema#",
        },
        Schemas: {
            type: "array",
            items: {
                $ref: "http://json-schema.org/draft-07/schema#",
            },
            min: 2,
        },
    },
};

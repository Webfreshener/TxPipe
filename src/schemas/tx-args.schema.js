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
            additionalProperties: false,
            properties: {
                schemas: {
                    allOf: [{
                        $ref: "#/definitions/Schema",
                    }, {
                        type: ["array"],
                    }],
                },
                meta: {
                    allOf: [{
                        $ref: "#/definitions/Schema",
                    }, {
                        type: ["array"],
                    }],
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

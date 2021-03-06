export const basicModel = {
    $id: "root#",
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
        name: {
            type: "string",
        },
        age: {
            type: "number",
        },
        active: {
            type: "boolean",
        },
    },
};

export const basicCollection = {
    $id: "root#",
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "array",
    items: {
        type: "object",
        properties: {
            name: {
                type: "string",
            },
            age: {
                type: "number",
            },
            active: {
                type: "boolean",
            },
        },
    },
};

export const nameRequiredSchema = {
    $id: "root#",
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    required: ["name"],
    properties: {
        name: {
            type: "string",
        }
    }
};

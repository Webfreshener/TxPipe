export class TxWorkflow {
    constructor(workflowConfig) {

    }

    /**
     * Instantiation convenience method
     * @param workflowConfig
     * @returns {TxWorkflow}
     */
    static create(workflowConfig) {
        return new TxWorkflow(workflowConfig);
    }
}

/*
const moment = require("moment");
const _flow = {
    from: something,
    to: something,
}

const _flow1 = {
        id: "flow1#",
        schema: {},
        tags: [],
        vars: {},
        flow: {
            pipe: [{
                $ref: "addCreatedOn",
            }, {
                $ref: "saveRecord",
            }],
            split: [{
                tags: [],
                variables: {},
                schema: {},
            }],
            merge: {
                tags: [],
                variables: {},
                schema: {},
                exec: (d) => d
            },
        },
        definitions: {
            addCreatedOn: {
                tags: [],
                variables: {},
                schema: {},
                exec: (d) => Object.assign(d, {createdOn: Date.now()}),
            },
            saveRecord: {
                tags: [],
                variables: {},
                schema: {},
                exec: (d) => {
                $dbInstance.save(d);},
            },
        }
    },
};

const _flow2 = {
        schema: {},
        tags: [],
        vars: {},
        flow: [
                [
                    "pipe",
                    [{
                        tags: [],
                        variables: {},
                        schema: {},
                    }],
                ],
                [
                    "split",
                    [{
                        tags: [],
                        variables: {},
                        schema: {},
                      }, {
                        tags: [],
                        variables: {},
                        schema: {},
                     }]
                ],
                [
                    "merge",
                   {
                        tags: [],
                        variables: {},
                        schema: {},
                        exec: (d) => d
                    }
                ]
        },
    },
};

const flow3 = {
    schema: {},
    tags: [],
    variables: [],
    flow: [
        flow1,
        flow2,
    ]
}

const feaatured = new Jisty()["ns:1"].Pets
        .pipe([filter for "featured"].link(flow3);
*/

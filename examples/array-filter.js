const {TxPipe} = require("../index");
const _tx = new TxPipe(
    {
        // any json-schema creates a validator
        schema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    restrict: "/^[\w]+$/",
                },
                age: {
                    type: "number",
                    min: 21,
                    max: 130,
                },
                active: {
                    type: "boolean",
                },
            },
        },
    },
    {
        // any object with `loop` creates an iterator
        loop: (d) => {
            console.log(d.active === true);
            return d.active === true
        },
    }
);

_tx.subscribe({
    next: (d) => {
        console.log(`final result:\n${JSON.stringify(d)}`);
    },
    error: ((e) => {
        console.log(JSON.stringify(e));
    }),
});

_tx.txWrite([
    {name: "sam", age: 25, active: true},
    {name: "fred", age: 20, active: true},
    {name: "alice", age: 30, active: false},
]);

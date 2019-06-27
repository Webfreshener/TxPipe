import {TxIterator} from "./txIterator";
import {default as DefaultVO} from "./schemas/default-vo.schema";
import {TxPipe} from "./txPipe";
describe.skip("TxIterator Tests", () => {
    it("should provide a schema", () => {
        const _voSchema = JSON.stringify(DefaultVO);
        const _schemas = (new TxIterator((_) => _ * 2)).schema;
        expect(JSON.stringify(_schemas[0])).toEqual(_voSchema);
        expect(JSON.stringify(_schemas[1])).toEqual(_voSchema);
    });
    it("should loop", () => {
        const _ = (
            new TxIterator((_) => _ * 2)
        ).loop([1, 3, 5]);
        expect(`${_}`).toEqual("2,6,10");
    });
    it("should work within pipe", (done) => {
        const _cb = jest.fn();
        const _tx = new TxPipe(
            // {
            //     // any json-schema creates a validator
            //     schema: {
            //         type: "object",
            //         properties: {
            //             name: {
            //                 type: "string",
            //                 restrict: "/^[\w]+$/",
            //             },
            //             age: {
            //                 type: "number",
            //                 min: 21,
            //                 max: 130,
            //             },
            //             active: {
            //                 type: "boolean",
            //             },
            //         },
            //     },
            // },
            [{
                // any object with `loop` creates an iterator
                exec: (d) => {
                    console.log(d.active === true);
                    return d.active === true
                },
            }],
        );

        _tx.subscribe({
            next: (d) => {
                console.log(d);
                expect(_cb).toHaveBeenCalledTimes(1);
                expect(d.length).toEqual(1);
                done();
            },
            error: ((e) => {
                console.log(e);
                _cb();
            }),
        });

        _tx.txWrite([
            {name: "sam", age: 25, active: true},
            {name: "fred", age: 20, active: true},
            {name: "alice", age: 30, active: false},
        ]);
    })
});

import {TxPipe} from "./txPipe";
import {basicCollection} from "../fixtures/PropertiesModel.schemas";
import {default as data} from "../fixtures/pipes-test.data";
import {TestSubClass} from "../fixtures/pipes-instances";
import {default as _pipesOrSchemas} from"../fixtures/pipes-or-schema"

describe("TxPipes Sub-Class Tests", () => {
    const _data = {body: "ok"};
    const _res = {body: "yada-yada"};
    it("should sub class", () => {
        const _unit = new TxPipe({
            exec: () => {
                return _res
            },
        });
        const _ = new TestSubClass(_unit);
        expect(_unit.txWrite(_data).txTap()).toEqual(_res);
        expect(_.txWrite(_data).txTap()).toEqual(_res);
    });

});

describe("TXPipe Error Handling", () => {
    it("should detect validation errors", (done) => {
        const _tx = new TxPipe({
            type: "string",
        }, () => false);

        _tx.subscribe({
            next: (d) => {
                done("should have errored");
            },
            error: (e) => {
                expect(e.error[0].message).toEqual("should be string");
                done();
            }
        });

        _tx.txWrite(true);
    })
});

describe("TxPipe Tests", () => {
    let _p;
    beforeEach(() => {
        _p = new TxPipe(..._pipesOrSchemas);
    });

    it("should work as a Promise", (done) => {
        const _p = new TxPipe(..._pipesOrSchemas);
        _p.txPromise(data).then((res) => {
            expect(res.length).toEqual(3);
            done();
        }, done).catch(done);
    });

    it("async pipe should work as observable", (done) => {
        const _tx = new TxPipe(
            async () => {
                return new Promise((res) => {
                    setTimeout(
                        () => res({data: "ok"}),
                        100
                    );
                });
            });

        _tx.subscribe({
            next: (d) => {
                expect(d.data).toEqual("ok");
                done();
            },
            error: (e) => {
                done(e);
            },
        });

        _tx.txWrite({});
    });

    it("should remain viable after transaction", (done) => {
        let _cnt = 0;
        const _p = new TxPipe({type: "string"});

        _p.subscribe({
            next: () => {
                if ((++_cnt) === 2) {
                    done();
                }
            },
            error: (e) => {
                console.trace(e);
                done(e);
            }
        });

        _p.txWrite("ok");
        _p.txWrite("ok");
    });

    it("should iterate with an iterable", (done) => {
        const _cb = jest.fn();
        const _tx = new TxPipe(
            [{
                // any object with `loop` creates an iterator
                exec: (d) => d.active === true ? d : void 0,
            }],
            {
                // any json-schema creates a validator
                type: "array",
                items: {
                    type: "object",
                    required: ["age"],
                    properties: {
                        name: {
                            type: "string",
                            pattern: "^[a-zA-Z]{1,24}$",
                        },
                        age: {
                            type: "number",
                            minimum: 20,
                            maximum: 100,
                        },
                        active: {
                            type: "boolean",
                        },
                    },
                },
            },
        );

        _tx.subscribe({
            next: (d) => {
                expect(_cb).toHaveBeenCalledTimes(0);
                expect(d.length).toEqual(2);
                done();
            },
            error: (e) => {
                done(e);
            },
        });

        _tx.txWrite([
            {name: "sam", age: 25, active: true},
            {name: "fred", age: 20, active: true},
            {name: "alice", age: 30, active: false},
            {name: "Undefined", active: null},
        ]);
    });

    it("should create schema iterator if wrapped in array", (done) => {
        const _tx = new TxPipe([{type: "boolean"}]);
        const _data = [true, true, false]
        _tx.subscribe({
            next: (d) => {
                expect(d).toEqual(_data);
                done();
            },
            error: (e) => {
                done(e);
            }
        });

        _tx.txWrite(_data);

    });

    it("should be observable", (done) => {
        let _ival = 0;

        const _iterator = {
            next: () => {
                return (_ival++ < 50) ? {
                    value: _p.txWrite([data[0]]),
                    done: false,
                } : {
                    value: _p.txClose(),
                    done: true,
                }
            },
        };

        _p.subscribe({
            next: () => {
                _iterator.next()
            },
            error: (e) => done(e),
            complete: () => {
                done()
            },
        });

        _iterator.next();
    });

});

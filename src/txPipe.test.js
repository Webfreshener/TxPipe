import {TxValidator} from "./txValidator";
import {TxPipe} from "./txPipe";
import {basicCollection} from "../fixtures/PropertiesModel.schemas";
import {default as data} from "../fixtures/pipes-test.data";
import {TestSubClass} from "../fixtures/pipes-instances";

/**
 * Represents a basic TxPipe workflow signature
 * @type {{schema: {schemas: [{$schema: string, type: string, items: {type: string, properties: {name: {type: string}, active: {type: string}, age: {type: string}}}, $id: string}]}, exec: (function(*=): *|boolean)}[]}
 * @private
 */
const _pipesOrSchemas = [{
    schema: {
        schemas: [basicCollection],
    },
    exec: (d) => {
        return Array.isArray(d) ? d.filter((is) => is.active) : false
    },
}];

const _vo = {
    schema: _pipesOrSchemas[0].schema,
};

describe("TxPipe tests", () => {
    describe("TxPipe API Tests", () => {
        it("should provide a schema", () => {
            const _p = (new TxPipe(..._pipesOrSchemas)).txSchemas;
            expect(JSON.stringify(_p[0])).toEqual(
                JSON.stringify(_pipesOrSchemas[0].schema)
            );
        });

        it("should call exec and not modify contents", () => {
            const _p = new TxPipe(..._pipesOrSchemas);
            expect(_p.exec(data).length).toEqual(3);
            expect(Object.keys(_p.txTap()).length).toEqual(0);

        });

        it("should not exec until called upon", () => {
            const _cb = jest.fn();
            const _p = new TxPipe({
                    type: "string",
                },
                async () => Promise.resolve(_cb())
            );
            _p.exec("ok");
            expect(_cb).toBeCalledTimes(1);
        })

        it("should work as a Promise", (done) => {
            const _p = new TxPipe(..._pipesOrSchemas);
            _p.txPromise(data).then((res) => {
                expect(res.length).toEqual(3);
                done();
            }, done).catch(done);
        });

        it("should work with async/await", (done) => {
            const _tx = new TxPipe(
                async () => {
                    return await new Promise((res) => {
                        setTimeout(() => {
                            res({data: "ok"});
                        }, 100);
                    })
                });

            _tx.subscribe({
                next: (d) => {
                    expect(d.data).toEqual("ok");
                    done()
                },
                error: (e) => {
                    done(e);
                },
            });

            _tx.txWrite({});
        });

        it("should stop if a pipe returns false", (done) => {
            const _p = new TxPipe(
                ...[
                    ..._pipesOrSchemas,
                    {
                        exec: () => false,
                    }
                ]
            );
            const _sub = _p.subscribe({
                next: () => {
                    _sub.unsubscribe();
                    done("pipe should not have sent next notification");
                },
                error: (e) => {
                    _sub.unsubscribe();
                    expect(e.error[0].message).toEqual("should be array");
                    expect(JSON.stringify(e.data)).toEqual(JSON.stringify(data[0]));
                    done();
                },
            });

            _p.txWrite(data[0]);
            setTimeout(done, 200);
        });

        it("should provide errors", (done) => {
            const _p = new TxPipe(() => "an error message");
            const _sub = _p.subscribe({
                next: () => {
                    _sub.unsubscribe();
                    done("pipe should have errored");
                },
                error: (e) => {
                    _sub.unsubscribe();
                    expect(e.error !== void 0).toBe(true);
                    done();
                },
                complete: () => {
                    done("should not have completed");
                }
            });

            _p.txWrite(data[0]);
        });


        it("should send error if a pipe returns string", (done) => {
            const _eMsg = "an important error message for you";
            const _p = new TxPipe(
                _pipesOrSchemas,
                {
                    exec: () => _eMsg,
                }
            );
            const _sub = _p.subscribe({
                next: () => {
                    _sub.unsubscribe();
                    done("pipe should not have sent next notification");
                },
                error: (e) => {
                    _sub.unsubscribe();
                    expect(e.error).toEqual(_eMsg);
                    done();
                },
            });

            _p.txWrite(data[0]);
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

        it("pipe should pipe", (done) => {
            const _tx = new TxPipe();

            _tx.subscribe({
                next: (d) => {
                    expect(d).toEqual(data);
                    done();
                },
                error: (e) => {
                    done(e);
                }
            });

            _tx.txWrite(data);
        });
    });

    describe("TxPipes Data Tests", () => {
        let _p;

        beforeEach(() => {
            _p = new TxPipe(..._pipesOrSchemas);
        });

        it("should intake and output data", (done) => {
            const _sub = _p.subscribe({
                next: (d) => {
                    _sub.unsubscribe();
                    expect(`${JSON.stringify(d)}`).toEqual(JSON.stringify(_p.txTap()));
                    done();
                },
                error: (e) => {
                    _sub.unsubscribe();
                    done(e);
                },
            });
            _p.txWrite(data);
        });

        it("should transform data with callback", (done) => {
            const _sub = _p.subscribe({
                next: (d) => {
                    _sub.unsubscribe();
                    expect(d.length).toEqual(3);
                    expect(_p.txTap().length).toEqual(3);
                    done();
                },
                error: (e) => {
                    _sub.unsubscribe();
                    done(e);
                }
            });

            _p.txWrite(data);
        });

        it("should split pipe", () => {
            const _config = [
                {
                    exec: (d) => {
                        return d.map((m) => Object.assign(m, {name: `${m.name} RENAMED`}))
                    },
                },
                {
                    exec: (d) => d.map((m) => Object.assign(m, {age: 99})),
                },
            ];

            const _cb = jest.fn();
            _p = new TxPipe({
                exec: (d) => d
            });

            const _split = _p.txSplit(_config);
            expect(_split.length).toEqual(2);

            _split.forEach((pipe) => {
                const _sub = pipe.subscribe({
                    next: () => {
                        _cb();
                        _sub.unsubscribe();
                    },
                    error: (e) => {
                        _sub.unsubscribe();
                        throw e;
                    }
                });
            });

            setTimeout(() => {
                _p.txWrite(data);
                expect(_cb).toHaveBeenCalledTimes(2);
                expect(_split[0].txTap()[0].name.match(/.*\sRENAMED+$/)).toBeTruthy();
                expect(_split[1].txTap()[0].age).toEqual(99);
            }, 50);
        });

        it("should exec multiple pipes inline", () => {
            const _p1 = new TxPipe({
                schema: basicCollection,
                exec: (d) => d.map((m) => Object.assign(m, {name: `${m.name} RENAMED`})),
            });

            const _p2 = new TxPipe({
                schema: basicCollection,
                exec: (d) => d.map((m) => Object.assign(m, {age: 99})),
            });

            const _inline = _p.txPipe(_p1, _p2);

            _inline.txWrite(data);

            setTimeout(() => {
                expect(JSON.stringify(_inline.txSchemas[0].schemas[0].schema)).toEqual(JSON.stringify(basicCollection));
                expect(_inline.txTap().length).toEqual(data.length);
                expect(_inline.txTap()[0].name.match(/.*\sRENAMED+$/)).toBeTruthy();
                expect(_inline.txTap()[0].age).toEqual(99);
                expect(_inline.txTap()[data.length - 1].name.match(/.*\sRENAMED+$/)).toBeTruthy();
                expect(_inline.txTap()[data.length - 1].age).toEqual(99);
                _inline.txClose();
            }, 0);

        });

        it("should be iterable with txYield", () => {
            const _pOS = [
                {
                    exec: () => "foo",
                },
                new TxPipe({
                    exec: () => "bar",
                }),
                {
                    exec: () => "baz",
                },
            ];

            const _ = (new TxPipe(..._pOS)).txYield(data);

            expect(_.next().value).toBe("foo");
            expect(_.next().value).toBe("bar");
            expect(_.next().value).toBe("baz");
            expect(_.next().done).toBe(true);
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

        it("should throttle notifications based on time interval", () => {
            const _cb = jest.fn();
            const _sub = _p.txThrottle(150).subscribe(() => _cb());
            data.forEach((d) => {
                _p.txWrite([d]);
            });

            expect(_p.txErrors).toEqual(null);
            let _cnt = 0;
            const _ivl = setInterval(() => {
                expect(_cb).toHaveBeenCalledTimes(_cnt++);
                if (_cnt === data.length) {
                    clearInterval(_ivl);
                    _sub.unsubscribe();
                }
            }, 151);
        });

        it("should sample pipe data", () => {
            const _cb = jest.fn();
            _p.txSample(3).subscribe({
                next: () => _cb(),
                error: console.log,
            });

            data.slice(0, 4).forEach((m) => {
                _p.txWrite([m]);
            });

            expect(_cb).toHaveBeenCalledTimes(1);
        });

        it("should clone existing pipe", () => {
            let _cnt = 0;

            const _h = () => _cnt++;

            const _sub1 = _p.subscribe(_h);

            const _clone = _p.txClone();

            const _sub2 = _clone.subscribe(_h);

            _clone.txWrite(data);
            expect(_cnt).toEqual(2);

            _cnt = 0;

            _sub1.unsubscribe();
            _sub2.unsubscribe();
        });

        it("should link and unlink pipes", () => {
            const _cb = jest.fn();
            const _TxValidator = new TxValidator({schemas: [basicCollection]});
            const _link = new TxPipe(_TxValidator, {schemas: [basicCollection]});

            _p.txLink(_link, (d) => {
                _cb();
                return d;
            });

            _p.txWrite(data);
            expect(_p.txErrors).toEqual(null);
            expect(_cb).toHaveBeenCalledTimes(1);

            // we capture state for comparison
            const _state = `${_p}`;

            expect(`${_link}`).toEqual(`${_state}`);
            expect(`${_link}` === `${_p}`).toBe(true);

            _p.txUnlink(_link);

            // this will add an item to _p but not to _link
            _p.txWrite([
                ..._p.txTap(),
                {
                    name: "Added Item",
                    active: true,
                    age: 100,
                }
            ]);

            expect(_p.txErrors).toEqual(null);

            // we expect to discover no further executions and the state to be unchanged
            expect(_cb).toHaveBeenCalledTimes(1);
            expect(`${_link}`).toEqual(`${_state}`);
            expect(`${_link}` === `${_p}`).toBe(false);
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

        it("should close", () => {
            const _cb = jest.fn();
            const _sub = _p.subscribe({
                next: () => {
                    // will close on first invocation
                    _p.txClose();
                    _cb();
                },
                error: (e) => {
                    _sub.unsubscribe();
                    throw e;
                },
            });

            data.forEach((d) => {
                _p.txWrite(Array.isArray(_p.txTap()) ? [..._p.txTap(), d] : [d]);
            });

            expect(_p.txErrors).toEqual(null);
            expect(_p.txTap().length).toEqual(1);
            expect(_cb).toHaveBeenCalledTimes(1);
            expect(_p.txWritable).toBe(false);
            _sub.unsubscribe();
        });


        it("should merge multiple pipes into a single output", (done) => {
            const _p1 = new TxPipe({
                schema: _vo.schema,
                exec: (d) => d.map((m) => Object.assign(m, {name: `${m.name} RENAMED`})),
            });

            const _p2 = new TxPipe({
                    schema: _vo.schema,
                    exec: (d) => d.map((m) => Object.assign(m, {age: 99}))
                }
            );

            const _merged = _p.txMerge([_p1, _p2], {
                schema: _vo.schema,
                exec: (d) => d.map(
                    (m) => Object.assign(m, {active: false})
                )
            });

            let _cnt = 0;
            _merged.subscribe({
                next: (d) => {
                    if (!_cnt) {
                        _cnt++;
                        expect(_merged.txTap()[0].name.match(/.*\sRENAMED+$/)).toBeTruthy();
                        expect(_merged.txTap()[data.length - 1].name.match(/.*\sRENAMED+$/)).toBeTruthy();
                        _p2.txWrite(data);
                    } else {
                        expect(_merged.txTap().length).toEqual(data.length);
                        expect(_merged.txTap()[0].age).toEqual(99);
                        expect(_merged.txTap()[data.length - 1].age).toEqual(99);
                        done();
                    }
                }
            });

            _p1.txWrite(data);
        });
    });

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
                 done("expected data validation error");
                },
                error: (e) => {
                    expect(e.error[0].message).toEqual("should be string");
                    done();
                }
            });

            _tx.exec(true);
        })
    });
});

import {_observers, TxValidator} from "./txValidator";
import {TxPipe} from "./txPipe";
import {basicCollection} from "../fixtures/PropertiesModel.schemas";
import {default as JSONSchemaDraft04} from "../fixtures/json-schema-draft-04";
import {default as data} from "../fixtures/pipes-test.data";
import {TestUser, TestSubClass} from "../fixtures/pipes-instances";

const _schemaLess = Object.assign({}, basicCollection);
delete _schemaLess.$schema;

const _pipesOrSchemas = [{
    schema: {
        meta: [JSONSchemaDraft04],
        schemas: [_schemaLess],
    },
    exec: (d) => {
        return d ? d.filter((is) => is.active) : false;
    },
}];

const _vo = {
    schema: _pipesOrSchemas[0].schema,
};

describe("TxPipes tests", () => {
    describe("TxtPipes API Tests", () => {
        it("should provide a schema", () => {
            const _p = new TxPipe(_pipesOrSchemas[0].schema);
            expect(JSON.stringify(_p.txSchema[0])).toEqual(
                JSON.stringify([].concat(_pipesOrSchemas[0].schema.schemas).pop())
            );
        });

        it("should exec and not modify contents", () => {
            const _p = new TxPipe(_pipesOrSchemas);
            expect(_p.exec(data).length).toEqual(3);
            expect(Object.keys(_p.txTap()).length).toEqual(0);
        });


        it("should work with Promises", (done) => {
            const _p = new TxPipe(_pipesOrSchemas);
            _p.txPromise(data).then((res) => {
                expect(res.txTap().length).toEqual(3);
                done();
            }, done).catch(done);
        });

        it("should provide errors", (done) => {
            const _p = new TxPipe(_pipesOrSchemas);
            const _sub = _p.subscribe({
                next: () => {
                    _sub.unsubscribe();
                    done("pipe should have errored");
                },
                error: () => {
                    _sub.unsubscribe();
                    expect(_p.txErrors !== null).toBe(true);
                    done();
                },
            });

            _p.txWrite(data[0]);
        });
    });

    describe("TxPipes Data Tests", () => {
        let _p;

        beforeEach(() => {
            _p = new TxPipe(_pipesOrSchemas);
        });

        it("should intake and output data", (done) => {
            const _sub = _p.subscribe({
                next: (d) => {
                    _sub.unsubscribe();
                    expect(`${d}`).toEqual(JSON.stringify(_p.txTap()));
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
                    expect(d.model.length).toEqual(3);
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
            ].map((o) => Object.assign(o, _vo));

            const _cb = jest.fn();
            _p = new TxPipe();
            const _split = _p.txSplit(_config);
            expect(_split.length).toEqual(2);
            _split.forEach((pipe) => {
                const _sub = pipe.subscribe.apply(pipe, [{
                    next: (m) => {
                        _cb();
                        _sub.unsubscribe();
                    },
                    error: (e) => {
                        throw e;
                    }
                }]);
            });
            _p.txWrite(data);
            expect(_cb).toHaveBeenCalledTimes(2);
            expect(_split[0].txTap()[0].name.match(/.*\sRENAMED+$/)).toBeTruthy();
            expect(_split[1].txTap()[0].age).toEqual(99);
        });

        it("should exec multiple pipes inline", () => {
            const _p1 = new TxPipe({
                    schema: _vo.schema,
                    exec: (d) => d.map((m) => Object.assign(m, {name: `${m.name} RENAMED`})),
                });

            const _p2 = new TxPipe({
                    schema: _vo.schema,
                    exec: (d) => d.map((m) => Object.assign(m, {age: 99})),
                });

            const _inline = _p.txPipe(_p1, _p2);

            _inline.txWrite(data);

            expect(JSON.stringify(_inline.txSchema[0])).toEqual(JSON.stringify([].concat(_vo.schema.schemas).pop()));
            expect(_inline.txTap().length).toEqual(data.length);
            expect(_inline.txTap()[0].name.match(/.*\sRENAMED+$/)).toBeTruthy();
            expect(_inline.txTap()[0].age).toEqual(99);
            expect(_inline.txTap()[data.length - 1].name.match(/.*\sRENAMED+$/)).toBeTruthy();
            expect(_inline.txTap()[data.length - 1].age).toEqual(99);
            _inline.txClose();
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

        it("should clone existing `pipe`", () => {
            let _cnt = 0;

            const _h = () => _cnt++;

            const _sub1 = _p.subscribe(_h);
            const _sub2 = _p.txClone().subscribe(_h);

            _p.txWrite(data);
            expect(_cnt).toEqual(2);
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
            _p.txWrite(_p.txTap().concat({
                name: "Added Item",
                active: true,
                age: 100,
            }));

            expect(_p.txErrors).toEqual(null);

            // we expect to discover no further executions and the state to be unchanged
            expect(_cb).toHaveBeenCalledTimes(1);
            expect(`${_link}`).toEqual(`${_state}`);
            expect(`${_link}` === `${_p}`).toBe(false);
        });

        it("should be observable", (done) => {
            let _ival = 0;
            const _d = data[0];
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
                    console.log(e);
                    _sub.unsubscribe();
                },
            });

            data.forEach((d) => {
                _p.txWrite(Array.isArray(_p.txTap()) ? _p.txTap().concat(d) : [d]);
            });

            expect(_p.txErrors).toEqual(null);
            expect(_p.txTap().length).toEqual(1);
            expect(_cb).toHaveBeenCalledTimes(1);
            expect(_p.txWritable).toBe(false);
            _sub.unsubscribe();
        });


        it("should merge multiple pipes into a single output", () => {
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

            const _cb = jest.fn();
            _merged.subscribe(_cb);

            _p1.txWrite(data);

            expect(_cb).toHaveBeenCalledTimes(1);

            expect(_merged.txTap()[0].name.match(/.*\sRENAMED+$/)).toBeTruthy();
            expect(_merged.txTap()[data.length - 1].name.match(/.*\sRENAMED+$/)).toBeTruthy();

            _p2.txWrite(data);

            expect(_cb).toHaveBeenCalledTimes(2);

            expect(_merged.txTap().length).toEqual(data.length);
            expect(_merged.txTap()[0].age).toEqual(99);
            expect(_merged.txTap()[data.length - 1].age).toEqual(99);
        });
    });

    describe("TxPipes Sub-Class Tests", () => {
        const _data = {body: "ok"};
        const _res = {body: "yada-yada"};
        it("should sub class", () => {
            const _unit = new TxPipe({
                exec: (d) => {
                    return _res
                },
            });
            const _ = new TestSubClass(_unit);
            // const _ = new TestSubClass();
            expect(_unit.txWrite(_data).txTap()).toEqual(_res);
            expect(_.txWrite(_data).txTap()).toEqual(_res);
        });
        // it.skip("should nest", (done) => {
        //     const _ = new TestUser(new TxPipe({
        //             exec: () => {
        //                 body: "ok"
        //             },
        //         })
        //     );
        //     expect(_.exec(_data).pipe.txTap()).toEqual(_data);
        // });
    });

});

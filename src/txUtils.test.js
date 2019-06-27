import {fill, castToExec} from "./txUtils";
import {default as InputSchema} from "../fixtures/input.schema";
import {TxPipe} from "./txPipe";

describe("TxUtils Tests", () => {
    describe("castToExec tests", () => {
        describe("function handling", () => {
            const _func = () => ({res: true});
            it("should accept functions as pipes", () => {
                expect((typeof castToExec(_func).exec)).toEqual("function");
            });
            it("should execute functions as pipes", () => {
                expect(castToExec(_func).exec().res).toBe(true);
            });
        });
        describe.skip("iterator handling", () => {
            it("it should cast array to iterator", () => {
                const _res = castToExec([() => "ok"]);
                expect(_res instanceof TxPipe).toBe(true);
                expect(JSON.stringify(_res.exec([1, 2, 3]))).toEqual("[\"ok\",\"ok\",\"ok\"]");
            });
            it("should exec", () => {
                const _res = castToExec([() => "ok"]);
                expect(JSON.stringify(new TxPipe(_res).exec([1, 2, 3]))).toEqual("[\"ok\",\"ok\",\"ok\"]");
            });
        });
        describe("schema handling", () => {
            it("should accept json-schema", () => {
                const _s = {
                    "$id": "root#",
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "type": "object",
                    "required": ["name"],
                    "properties": {
                        "name": {
                            "type": "string"
                        }
                    }
                };
                const _res = castToExec(_s);
                expect(_res.exec({foo: "bar"})).toBe(false);
            });
            it("should validate complex schemas", () => {
                expect((castToExec(InputSchema).exec({foo: "bar"}))).toBe(false);
                expect((castToExec(InputSchema).exec({on: {foo: "bar"}}))).toBe(false);
                const _ = castToExec(InputSchema);
                const _data = {
                    on: {
                        events: ["bar"],
                        emitter: {
                            _eventsCount: 0,
                            _events: {},
                        },
                    },
                };
                const _res = _.exec(_data);

                expect(_.errors).toEqual(null);
                expect(_res).toEqual(_data);
            })
        })
    });

    describe("fill tests", () => {
        it("should fill array with a given value", () => {
            const _ = fill([], () => ({ok: true}));
            expect(_.length).toEqual(2);
            expect(_[0]().ok).toBe(true);
            expect(_[1]().ok).toBe(true);
        });

        it("should handle many callbacks", () => {
            const _ = fill([
                () => ({ok: true}),
                () => ({ok: true}),
                () => ({ok: true}),
                () => ({ok: true}),
                () => ({ok: "yada-yada"}),
            ]);
            expect(_.length).toEqual(5);
            expect(_[0]({ok: true}).ok).toBe(true);
            expect(_[_.length - 1]({ok: true}).ok).toBe("yada-yada");
        });


        it("should not replace existing values", () => {
            const _ = fill([() => ({ok: true})], (d) => d);
            expect(_.length).toEqual(2);
            expect(_[0]({ok: false}).ok).toBe(true);
            expect(_[1]({ok: false}).ok).toBe(false);
        });
    });
});

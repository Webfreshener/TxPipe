import {fill, castToExec} from "./txUtils";
import {default as InputSchema} from "../fixtures/input.schema";
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
        describe("schema handling", () => {
            it("should accept json-schema", () => {
                expect(( castToExec({
                    $id: "root#",
                    type: "object",
                    required: ["name"],
                    properties: {
                        name: {
                            type: "string",
                        }
                    },
                }).validate({foo: "bar"}))).toBe(false);
            });
            it("should validate complex schemas", () => {
                expect(( castToExec(InputSchema).validate({foo: "bar"}))).toBe(false);
                expect(( castToExec(InputSchema).validate({on: {foo: "bar"}}))).toBe(false);
                const _ = castToExec(InputSchema);
                const _res = _.validate({
                    on: {
                        events: ["bar"],
                        emitter: {
                            _eventsCount:0,
                            _events:{},
                        },
                    },
                });

                expect(_.errors).toEqual(null);
                expect(_res).toEqual(true);
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

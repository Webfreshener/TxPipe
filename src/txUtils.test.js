import {fill, castToExec} from "./txUtils";

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

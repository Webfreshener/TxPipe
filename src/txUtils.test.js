import {fill, fillCallback} from "./txUtils";

describe("TxUtils Tests", () => {
    describe("fill tests", () => {
        it("should fill array with a given value", () => {
            const _ = fill([], () => ({ok: true}));
            expect(_.length).toEqual(2);
            expect(_[0]().ok).toBe(true);
            expect(_[1]().ok).toBe(true);
        });
        it("should not replace existing values", () => {
            const _ = fill([() => ({ok: true})], (d) => d);
            expect(_.length).toEqual(2);
            expect(_[0]({ok: false}).ok).toBe(true);
            expect(_[1]({ok: false}).ok).toBe(false);
        });
    });

    describe("fillCallback tests", () => {
        it("should fill callbacks array to a minimum of two", () => {
            const _ = fillCallback([]);
            expect(_.length).toEqual(2);
            expect(_[0]({ok: true}).ok).toBe(true);
            expect(_[1]({ok: true}).ok).toBe(true);
        });

        it("should handle many callbacks", () => {
            const _ = fillCallback([
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

        it("should not replace existing callbacks", () => {
            const _ = fillCallback([() => ({ok: true})]);
            expect(_.length).toEqual(2);
            expect(_[0]({ok: false}).ok).toBe(true);
            expect(_[1]({ok: false}).ok).toBe(false);
        });

    });


});

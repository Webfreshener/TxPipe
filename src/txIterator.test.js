import {TxIterator} from "./txIterator";

describe("TxIterator Tests", () => {
    it("should loop", () => {
        const _ = (
            new TxIterator((_) => _ * 2)
        ).loop([1, 3, 5]);
        expect(`${_}`).toEqual("2,6,10");
    });
});

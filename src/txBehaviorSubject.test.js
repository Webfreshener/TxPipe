import {TxBehaviorSubject} from "./txBehaviorSubject";

describe("TxBehavior Subject Test Suite", () => {
    let _t;
    beforeEach(() => {
        _t = TxBehaviorSubject.create();
    });
    it("should handle next", (done) => {

        _t.subscribe({
            next: (d) => {
                expect(d).toEqual("ok");
                done();
            }
        });
        _t.next("ok")
    });
    it("should handle error", (done) => {

        _t.subscribe({
            error: (d) => {
                expect(d).toEqual("ok");
                done();
            }
        });
        _t.error("ok")
    });
    it("should handle complete", (done) => {

        _t.subscribe({
            complete: (d) => {
                done();
            }
        });
        _t.complete();
    })
});

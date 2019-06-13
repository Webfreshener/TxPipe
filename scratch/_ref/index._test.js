// const _nodeEvent = require("./index")();
// const EventEmitter = require("events");
// // const _emitter =
// const _goodData = {
//     on: {
//         events: ["bar", "event"],
//         // emitter: _emitter,
//     }
// };
//
// process.on('uncaughtException', (e) => {
//     console.log(e)
// });
//
// const _cb = jest.fn();
// describe.skip("Node Event Test Pipe", () => {
//     // let _tx = _nodeEvent.txWrite({
//     //     on: {
//     //         events: ["event"],
//     //         emitter: _emitter,
//     //     }
//     // });
//
//     it("should validate _txPipe", (done) => {
//         //
//         // const _e = console.error;
//         // console.error = () => {
//         //     console.error = _e;
//         //     done();
//         // };
//         const spy = jest.spyOn(console, 'error');
//         const _txPipe = require("./index")();
//         // _txPipe.subscribe({
//         //     next: (d) => {
//         //         done(`should have errored. got this instead:\n${d}`);
//         //     },
//         //     error: (e) => {
//         //         console.log("ok")
//         //         done();
//         //     }
//         // });
//         _txPipe.txWrite({on: {bad: "data"}});
//         setTimeout(() => {
//             expect(spy).toHaveBeenCalled();
//         }, 20);
//
//         // spy.mockRestore();
//     });
//
//     // it("should validate input", (done) => {
//     //     const _tx = require("./index")();
//     //     _tx.subscribe({
//     //         next: () => {
//     //             done("should have errored");
//     //         },
//     //         error: (e) => {
//     //             done();
//     //         }
//     //     });
//     //     const _goodData = {
//     //         on: {
//     //             events: ["bar"],
//     //             emitter: _emitter,
//     //     // {
//     //     //             _eventsCount:0,
//     //     //             _events:{},
//     //     //             on: () => ({
//     //     //                 error: () => false,
//     //     //                 event: () => false,
//     //     //             }),
//     //     //         },
//     //         },
//     //     };
//     //     const _badData = {on: {bad: "data"}};
//     //     // console.log(_tx.txTap());
//     //     _tx.txWrite(_badData);
//     //     // _emitter.emit("bar", "lala");
//     // });
//
//
//     // it("should handle events", () => {
//     //     const _em = new (require("events"))();
//     //     const _data = {
//     //         on: {
//     //             events: ["bar", "event"],
//     //             emitter: _em,
//     //         }
//     //     };
//     //     const _tx = require("./index")();
//     //     _tx.subscribe({
//     //         next: (n) => {
//     //             _cb();
//     //         },
//     //         error: (e) => {
//     //             done(e);
//     //         }
//     //     });
//     //     _tx.txWrite(_data);
//     //     _em.emit("event", {data: "ok-1"});
//     //     _em.emit("event", {data: "ok-2"});
//     //     expect(_cb).toHaveBeenCalledTimes(2);
//     //     // expect((typeof _tx.txTap().subscribe)).toEqual("function");
//     //     // expect((typeof _tx.txTap().events)).toEqual("object");
//     //     // expect(_tx.txTap().events[0]).toEqual("error");
//     //     // expect(_tx.txTap().events[1]).toEqual("event");
//     //     // _emitter.emit("error", "an error occurred");
//     // });
//
// });

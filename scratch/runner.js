const {TxPipe} = require("../index");
const _emitter = new (require("events"))();

const _txPipe = new TxPipe(
    {
        type: "object",
        required: ["on"],
        properties: {
            on: {
                type: "string",
            }
        }
    },
    {
        exec: (_) => {
            console.log("got to exec");
            // const _h = _handlers.get(_self).exec(_).on;
            // _h.emitter.on(_h.events[0], (d) => {
            //     console.log(d);
            // });
            return _;
        }
    }
);

_txPipe.subscribe({
    next: (d) => {
        console.log(`success: ${d}`);
    },
    error: (e) => {
        console.log(`error: ${JSON.stringify(e)}`);
    }
});
// _txPipe.txWrite({"on": "ok"});
_txPipe.txWrite({on: {events: ["bad"], emitter: _emitter}});
// _txPipe.txWrite( {bad: "data"});
// _emitter.emit("bad", {data: "bad"});

const {TxPipe} = require("../index");
const _handlers = new WeakMap();
const _events = new WeakMap();

/**
 * TxEventPipe Class
 */
class TxEventPipe extends TxPipe {
    // /**
    //  * @constructor
    //  * @param pipesOrSchemas
    //  */
    // constructor(...pipesOrSchemas) {
    //     super(...pipesOrSchemas);
    // }

    /**
     * Delegates events to designated Event Handler
     *
     * @override
     * @param handler
     * @returns {*|Promise<PushSubscription>}
     */
    subscribe(handler) {
        return _handlers.get(this).subscribe(handler);
    }
}

module.exports = () => {
    return new TxPipe({
            oneOf: [{
                type: "object",
                required: ["on"],
                properties: {
                    on: {
                        type: "string",
                    },
                }
            }, {
                type: "object",
                required: ["off"],
                properties: {
                    off: {
                        type: "string",
                    },
                }
            }]
        },
        {
            exec: (_) => {
                // console.log(_h);
                // const _h = _handlers.get(_self).exec(_).on;
                // _h.emitter.on(_h.events[0], (d) => {
                //     console.log(d);
                // });
                return _;
            }
        },
        {
            type: "object",
        }
    );
};

// /**
//  *
//  * @returns {TxEventPipe}
//  */
// module.exports = () => {
//     const _cbMap = {};
//     const _self = new TxPipe({
//             oneOf: [{
//                 type: "object",
//                 required: ["on"],
//                 properties: {
//                     on: {
//                         type: "string",
//                     },
//                 }
//             }, {
//                 type: "object",
//                 required: ["off"],
//                 properties: {
//                     off: {
//                         type: "string",
//                     },
//                 }
//             }]
//         },
//         {
//             exec: (_) => {
//                 // console.log(_h);
//                 // const _h = _handlers.get(_self).exec(_).on;
//                 // _h.emitter.on(_h.events[0], (d) => {
//                 //     console.log(d);
//                 // });
//                 return _;
//             }
//         },
//         {
//             type: "object",
//         }
//     );
//     // Object.defineProperty(_self, "subscribe", {
//     //     value: (handler) => {
//     //         // _handlers.get(_self).subscribe(handler);
//     //     }
//     // });
//     _handlers.set(_self, require("./event-handler")());
//     return _self;
// };

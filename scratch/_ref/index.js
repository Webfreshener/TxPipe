/* ############################################################################
The MIT License (MIT)

Copyright (c) 2019 Van Schroeder
Copyright (c) 2019 Webfreshener, LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

############################################################################ */
const {TxPipe} = require("../index");
const {EventSchema, InputSchema, OutputSchema} = require("./schemas");
const Pipes = require("./pipes");
const union = require("lodash.union");
const _handlers = new WeakMap();
const _events = new WeakMap();

/**
 * TxEventPipe Class
 */
class TxEventPipe extends TxPipe {
    /**
     * @constructor
     * @param pipesOrSchemas
     */
    constructor(...pipesOrSchemas) {
        super(...pipesOrSchemas);
        // console.error = (message) => {
        //     console.log(message);
        //     _handlers.get(_self).txWrite({name: "error", data: message});
        // };
        // creates event handler for event delegation

    }

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

/**
 *
 * @returns {TxEventPipe}
 */
module.exports = () => {
    const _cbMap = {};
    const _self = new TxPipe(
        InputSchema,
        {
            /**
             *
             * @param eventsOrConfigs
             * @returns {{events:[],subscribe:function}}
             */
            exec: (...eventsOrConfigs) => {
                const _addEvents = [];
                eventsOrConfigs.forEach((_eOC) => {
                    console.log(_self);
                    const _opKey = Object.keys(_eOC)[0];
                    const {emitter, events} = _eOC[_opKey];
                    console.log(_eOC[_opKey]);
                    const _op = {
                        events: events,
                        handler: _handlers.get(_self),
                    };

                    console.log(`emitter: ${emitter}`);

                    switch (_opKey) {
                        case "off":
                        case "on":
                        case "once":
                            console.log(`handling _opKey: ${_opKey}`);
                            const _txOp = Pipes[_opKey](emitter).exec(_op);
                            console.log(_events.get(_self));
                            _events.get(_self).splice(0, _events.length, ..._txOp.events);
                            Object.assign(_cbMap, _txOp.listenerCBs);
                            break;
                        default:
                            return "unknown operation";
                    }
                });

                const _len = _events.get(_self).length - 1;
                console.log(`_len: ${_len}`);
                // overwrites array with composites values
                _events.get(_self).splice(0, _len, ...union(_events.get(_self), _addEvents));
                // these values will be available via txTap
                const _res = Object.defineProperties({}, {
                    subscribe: {
                        value: _handlers.get(_self).subscribe,
                        enumerable: true,
                        configurable: false,
                    },
                    events: {
                        get: () => _events.get(_self),
                        enumerable: true,
                        configurable: false,
                    },
                });
                console.log(JSON.stringify(_res));
                return _res;
            },
            // exec: () => {
            //     _handlers.set(this, Pipes.on.exec( require("./pipes/tx-event-handler")() ));
            //     return {
            //         subscribe: ()=>{},
            //         events: ["error"],
            //     }
            // },
        },
        OutputSchema
    );
    _events.set(_self, ["error"]);
    _handlers.set(_self, Pipes.txEventHandler(() => _events.get(_self)));
    return _self;
};

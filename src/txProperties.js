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
import {TxExecutor} from "./txExecutor";
import {_observers, TxValidator} from "./txValidator";

/**
 *
 */
export class TxProperties {
    static init(txPipe, properties) {
        const {callbacks, inSchema, outSchema, txSchemas, vo, pOS, _pipes} = properties;
        const _txP = {};
        return Object.defineProperties(_txP, {
            callbacks: {
                value: callbacks,
                enumerable: true,
                configurable: false,
            },
            rate: {
                value: 1,
                enumerable: true,
                configurable: true,
            },
            links: {
                value: new WeakMap(),
                enumerable: true,
                configurable: false,
            },
            exec: {
                value: (data) => {
                    try {
                        return TxExecutor.exec(callbacks, data);
                    } catch (e) {
                        _observers.get(_txP.out).error({
                            error: e,
                            data: data,
                        });
                    }
                },
                enumerable: false,
                configurable: false,
            },
            out: {
                value: (() => {
                    const _txV = new TxValidator(outSchema);
                    // unsubscribe all observers on complete notification (freeze/close)
                    _txV.subscribe({
                        complete: () => {
                            _pipes.get(txPipe).listeners.forEach((_) => _.unsubscribe());
                            _pipes.get(txPipe).listeners = [];
                        },
                    });
                    return _txV;
                })(),
                enumerable: true,
                configurable: false,
            },
            schema: {
                value: [inSchema, outSchema],
                enumerable: true,
                configurable: false,
            },
            txSchemas: {
                // enforces 2 schema minimum (in/out)
                value: txSchemas.length < 2 ? [...txSchemas, ...txSchemas] : txSchemas,
                enumerable: true,
                configurable: false,
            },

            vo: {
                get: () => vo,
                enumerable: true,
                configurable: false,
            },
            pOS: {
                value: pOS,
                enumerable: false,
                configurable: false,
            }
        });
    }
}

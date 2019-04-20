/* ############################################################################
The MIT License (MIT)

Copyright (c) 2016 - 2019 Van Schroeder
Copyright (c) 2017-2019 Webfreshener, LLC

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
import {_observers, TxValidator} from "./txValidator";

const _pipes = new WeakMap();
const _cache = new WeakMap();

/**
 * Fills callbacks array to enforce 2 callback minimum
 * @param callbacks
 * @returns {*}
 * @private
 */
const _fillCallback = (callbacks) => {
    if (callbacks.length < 2) {
        callbacks = callbacks.concat([...Array(2 - callbacks.length)
            .fill((d) => d, 0)])
    }
    return callbacks;
};

/**
 * TxPipe Class
 */
export class TxPipe {
    constructor(vo, ...pipesOrSchemas) {
        if (!pipesOrSchemas.length) {
            throw "Pipe requires at least one schema or pipe element";
        }

        // todo: review and doc the use case for this?
        if (Array.isArray(pipesOrSchemas[0])) {
            pipesOrSchemas = pipesOrSchemas[0];
        }

        _cache.set(this, []);
        const _sub = vo.subscribe({
            next: (data) => {
                // enforces JSON formatting if feature is present
                data = data.toJSON ? data.toJSON() : data;

                // tests for presence of rate-limit timeout
                if (_pipes.get(this).tO) {
                    // caches operation for later execution. ordering is FIFO
                    _cache.get(this).splice(0, 0, () => _pipes.get(this).cb(data));
                    // cancels current execution
                    return;
                }

                // tests for interval (ivl)
                if (_pipes.get(this).ivl !== 0) {
                    // tics the counter and tests if count is fulfilled
                    if ((++_pipes.get(this).ivlVal) !== _pipes.get(this).ivl) {
                        // count is not fulfilled. stops the execution
                        return;
                    } else {
                        // resets the count and lets the operation proceed
                        _pipes.get(this).ivlVal = 0;
                    }
                }

                // capture output of callback
                const _t = _pipes.get(this).cb(data);

                /**
                 * tests if object and if object is writable
                 */
                if ((typeof _t) === "object" && !_pipes.get(this).out.isFrozen) {
                    if (_pipes.get(this).once) {
                        // if this is a `once` operation, we reset the flag and close the pipe
                        _pipes.get(this).once = false;
                        this.txClose();
                    }
                    // else we set the model for validation
                    try {
                        _pipes.get(this).out.model = _t.toJSON ? _t.toJSON() : _t;
                    } catch (e) {
                        _observers.get(_pipes.get(this).out).error(e);
                    }

                }
            },
            error: (e) => {
                // sends error notification through out validator's observable
                _observers.get(_pipes.get(this).out).error(e);
            },
            // closes pipe on `complete` notification
            complete: this.txClose,
        });

        // accepts a TxPipe, an Object with a schema param, or a straight-up schema
        const _s = pipesOrSchemas.map((_) => _.schema || _).pop();

        // enforces 2 callback minimum for `reduce` by appending pass-thru callbacks
        const _callbacks = _fillCallback(
            pipesOrSchemas.map(
                (_p) => _p.exec ? _p.exec : (_p.callback || ((d) => d))
            ),
        );

        // stores config & state

        _pipes.set(this, {
            // references the intake Validator object
            vo: vo,
            // holds `sample` interval
            ivl: 0,
            // holds `sample` interval count
            ivlVal: 0,
            // holder for `throttle` rate
            rate: 1,
            // references the output schema
            schema: _s,
            // references the output validator
            out: new TxValidator({
                schemas: Array.isArray(_s) ? _s : [_s],
            }),
            // holder for `once` flag
            once: false,
            // holder for rxjs notification handlers array
            listener: [_sub],
            // holder for linked pipe references
            links: new WeakMap(),
            // initializes callback handler
            cb: (_res) => {
                try {
                    _callbacks.forEach((_cb) => {
                        _res = _cb(_res);
                    });
                } catch (e) {
                    _observers.get(_pipes.get(this).out).error(e);
                    return false;
                }
                return _res;
            },
        });
    }

    /**
     * Creates new `txPipe` segment
     * @param pipesOrSchemas
     * @returns {TxPipe}
     */
    txPipe(...pipesOrSchemas) {
        if (Array.isArray(pipesOrSchemas[0])) {
            pipesOrSchemas = pipesOrSchemas[0];
        }

        // fixes scoping issue for inlining callbacks from external pipes
        pipesOrSchemas = pipesOrSchemas.map((pS) => {
            if (pS instanceof TxPipe) {
                return {
                    schema: pS.txSchema,
                    exec: (d) => pS.exec.apply(pS, [d]),
                };
            }
            return pS;
        });

        return new TxPipe(_pipes.get(this).out, pipesOrSchemas);
    }

    /**
     * links pipe segment to direct output to target pipe
     * @param target
     * @param callbacks function[]
     * @returns {TxPipe}
     */
    txLink(target, ...callbacks) {
        if (!(target instanceof TxPipe)) {
            throw `item for "target" was not a TxPipe`;
        }

        // allow for array literal in place of inline assignment
        if (Array.isArray(callbacks[0])) {
            callbacks = callbacks[0];
        }

        callbacks = _fillCallback(callbacks);

        // creates observer and stores it to links map for `txPipe`
        const _sub = this.subscribe({
            next: (data) => {
                let _res = data.toJSON();
                // applies all callbacks and writes to target `txPipe`
                target.txWrite(callbacks.reduce((_cb) => _res = _cb(_res)));
            },
            // handles unlink & cleanup on complete
            complete: () => this.txUnlink(target)
        });

        _pipes.get(this).links.set(target, _sub);
        return this;
    }

    /**
     * Returns validation errors
     * @returns {*}
     */
    get txErrors() {
        return _pipes.get(this).vo.errors;
    }

    /**
     * Returns JSON-SCHEMA for `txPipe` output
     * @returns {object}
     */
    get txSchema() {
        return [].concat(_pipes.get(this).schema);
    }

    /**
     * Creates array of new `txPipe` segments that run in parallel
     * @param schemasOrPipes
     * @returns {*}
     */
    txSplit(...schemasOrPipes) {
        return schemasOrPipes[0].map((o) => {
            return this.txPipe([o])
        });
    }

    /**
     * Merges multiple pipes into single output
     * @param pipeOrPipes
     * @param schema
     * @returns {TxPipe}
     */
    txMerge(pipeOrPipes, schema) {
        const _out = this.txPipe(schema);
        (Array.isArray(pipeOrPipes) ? pipeOrPipes : [pipeOrPipes])
            .forEach((_p) => {
                _pipes.get(this).listener.push(
                    _p.subscribe({
                        next: (d) => {
                            _out.txWrite(d.toJSON ? d.toJSON() : d)
                        }
                    })
                );
            });

        return _out;
    }

    /**
     * Writes data to pipe segment
     * @param data
     * @returns {TxPipe}
     */
    txWrite(data) {
        _pipes.get(this).vo.model = data;
        return this;
    }

    /**
     * Directly executes callback without effecting `txPipe` observable
     * @param data
     */
    exec(data) {
        return _pipes.get(this).cb(data);
    }

    /**
     * Creates clone of current `txPipe` segment
     * @returns {TxPipe}
     */
    txClone() {
        const {vo, schema, cb} = _pipes.get(this);
        return new TxPipe(vo, {schema: schema, callback: cb});
    }

    /**
     * Unlink `txPipe` segment from target `txPipe`
     * @param target
     * @returns {TxPipe}
     */
    txUnlink(target) {
        if (!(target instanceof TxPipe)) {
            throw `item for "target" was not a TxPipe`;
        }

        const _sub = _pipes.get(this).links.get(target);

        if (_sub) {
            _sub.unsubscribe();
            _pipes.get(this).links.delete(target);
        }

        return this;
    }

    /**
     * Terminates input on `txPipe` segment. This is irrevocable
     * @returns {TxPipe}
     */
    txClose() {
        // unsubscribe all observers
        _pipes.get(this).listener.forEach((_l) => _l.unsubscribe());
        setTimeout(() => {
            _pipes.get(this).out.freeze();
        }, 1);

        return this;
    }

    /**
     * Returns write status of `txPipe`
     * @returns {boolean}
     */
    get txWritable() {
        return _pipes.get(this).out.isFrozen;
    }

    /**
     * Informs `txPipe` to close after first notification
     * @returns {TxPipe}
     */
    txOnce() {
        _pipes.get(this).once = true;
        return this;
    }

    /**
     * Informs `txPipe` to rate limit notifications based on time interval
     * @param rate
     * @returns {TxPipe}
     */
    txThrottle(rate) {
        const _intvl = _pipes.get(this).tO;

        if (_intvl) {
            _intvl.clearInterval();
        }

        _pipes.get(this).tO = setInterval(() => {
            if (_cache.get(this).length) {
                const _func = _cache.get(this).pop();
                if ((typeof _func) === "function") {
                    _pipes.get(this).out.model = _func();
                }
            }
        }, rate);

        return this;
    }

    /**
     * Returns product of Nth occurrence of `txPipe` execution
     * @param nth
     * @returns {TxPipe}
     */
    txSample(nth) {
        _pipes.get(this).ivl = nth;
        return this;
    }

    /**
     * Subscribes to `txPipe` output notifications
     * @param handler
     * @returns {Observable}
     */
    subscribe(handler) {
        if (!(typeof handler).match(/^(function|object)$/)) {
            throw "handler required for TxPipe::subscribe";
        }

        return _observers.get(_pipes.get(this).out).subscribe(handler);
    }

    /**
     * Provides current state of `txPipe` output. alias for toJSON
     * @returns {Object|Array}
     */
    txTap() {
        return this.toJSON();
    }

    /**
     * Convenience Method for Promise based flows.
     * Writes data to `txPipe` and wraps observer in Promise
     *
     * @param data
     * @returns {Promise<TxPipe>}
     */
    async txPromise(data) {
        return await new Promise((resolve, reject) => {
            this.txWrite(data);
            if (this.txErrors !== null) {
                reject(this.txErrors);
            }
            resolve(this);
        });
    }

    /**
     * Overrides Object's toString method
     * @override
     * @returns {String}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }

    /**
     * Provides current state of `txPipe` output.
     * @override
     * @returns {Object|Array}
     */
    toJSON() {
        return _pipes.get(this).out.toJSON();
    }
}

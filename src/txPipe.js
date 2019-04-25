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
import {default as DefaultVOSchema} from "./schemas/default-vo.schema";

const _pipes = new WeakMap();
const _cache = new WeakMap();

/**
 * Fills array to enforce 2 callback minimum
 * @param arr
 * @param value
 * @param min
 * @returns {any[]}
 * @private
 */
const _fill = (arr, value, min = 2) => {
    if (arr.length >= min) {
        return arr;
    }
    const _ = (arr = arr || []).concat(
        Array(2 - arr.length).fill(value, 0)
    );

    return _;
};

/**
 *
 * @param arr
 * @returns {any[]}
 * @private
 */
const _fillCallback = (arr) => _fill(Array.isArray(arr) ? arr : [arr], (d) => d);

/**
 *
 * @param obj
 * @returns {{exec: function}|TxPipe|TxValidator}
 * @private
 */
const _castToExec = (obj) => {
    const _def = {
        schema: DefaultVOSchema,
        exec: (d) => d,
    };

    if (!obj) {
        return _def;
    }

    // -- if arg is array, we recurse
    if (Array.isArray(obj) && !(obj instanceof TxValidator)) {
        return obj.map((o) => _castToExec(o));
    }

    // -- if TxPipe, our work here is already done
    if (obj instanceof TxPipe || obj instanceof TxValidator) {
        return obj;
    }

    if (obj["exec"] && (typeof obj.exec) === "function") {
        return Object.assign(_def, obj);
    }

    // -- if is straight up schema, we create validator
    if (TxValidator.validateSchemas(obj)) {
        return new TxValidator(obj);
    }

    // attempts to map to Tx-able object
    return Object.assign(_def, obj);
};

/**
 *
 * @param args
 * @returns {any[]|{schemas: {schema, oneOf, $id}[], exec: (function(*): *)}}
 * @private
 */
const _mapArgs = (...args) => {
    if (!args.length) {
        return {
            schemas: [
                DefaultVOSchema,
                DefaultVOSchema
            ],
            exec: (d) => d,
        }
    }

    return args.map(_castToExec);
};

/**
 * TxPipe Class
 */
export class TxPipe {
    constructor(...pipesOrVOsOrSchemas) {
        pipesOrVOsOrSchemas = _mapArgs(pipesOrVOsOrSchemas[0]);
        pipesOrVOsOrSchemas = Array.isArray(pipesOrVOsOrSchemas[0]) ? pipesOrVOsOrSchemas[0] : pipesOrVOsOrSchemas;
        _cache.set(this, []);
        // enforces 2 callback minimum for `reduce` by appending pass-thru callbacks
        const _callbacks = _fillCallback(
            pipesOrVOsOrSchemas.map((_p) => (d) => {
                    return (
                        // if implements pipe api
                        (_p.exec) ||
                        // if implements validator api
                        (_p.validate ? ((d) => _p.validate(d) ? d : false) : void (0)) ||
                        // default
                        ((_) => _)
                    ).apply(_p, [d]);
                }
            ),
        );

        const _inPipe = pipesOrVOsOrSchemas[0];

        const _inSchema = _inPipe.schema[0] ||
            (Array.isArray(_inPipe.schema.schemas) ? _inPipe.schema.schemas[0] : void (0)) ||
            DefaultVOSchema;

        const _outPipe = pipesOrVOsOrSchemas[pipesOrVOsOrSchemas.length - 1];

        const _outSchema = _outPipe.schema[1] ||
            (_outPipe.schema.schemas ?
                _outPipe.schema.schemas[_outPipe.schema.schemas.length - 1] : void (0)) ||
            _inSchema ||
            DefaultVOSchema;

        const _inVO = (_inPipe instanceof TxValidator) ? _inPipe : new TxValidator(_inSchema);

        // stores config & state
        _pipes.set(this, {
            // references the intake Validator object
            vo: _inVO,
            // holds `sample` interval
            ivl: 0,
            // holds `sample` interval count
            ivlVal: 0,
            // holder for `throttle` rate
            rate: 1,
            // references the output schema
            schema: [_inSchema, _outSchema],
            // references the output validator
            out: (() => {
                const _txV = new TxValidator(_outSchema);
                // unsubscribe all observers on complete notification (freeze/close)
                _txV.subscribe({
                    complete: () => {
                        _pipes.get(this).listeners.forEach((_l) => _l.unsubscribe());
                        _pipes.get(this).listeners = [];
                    },
                });
                return _txV;
            })(),
            listeners: [],
            // holder for linked pipe references
            links: new WeakMap(),
            // initializes callback handler
            cb: (_res = false) => _cbRunner(_callbacks, _res),
        });

        const _self = this;
        _pipes.get(this).listeners = [
            _pipes.get(this).vo.subscribe(
                {
                    next: (data) => {
                        // enforces JSON formatting if feature is present
                        data = data.toJSON ? data.toJSON() : data;

                        // tests for presence of rate-limit timeout
                        if (_pipes.get(_self).tO) {
                            // caches operation for later execution. ordering is FIFO
                            _cache.get(_self).splice(0, 0, () => _pipes.get(_self).cb(data));
                            // cancels current execution
                            return;
                        }

                        // tests for interval (ivl)
                        if (_pipes.get(_self).ivl !== 0) {
                            // tics the counter and tests if count is fulfilled
                            if ((++_pipes.get(_self).ivlVal) !== _pipes.get(_self).ivl) {
                                // count is not fulfilled. stops the execution
                                return;
                            } else {
                                // resets the count and lets the operation proceed
                                _pipes.get(_self).ivlVal = 0;
                            }
                        }

                        // capture output of callback
                        const _t = _pipes.get(_self).cb(data);

                        // tests if object and if object is writable
                        if ((typeof _t) === "object" && _self.txWritable) {
                            const _out = (_) => {
                                // else we set the model for validation
                                try {
                                    _pipes.get(_self).out.model = _.toJSON ? _.toJSON() : _;
                                } catch (e) {
                                    _observers.get(_pipes.get(_self).out).error(e);
                                }
                            };

                            if (_t instanceof Promise) {
                                return _t.then((_) => _out(_));
                            }

                            _out(_t);
                        }
                    },
                    error: (e) => {
                        // sends error notification through out validator's observable
                        _observers.get(_pipes.get(_self).out).error(e);
                    },
                    // closes pipe on `complete` notification
                    complete: () => _self.txClose(),
                }
            )];
    }

    /**
     * Creates new `txPipe` segment
     * @param pipesOrSchemas
     * @returns {TxPipe}
     */
    txPipe(...pipesOrSchemas) {
        return new TxPipe([].concat(_pipes.get(this).out, pipesOrSchemas));
    }

    get schema() {
        return _pipes.get(this).schema;
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

        callbacks = _fillCallback(callbacks || []);

        // creates observer and stores it to links map for `txPipe`
        const _sub = this.subscribe({
            next: (data) => {
                const _res = _cbRunner(callbacks, data.toJSON ? data.toJSON() : data);
                if (_res instanceof Promise) {
                    return _res.then((_) => target.txWrite(_));
                }

                target.txWrite(_res);
            },
            // handles unlink & cleanup on complete
            complete: () => this.txUnlink(target)
        });

        _pipes.get(this).links.set(target, _sub);
        return this;
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
        return (
            Array.isArray(schemasOrPipes[0]) ? schemasOrPipes[0] : schemasOrPipes
        ).map((o) => this.txPipe(o));
    }

    /**
     * Merges multiple pipes into single output
     * @param pipeOrPipes
     * @param pipeOrSchema
     * @returns {TxPipe}
     */
    txMerge(pipeOrPipes, pipeOrSchema = {schemas: [DefaultVOSchema]}) {
        const _out = this.txPipe(pipeOrSchema);
        _pipes.get(this).listeners = _pipes.get(this).listeners
            .concat(
                // -- feeds output of map to listeners array
                (Array.isArray(pipeOrPipes) ? pipeOrPipes : [pipeOrPipes])
                    .map((_p) => _p.subscribe((d) => {
                            // -- all pipes now write to output tx
                            _out.txWrite(d.toJSON ? d.toJSON() : d);
                        })
                    )
            );
        // -- returns output tx for observation
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
        return new TxPipe(vo, {schema: schema, exec: (d) => cb(d), value: this.txTap()});
    }


    /**
     * Terminates input on `txPipe` segment. This is irrevocable
     * @returns {TxPipe}
     */
    txClose() {
        _pipes.get(this).out.freeze();
        return this;
    }

    /**
     * Returns write status of `txPipe`
     * @returns {boolean}
     */
    get txWritable() {
        return !_pipes.get(this).out.isFrozen;
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

        if (rate >= 0) {
            _pipes.get(this).tO = setInterval(
                () => {
                    if (_cache.get(this).length) {
                        const _func = _cache.get(this).pop();
                        if ((typeof _func) === "function") {
                            _pipes.get(this).out.model = _func();
                        }
                    }
                    delete _pipes.get(this).tO;
                },
                parseInt(rate, 10)
            );
        }
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

        return _pipes.get(this).out.subscribe(handler);
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

/**
 * Promise-safe callback iterator for TxPipe transactions
 * @param callbacks
 * @returns {{next: (function(*=): *)}}
 * @private
 */
const _cbIterator = (...callbacks) => {
    let _idx = -1;
    if (Array.isArray(callbacks[0])) {
        callbacks = callbacks[0];
    }
    const _handler = (callback, dataOrPromise) => {
        // tests if Promise
        if (dataOrPromise instanceof Promise) {
            // delegates Promise
            return (async (d) => await new Promise(
                    (resolve) => d.then((_) => resolve(callback(_)))
                )
            )(dataOrPromise);
        }
        return callback(dataOrPromise);
    };

    return {
        next: (data) => {
            return (_idx++ < (callbacks.length - 1)) ? {
                value: ((data) => _handler(callbacks[_idx], data))(data),
                done: false,
            } : {
                value: data || false,
                done: true,
            };
        },
    };
};
/**
 *
 * @param callbacks
 * @param data
 * @returns {*}
 * @private
 */
const _cbRunner = (callbacks, data) => {
    const _it = _cbIterator(callbacks);
    let _done = false;
    let _value = data;
    while (!_done) {
        let {done, value} = _it.next(_value);
        _done = done;
        _value = value;
    }
    // todo: review for refactor/removal
    // } catch (e) {
    //     _observers.get(_pipes.get(this).out).error(e);
    //     return false;
    // }
    return _value;
};

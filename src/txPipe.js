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
import {_observers, TxValidator} from "./txValidator";
import {fillCallback, mapArgs} from "./txUtils";
import {TxExecutor} from "./TxExecutor";
import {default as DefaultVOSchema} from "./schemas/default-vo.schema";
import {TxProperties} from "./txProperties";

const _pipes = new WeakMap();
const _cache = new WeakMap();

/**
 * TxPipe Class
 */
export class TxPipe {
    static getExecs(_pvs) {
        return _pvs.map((_p) => ((d) => {
            return (
                // is pipe or implements pipe api
                (_p.exec) ||
                // is validator or implements validator api
                (_p.validate ? (
                    (d) => _p.validate(d) ? d : false
                ) : void (0)) ||
                // default
                ((_) => _)
            ).apply(_p, [d])
    })
        );
    }


    constructor(...pipesOrVOsOrSchemas) {
        _pipes.set(this, {});
        _cache.set(this, []);

        pipesOrVOsOrSchemas = [].concat(mapArgs(...pipesOrVOsOrSchemas));
        // enforces 2 callback minimum for `reduce` by appending pass-thru callbacks
        const _callbacks = fillCallback(TxPipe.getExecs(pipesOrVOsOrSchemas));

        console.log(`_callbacks: ${_callbacks[0]}`);

        const _inPipe = (
            Array.isArray(pipesOrVOsOrSchemas) && pipesOrVOsOrSchemas.length
        ) ? pipesOrVOsOrSchemas[0] : pipesOrVOsOrSchemas.length ?
            pipesOrVOsOrSchemas : {
                schema: [DefaultVOSchema, DefaultVOSchema],
                exec: (d) => d,
            };

        // const _inSchema = _inPipe.schema[0] ||
        //     (Array.isArray(_inPipe.schema.schemas) ? _inPipe.schema.schemas[0] : void (0)) ||
        //     DefaultVOSchema;
        //
        // const _outSchema = _outPipe.schema && _outPipe.schema[1] ? _outPipe.schema[1] :
        //     (_outPipe.schema && _outPipe.schema.schemas ?
        //         _outPipe.schema.schemas[_outPipe.schema.schemas.length - 1] : void (0)) ||
        //     _inSchema ||
        //     DefaultVOSchema;
        //
        // const _outPipe = pipesOrVOsOrSchemas.length ?
        //     pipesOrVOsOrSchemas[pipesOrVOsOrSchemas.length - 1] :
        //     pipesOrVOsOrSchemas;

        const _pSchemas = [].concat(pipesOrVOsOrSchemas.filter((_p) => {
            return (_p instanceof TxValidator) || (_p.hasOwnProperty("schema") && (
                Array.isArray(_p.schema) || TxValidator.validateSchemas(_p.schema)
            ));
        }));

        const _getInSchema = (schemas) => {
            if (_pSchemas.length) {
                return (_pSchemas[0] instanceof TxValidator) ?
                    _pSchemas[0].schema : _pSchemas[0];
            }
            return DefaultVOSchema;
        };

        const _inSchema = _getInSchema(_pSchemas);
        const _outSchema = _pSchemas.length > 1 ? _pSchemas[_pSchemas.length - 1] : _inSchema;

        // stores config & state
        _pipes.set(this,
            TxProperties.init(this, {
                vo: (_inPipe instanceof TxValidator) ? _inPipe : new TxValidator(_inSchema),
                callbacks: _callbacks,
                inSchema: _inSchema,
                outSchema: _outSchema,
                pOS: pipesOrVOsOrSchemas,
                _pipes: _pipes,
            }),
        );

        _pipes.get(this).ivl = 0;
        _pipes.get(this).ivlVal = 0;
        _pipes.get(this).listeners = [PipeListener.create(this)];
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

        callbacks = fillCallback(callbacks || []);

        // creates observer and stores it to links map for `txPipe`
        const _sub = this.subscribe({
            next: (data) => {
                const _res = TxExecutor.exec(callbacks, data.toJSON ? data.toJSON() : data);
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
     * Iterates pipe callbacks via generator function
     * @param data
     * @returns {generator}
     */
    /**
     *
     * @param data
     * @returns {Object|Array}
     */
    txYield(data) {
        // const _fill = fillCallback(_pipes.get(this).pOS.map((_p) => (d) => {
        //         // todo: DRY this out
        //         return (
        //             // if implements pipe api
        //             (_p.exec) ||
        //             // if implements validator api
        //             (_p.validate ? ((d) => _p.validate(d) ? d : false) : void (0)) ||
        //             // default
        //             ((_) => _)
        //         ).apply(_p, [d]);
        //     }
        // ));
        const _fill = _pipes.get(this).pOS.map((_p) => (d) => {
                // todo: DRY this out
                return (
                    // if implements pipe api
                    (_p.exec) ||
                    // if implements validator api
                    (_p.validate ? ((d) => _p.validate(d) ? d : false) : void (0)) ||
                    // default
                    ((_) => _)
                ).apply(_p, [d]);
            }
        );
        const _f = new Function("$scope", "$cb",
            [
                "return (function* (data) {",
                Object.keys(_fill.length ? _fill : [(d) => d])
                    .map((_) => `yield data = ($cb[${_}].bind($scope))(data)`)
                    .join("; "),
                "}).bind($scope);",
            ].join(" "));

        const _tx = _f(this, _pipes.get(this).callbacks)(data);
        _tx.next();
        return _tx;
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
                    .filter((_p) => ((typeof _p.subscribe) === "function"))
                    .map((_p) => {
                        _p.subscribe((d) => {
                            // -- all pipes now write to output tx
                            _out.txWrite(d.toJSON ? d.toJSON() : d);
                        })
                    })
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
        return _pipes.get(this).exec(data);
    }

    /**
     * Creates clone of current `txPipe` segment
     * todo: make this safe
     * @returns {TxPipe}
     */
    txClone() {
        const $ref = _pipes.get(this);
        const _cz = class extends TxPipe {
            constructor() {
                super();
                _pipes.set(this, $ref);
                // -- this is where we need to sanitize the clone
                //     TxProperties.init(this, {
                //         vo: _pipes.get(this).vo,
                //         callbacks: $ref.callbacks,
                //         inSchema: $ref.schema[0],
                //         outSchema: $ref.schema[1],
                //         pOS: $ref.pOS,
                //         _pipes: _pipes,
                //     }),
                // );
                // _pipes.get(this).listeners = [].concat($ref.listeners);
                // console.log(_pipes.get(this).listeners);
            }
        };
        return new _cz();
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

export class PipeListener {
    /**
     *
     * @param data
     * @returns {Promise<void | never>}
     */
    next(data) {
        // enforces JSON formatting if feature is present
        data = data.toJSON ? data.toJSON() : data;

        // tests for presence of rate-limit timeout
        if (_pipes.get(this.target).tO) {
            // caches operation for later execution. ordering is FIFO
            _cache.get(this.target).splice(0, 0, () => _pipes.get(this.target).cb(data));
            // cancels current execution
            return;
        }

        // tests for interval (ivl)
        if (_pipes.get(this.target).ivl !== 0) {
            // tics the counter and tests if count is fulfilled
            if ((++_pipes.get(this.target).ivlVal) !== _pipes.get(this.target).ivl) {
                // count is not fulfilled. stops the execution
                return;
            } else {
                // resets the count and lets the operation proceed
                _pipes.get(this.target).ivlVal = 0;
            }
        }

        // capture output of callback
        const _t = _pipes.get(this.target).exec(data);

        // tests if object and if object is writable
        if ((typeof _t) === "object" && this.target.txWritable) {
            const _out = (_) => {
                // else we set the model for validation
                try {
                    _pipes.get(this.target).out.model = _.toJSON ? _.toJSON() : _;
                } catch (e) {
                    _observers.get(_pipes.get(this.target).out).error(e);
                }
            };

            if (_t instanceof Promise) {
                return _t.then((_) => _out(_));
            }

            _out(_t);
        }
    }

    /**
     *
     * @param e
     */
    error(e) {
        // sends error notification through out validator's observable
        _observers.get(_pipes.get(this.target).out).error(e);
    }

    /**
     *
     */
    complete() {
        _target.txClose();
    }

    /**
     *
     * @param target
     */
    constructor(target) {
        Object.defineProperty(this, "target", {
            value: target,
            enumerable: false,
            configurable: false,
        });
        _pipes.get(target).vo.subscribe(this);
    }

    /**
     *
     * @param target
     * @returns {PipeListener}
     */
    static create(target) {
        return new PipeListener(target);
    }
}

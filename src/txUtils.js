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
import {TxIterator} from "./txIterator";
import {TxPipe} from "./txPipe";
import {TxValidator} from "./txValidator";
import {default as DefaultVOSchema} from "./schemas/default-vo.schema"

const DefaultPipeTx = {
    schema: DefaultVOSchema,
    exec: (d) => d,
};

/**
 * Fills array to enforce 2 callback minimum
 * @param arr
 * @param value
 * @param min
 * @returns {any[]}
 */
export const fill = (arr, value = ((d) => d), min = 2) => {
    arr = [...arr];
    if (arr.length >= min) {
        return arr;
    }
    return [
        ...(arr = arr || []),
        ...(Array(min - arr.length).fill(value, 0))
    ];
};

/**
 *
 * @param obj
 * @returns {{exec: function}|TxIterator|TxPipe|TxValidator}
 */
export const castToExec = (obj) => {
    if (!obj) {
        return DefaultPipeTx;
    }

    // // block out TxIterator stuff..
    // if (obj instanceof TxIterator) {
    //     return obj;
    // }
    //
    // // -- if arg is array and not a Validator we cast to Iterator
    // if (Array.isArray(obj) && !(obj instanceof TxValidator)) {
    //     const _it = new TxIterator(...obj);
    //     obj = {
    //         exec: (d) => {
    //             console.log(`exec loop: ${JSON.stringify(d)}`);
    //             return _it.loop(d);
    //         }
    //     };
    // }
    //
    // // -- if has loop, creates Iterator
    // if (obj.loop) {
    //     return new TxIterator(...(Array.isArray(obj.loop) ? obj.loop : [obj.loop]));
    // }

    // -- if is pipe config item, we normalize for intake
    if ((typeof obj) === "function") {
        return Object.assign({}, DefaultPipeTx, {exec: obj});
    }

    // -- if is pipe config item, we normalize for intake
    if ((typeof obj.exec) === "function") {
        return Object.assign({}, DefaultPipeTx, obj);
    }

    // -- if TxPipe, our work here is already done
    if (obj instanceof TxPipe) {
        return obj;
    }

    // -- if is JSON-Schema, cast as TxValidator instance
    if (TxValidator.validateSchemas(obj)) {
        obj = new TxValidator(obj);
    }

    // -- wraps Validators as Exec'bles
    if ((typeof obj["validate"]) === "function") {
        // return Object.assign({}, DefaultValidatorTx, obj);
        return Object.defineProperties({}, {
            exec: {
                value: (d) => {
                    const _res = obj["validate"](d);
                    if (!_res || (typeof _res) === "string") {
                        return _res;
                    }
                    return d;
                },
                enumerable: true,
                configurable: false,
            },
            schema: {
                get: () => obj.schema,
                enumerable: true,
                configurable: false,
            },
            errors: {
                get: () => obj.errors,
                enumerable: true,
                configurable: false,
            },
        });
    }

    // attempts to map to Tx-able object
    return Object.assign({}, DefaultPipeTx, obj);
};

/**
 *
 * @param cb
 * @returns {function(*): any}
 */
export const handleAsync = (cb) => (async (d) => await new Promise(
    (resolve) => d.then((_) => resolve(cb(_)))
        .catch((e) => {
            return JSON.stringify(e);
        })
).catch((e) => {
    return JSON.stringify(e);
}));

/**
 *
 * @param cb
 * @returns {Function}
 */
export const wrapCallback = (cb) => ((dataOrPromise) => {
    if (dataOrPromise instanceof Promise) {
        // delegates Promise
        return handleAsync(dataOrPromise);
    }

    return cb(dataOrPromise)
});

/**
 *
 * @param args
 * @returns {*[]|{schema: {schema, anyOf, $id}, exec: (function(*): *)}[]}
 */
export const mapArgs = (...args) => {
    if (!args.length) {
        return [DefaultPipeTx, DefaultPipeTx];
    }

    // normalizes args list and wraps in txPipe Protocol
    return [...args].map(castToExec);
};

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
    arr = [].concat(arr);
    if (arr.length >= min) {
        return arr;
    }
    return (arr = arr || []).concat(
        Array( min - arr.length).fill(value, 0)
    );
};

/**
 *
 * @param arr
 * @returns {any[]}
 * @deprecated
 */
export const fillCallback = (arr) => fill(arr); //fill(Array.isArray(arr) ? arr : [arr], (d) => d);

/**
 *
 * @param obj
 * @returns {{exec: function}|TxPipe|TxValidator}
 */
export const castToExec = (obj) => {
    if (!obj) {
        return DefaultPipeTx;
    }

    // -- if arg is array, we recurse
    if (Array.isArray(obj) && !(obj instanceof TxValidator)) {
        return obj.map((o) => castToExec(o));
    }

    // -- if TxPipe, our work here is already done
    if (obj instanceof TxPipe || obj instanceof TxValidator) {
        return obj;
    }

    // -- if is pipe config item, we normalize for intake
    if ((typeof obj.exec) === "function") {
        return Object.assign({}, DefaultPipeTx, obj);
    }

    // -- if is straight up schema, we create validator instance
    if (TxValidator.validateSchemas(obj)) {
        return new TxValidator(obj);
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
));

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
    return [].concat(...args).map(castToExec);
};

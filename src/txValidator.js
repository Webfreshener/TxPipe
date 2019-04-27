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
import {AjvWrapper} from "./_ajvWrapper";
import {BehaviorSubject} from "rxjs/Rx";
import {default as TxArgs} from "./schemas/tx-args.schema";
import {default as DefaultVO} from "./schemas/default-vo.schema";
const _models = new WeakMap();
const _validators = new WeakMap();
export const _observers = new WeakMap();

const argsValidator = new AjvWrapper({schemas: [TxArgs]});

export class TxValidator {
    /**
     *
     * @param schemas
     * @returns {boolean}
     */
    static validateSchemas(schemas) {
        if (schemas.hasOwnProperty("schema")) {
            if (typeof schemas.schema === "object") {
                return argsValidator.exec(TxArgs.$id, schemas.schema);
            }
        }
        return argsValidator.exec(TxArgs.$id, schemas);
    }

    /**
     * Accepts one `json-schema` or `tx-config` per instance and an (optional) Ajv config
     * @param schemaOrConfig
     * @param options (optional)
     */
    constructor(schemaOrConfig, options) {
        if (!schemaOrConfig) {
            throw "Schema or Schema Config required";
        }
        if (!TxValidator.validateSchemas(schemaOrConfig)) {
            throw "Unable to process schema"
        }

        if (!schemaOrConfig.hasOwnProperty("schemas")) {
            schemaOrConfig = {
                schemas: Array.isArray(schemaOrConfig) ? schemaOrConfig : [schemaOrConfig],
            };
        }

        Object.defineProperty(this, "schema", {
            get: () => schemaOrConfig || {schemas:[DefaultVO]},
            enumerable: true,
            configurable: false,
        });

        const _baseSchema = schemaOrConfig.schemas[schemaOrConfig.schemas.length - 1] || DefaultVO;

        // this is just a quick guess at our default data type (object|array)
        _models.set(this, _baseSchema.hasOwnProperty("items") ? [] : {});

        _observers.set(this, new BehaviorSubject(null).skip(1));
        _validators.set(this, new AjvWrapper(schemaOrConfig, options || {}));
    }

    /**
     * Applies Object.freeze to model and triggers complete notification for pipe
     * @returns {TxValidator}
     */
    freeze() {
        _models.set(this, Object.freeze(_models.get(this)));
        _observers.get(this).complete();
        return this;
    }

    /**
     * Getter for Object.isFrozen status of this node and it's ancestors
     * @returns {boolean}
     */
    get isFrozen() {
        return Object.isFrozen(_models.get(this));
    }

    /**
     * Getter for validation errors incurred from model setter
     * @returns {*}
     */
    get errors() {
        return _validators.get(this).$ajv.errors;
    }

    /**
     * Registers notification handler to observable
     * @param handler
     * @returns {*}
     */
    subscribe(handler) {
        return _observers.get(this).subscribe(handler);
    }

    /**
     * Performs validation of value without effecting state
     * @param value
     */
    validate(value) {
        const $id = AjvWrapper.getSchemaID(this.schema.schemas[0] || this.schema);
        return _validators.get(this).exec($id, value);
    }

    /**
     * Setter for validator data value
     * @param data
     */
    set model(data) {
        if (this.isFrozen) {
            return;
        }

        if (this.validate(data)) {
            _models.set(this, data);
            _observers.get(this).next(this);
        } else {
            _observers.get(this).error(this.errors);
        }
    }

    /**
     * Getter for validator data value
     * @returns {{}|[]}
     */
    get model() {
        const _d = _models.get(this);
        return Array.isArray(_d) ? [].concat(_d) : Object.assign({}, _d);
    }

    /**
     * Provides model value as JSON
     * @returns {{}|*[]}
     */
    toJSON() {
        return this.model;
    }

    /**
     * Overrides toString. Provides model value as String
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.model);
    }

    /**
     * Overrides valueOf. Provides model value as JSON
     * @returns {{}|*[]}
     */
    valueOf() {
        return this.model;
    }
}

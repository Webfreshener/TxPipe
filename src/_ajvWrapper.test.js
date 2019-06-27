import {AjvWrapper} from "./_ajvWrapper";
import {default as TxArgsSchema} from "./schemas/tx-args.schema";
import {default as JSONSchemaV4} from "../fixtures/json-schema-draft-04";
import {basicModel} from "../fixtures/PropertiesModel.schemas";

describe("AJVWrapper Tests", () => {
    let _ajv = null;
    const _data = {
        name: "Test",
        active: "true",
        age: 99
    };

    describe("AJV Schema Validation", () => {
        beforeEach(() => {
            _ajv = new AjvWrapper({
                schemas: [basicModel],
            });
        });

        it("should accept valid schemas", () => {
            const _res = _ajv.exec(basicModel.$id, Object.assign(_data, {active: true}));
            // should have no validator errors
            expect(_ajv.$ajv.errors).toEqual(null);
            // validator should return true
            expect(_res).toBe(true);
        });
    });

    describe("Meta-Schemas", () => {
        const _04Schema = Object.assign({}, basicModel, {
            $schema: "http://json-schema.org/draft-04/schema#"
        });

        it("should reject < draft-07 schema refs", () => {
            _ajv = new AjvWrapper({
                schemas: [_04Schema],
            });

            // should fail with errors
            expect(_ajv.$ajv.errors === null).toBe(false);
        });

        it("should reject with meta-schema", () => {
            _ajv = new AjvWrapper({
                meta: [JSONSchemaV4],
                schemas: [_04Schema],
            });

            // should fail with errors
            expect(_ajv.$ajv.errors === null).toBe(true);
        });
    });

    describe("Schema as Data Validation", () => {
        beforeEach(() => {
            _ajv = new AjvWrapper({
                schemas: [TxArgsSchema],
            });
        });

        it("should reject invalid data", () => {
            const _res = _ajv.exec(TxArgsSchema.$id, {
                schema: {},
                exec: () => {
                },
            });
            // should have errors
            expect(_ajv.$ajv.errors === null).toBe(false);
            // validator result should be false
            expect(_res).toBe(false);

        });
    });
});


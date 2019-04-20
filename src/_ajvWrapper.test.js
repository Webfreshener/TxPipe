import Ajv from "ajv";
import {AjvWrapper} from "./_ajvWrapper";
import {default as JSONSchemaV4} from "../fixtures/json-schema-draft-04";
import {basicModel} from "../fixtures/PropertiesModel.schemas";
import {TxValidator} from "./txValidator";

describe("AJVWrapper Tests", () => {
    describe("AJV Standalone -- version integrity & debug", () => {
        it("should validate schemas", () => {
            const _data = {
                name:"Test",
                active: "true",
                age: 99
            };

            const _schemaLess = Object.assign({}, basicModel);
            delete _schemaLess.$schema;

            const _ajv = new AjvWrapper({
                meta: [JSONSchemaV4],
                schemas: [_schemaLess],
            });

            let _res = _ajv.exec(basicModel.$id, _data);

            // should fail with errors
            expect(_ajv.$ajv.errors === null).toBe(false);
            expect(_res).toBe(false);

            _res = _ajv.exec(basicModel.$id, Object.assign(_data, {active: true}));

            // should succeed
            expect(_ajv.$ajv.errors === null).toBe(true);
            expect(_res).toBe(true);
        });

        it("should handle Handle Meta-Schemas", () => {
            const _data = {
                name:"Test",
                active: "true",
                age: 99
            };

            const _ajv = new AjvWrapper({
                meta: [JSONSchemaV4],
                schemas: [basicModel],
            });

            let _res = _ajv.exec(basicModel.$id, _data);

            // should fail with errors
            expect(_ajv.$ajv.errors === null).toBe(false);
            expect(_res).toBe(false);

            _res = _ajv.exec(basicModel.$id, Object.assign(_data, {active: true}));

            // should succeed
            expect(_ajv.$ajv.errors === null).toBe(true);
            expect(_res).toBe(true);
        });
    });

    // describe("AJVWrapper", () => {
    //     it("should handle v4 Schemas", () => {
    //         const opts = {
    //             schemaId: "auto",
    //             jsonPointers: true,
    //             allErrors: false,
    //             extendRefs: true,
    //         };
    //
    //         const schemas = {
    //             meta: [JSONSchemaV4],
    //             schemas: [OpenAPIv2],
    //             // use: "http://swagger.io/v2/schema.json#"
    //         };
    //
    //         const _ajv = new AjvWrapper(schemas, opts);
    //         const _isValid = _ajv.exec("http://swagger.io/v2/schema.json#", PetStoreV2);
    //
    //         rxvo.model = PetStoreV2;
    //
    //         expect(rxvo.errors).toBe(null);
    //         expect(_isValid).toBe(true);
    //     });
    // });
});


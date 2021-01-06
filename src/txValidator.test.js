import {TxValidator} from "./txValidator";
import {basicModel, nameRequiredSchema} from "../fixtures/PropertiesModel.schemas";
import {default as DefaultVO} from  "./schemas/default-vo.schema";
describe("TxValidator Test Suite", () => {
   describe("Schema Handling", () => {
      it("should accept stand-alone schema", () => {
         const _txV = new TxValidator(DefaultVO);
         expect(_txV.errors).toEqual(null);
      });
      it("should accept schema config", () => {
          const _txV = new TxValidator( {
              schemas: [DefaultVO]
          });
          expect(_txV.errors).toEqual(null);
      });
   });
   describe("TxValidator.validateSchemas", () => {
      it("should pass valid schema", () => {
         expect(TxValidator.validateSchemas(nameRequiredSchema)).toEqual(true);
      })
   });
   describe("basic validation", () => {
      let _txV;
      beforeEach(() => {
         _txV = new TxValidator( {
            meta: [],
            schemas: [basicModel]
         });
      });
      it("should validate data", () => {
         _txV.model = {
            name: "test",
            active: true,
            age: 99,
         };
         expect(_txV.errors === null).toBe(true);
         _txV.model = {
            name: "test",
            active: "true",
            foo: "bar",
            age: "99",
         };
         expect(_txV.errors === null).toBe(false);
      });
   });

   // TODO: find other use-case for meta besides Schema Draft 04 (no longer supported)
   describe.skip("validation with meta", () => {
      let _txV;
      beforeEach(() => {
         _txV = new TxValidator( {
            meta: [JSONSchemaDraft04],
            schemas: [Object.assign(basicModel, {
               $schema: "http://json-schema.org/draft-04/schema#",
            })],
         });
      });
      it("should validate data with meta", () => {
         _txV.model = {
            name: "test",
            active: true,
            age: 99,
         };
         expect(_txV.errors === null).toBe(true);
         _txV.model = {
            name: "test",
            active: "true",
            foo: "bar",
            age: "99",
         };
         expect(_txV.errors === null).toBe(false);
      });
   });
});

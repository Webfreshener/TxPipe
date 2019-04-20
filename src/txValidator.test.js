import {TxValidator} from "./txValidator";
import {basicModel} from "../fixtures/PropertiesModel.schemas";
import {default as JSONSchemaDraft04} from "../fixtures/json-schema-draft-04";

describe("TxValidator Test Suite", () => {
   let _txV;
   beforeEach(() => {
      _txV = new TxValidator( {
         meta: [JSONSchemaDraft04],
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
   }) ;
});

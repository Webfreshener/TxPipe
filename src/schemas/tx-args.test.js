import {TxValidator} from "../txValidator";
import {basicModel} from "../../fixtures/PropertiesModel.schemas";
import {default as TxArgsSchema} from "./tx-args.schema";
describe("Tx-Args Schema Tests", () => {
    let _txValidator;
    beforeEach(() => {
        try {
            _txValidator = new TxValidator(TxArgsSchema);
        } catch (e) {
            console.log(e);
        }
    });

    it("should accept valid json-schema", () => {
        _txValidator.validate(basicModel);
        expect(_txValidator.errors).toEqual(null);
    });

    it("should accept valid schema config", () => {
        _txValidator.validate({schemas: [basicModel]});
        expect(_txValidator.errors).toEqual(null);
    });

    it("should accept an array of schemas", () => {
        _txValidator.validate([basicModel, basicModel]);
        expect(_txValidator.errors).toEqual(null);
    });

    it("should reject executable object", () => {
        expect(
            _txValidator.validate({schema: {}, exec: () => {}})
        ).toEqual(false);

    });

    // it("should reject executable array", () => {
    //     expect(
    //         _txValidator.validate([{schema: {}, exec: () => {}}])
    //     ).toEqual(false);
    //
    // });

    it("should reject iterable object", () => {
        expect(
            _txValidator.validate({schema: {}, iterate: () => {}, loop: () => {}})
        ).toEqual(false);
    });
});

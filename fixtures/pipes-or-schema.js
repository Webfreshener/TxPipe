import {basicCollection} from "./PropertiesModel.schemas";

/**
 * Represents a basic TxPipe workflow signature
 * @type {{schema: {schemas: [{$schema: string, type: string, items: {type: string, properties: {name: {type: string}, active: {type: string}, age: {type: string}}}, $id: string}]}, exec: (function(*=): *|boolean)}[]}
 * @private
 */
export default [{
    schema: {
        schemas: [basicCollection],
    },
    exec: (d) => {
        return Array.isArray(d) ? d.filter((is) => is.active) : false
    },
}];

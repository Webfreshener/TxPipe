import {TxExecutor} from "./txExecutor";
import {TxPipe} from "./txPipe";

const _iterators = new WeakMap();
const _schemas = new WeakMap();

export class TxIterator {
    constructor(...pipesOrSchemas) {
        _schemas.set(this, new TxPipe(...pipesOrSchemas).schema);
        _iterators.set(this, [...pipesOrSchemas]);
    }

    get schema() {
        return _schemas.get(this);
    }

    loop(records) {
        if (!Array.isArray(records)) {
            return "iterators accept iterable values only"
        }
        return records.map((_) => {
            return TxExecutor.exec(_iterators.get(this), _)
        });
    }
}

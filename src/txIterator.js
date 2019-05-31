import {TxExecutor} from "./txExecutor";
import {TxPipe} from "./txPipe";

const _iterators = new WeakMap();
const _schemas = new WeakMap();

export class TxIterator {
    constructor(...pipesOrSchemas) {
        _schemas.set(this, (new TxPipe(...pipesOrSchemas).schema));
        _iterators.set(this, [].concat(...pipesOrSchemas));
    }

    get schema() {
        return _schemas.get(this);
    }

    loop(records) {
        return records.map((_) => TxExecutor.exec(_iterators.get(this), _));
    }
}

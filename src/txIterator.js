import {TxExecutor} from "./txExecutor";
import {TxPipe} from "./txPipe";

const _iterators = new WeakMap();

export class TxIterator {
    constructor(...pipesOrSchemas) {
        _iterators.set(this, (d) => (
                new TxPipe(...pipesOrSchemas)
            ).exec(d)
        );
    }

    get schema() {
        return _iterators.get(this).schema
    }

    exec(records) {
        return [...records].map(_iterators.get(this));
    }
}

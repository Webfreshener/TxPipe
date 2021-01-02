import {TxExecutor} from "./txExecutor";
import {TxPipe} from "./txPipe";

const _iterators = new WeakMap();
const _pipes = new WeakMap();

export class TxIterator {
    constructor(...pipesOrSchemas) {
        const _pipe = new TxPipe(...pipesOrSchemas);
        _pipes.set(this, _pipe);
        _iterators.set(this, [...pipesOrSchemas]);
    }

    get schema() {
        return _pipes.get(this).schema;
    }

    loop(records) {
        if (!Array.isArray(records)) {
            return "iterators accept iterable values only"
        }

        let _res = [];

        records.forEach(
            (_) => {
                const _it = _pipes.get(this).txYield(_);
                let _done = false;
                let _value = _;
                while (!_done) {
                    let {done, value} = _it.next(_value);
                    if (!(_done = done)) {
                        _value = value;
                    }
                }

                if (_value) {
                    _res[_res.length] = _value;
                }

            });

        return _res;
    }
}

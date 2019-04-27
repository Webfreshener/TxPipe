import {TxPipe} from "../src";
import {TxValidator} from "../src";
import {default as DefaultSchema} from "../src/schemas/default-vo.schema";
const _pipes = new WeakMap();
export class TestUser {
    constructor(...pipesOrSchemas) {
        _pipes.set(this, new TxPipe(false,pipesOrSchemas));
    }
    get pipe() {
        return _pipes.get(this);
    }

    exec(data) {
        return this.pipe.exec(data);
    }
}

export class TestSubClass extends TxPipe {
    constructor(...pipesOrSchemas) {
        super(
            // {schemas:[DefaultSchema]},
            // new TxPipe(
            //     [].concat(pipesOrSchemas, {exec: (d) => d})
            // ),
            pipesOrSchemas,
        );
    }
}
# TxPipe

Observable Transaction Pipes with JSON-Schema Validation

[Online Developer Documentation](https://webfreshener.github.io/RxVO/)

### Goals

* Provide a quick and easy mechanism to transform and validate data
* Provide a means to control and filter the flow of data throughout an application

### Table of Contents

**[Installation Instructions](#installation-instructions)**

**[Usage Examples](#usage-examples)**

**[Class Methods](#class-methods)**

## Installation Instructions

```
 npm i -s txpipe 
```

## Usage Examples

### Schema Based Filtering

By wrapping a JSON-Schema or Function into brackets, it acts as a filter, discarding items that fail

```
import {TxPipe} from "txpipe";
/*
    defines a schema that requires name, age and active attributes
    filters out all items that do not conform to JSON-Schema below
 */
const schema = {
    type: "object",
    required: ["name", "age", "active"],
    properties: {
        name: {
            $comment: "names must be in form: First Middle|MI Last",
            type: "string",
            pattern: "^[a-zA-Z]{1,24}\\s?[a-zA-Z]?\\s+[a-zA-Z]{1,24}$",
        },
        age: {
            $comment: "age must be a number equal to or higher than 21 and lower than 100",
            type: "number",
            minimum: 21,
            maximum: 100,
        },
        active: {
            $comment: "active must equal true",
            type: "boolean",
            const: true,
        },
    },
};


const _tx = new TxPipe(
    // By nesting an item schema within an iterator, the schema is applied as a filter
    [schema],
);

_tx.subscribe({
    next: (d) => {
        // should only contain active people who are 21 and over
        console.log(`\nfilter result:\n${JSON.stringify(d)}`);
    },
    error: (e) => {
        // in filter mode it should not encounter an error unless it is critical, so full stop
        console.error(`\ngot error:\n${JSON.stringify(e)}`);
    },
});

_tx.txWrite([
    {name: "Alice Dodson", age: 30, active: false}, // will be filtered because of active status
    {name: "Jim-Bob", age: 21, active: true}, // will be filtered because of name format
    {name: "Bob Roberts", age: 38, active: true}, // will pass
    {name: "Chris Appleton", age: 19, active: true}, // will be filtered because of age
    {name: "Fred Franks", age: 20, active: true}, // will be filtered because of age
    {name: "Sam Smith", age: 25, active: true}, // will pass
    {name: "", active: null}, // will be filtered because of invalid object format
]);
```

### Transformation & Validation

Placement of JSON-Schema at the top level of TxPipe inputs will validate the entire data model and pass/fail at any
stage in the TxPipe execution it occupies

```
import {TxPipe} from "txpipe";
/*
    defines a schema that requires an array of objects
    validates entire model as per the JSON-Schema below
 */
const schema = {
    type: "array",
    items: {
        type: "object",
        required: ["name", "age", "active"],
        properties: {
            name: {
                $comment: "names must be in form: First Middle|MI Last",
                type: "string",
                pattern: "^[a-zA-Z]{1,24}\\s?[a-zA-Z]?\\s+[a-zA-Z]{1,24}$",
            },
            age: {
                $comment: "age must be a number equal to or higher than 21 and lower than 100",
                type: "number",
                minimum: 21,
                maximum: 100,
            },
            active: {
                $comment: "active must equal true",
                type: "boolean",
                const: true,
            },
        },
    },
};

/*
    This TxPipe shows a basic use-case where we perform a transformation on the data model
    The Array brackets denote a TxIterator instance will operate iteratively
 */
const _validator = new TxPipe(
    [
        // any function wrapped in a JS Array will allow operate iteratively upon all items in the set
        (d) => Object.assign({}, d,{active: true}),
        // the list can go on ...
    ],
    // JSON-Schema on the top level will validate and pass/fail the entire model
    // bear in mind that schema validation is in itself a pipeline execution stage
    schema,
    // the list can go on ...
);

_validator.subscribe({
    // should only contain active people who are 21 and over
    next: (d) => console.log(`\nvalidate result:\n${JSON.stringify(d)}`),
    // in validator mode, any model that doesn't validate will trigger an error
    // you could also choose to take action on the error by forking error object to other pipe
    error: (e) => console.log(`\nvalidate error:\n${JSON.stringify(e)}`),
});

// -- this set is invalid and will fail
_validator.txWrite([
    {name: "Alice Dodson", age: 30, active: false}, // will pass after "active" value transform in TxPipe
    {name: "Jim-Bob", age: 21, active: true}, // will be filtered because of name format
    {name: "Bob Roberts", age: 38, active: true}, // will pass
    {name: "Chris Appleton", age: 19, active: true}, // will be filtered because of age
    {name: "Fred Franks", age: 20, active: true}, // will be filtered because of age
    {name: "Sam Smith", age: 25, active: true}, // will pass
    {name: "", active: null}, // will be filtered because of invalid object format
]);

// note: even after error notification, TxPipe is still viable
// -- this set is valid and will pass
_validator.txWrite([
    {name: "Alice Dodson", age: 30, active: false}, // will pass after "active" value transform in TxPipe
    {name: "Bob Roberts", age: 38, active: true}, // will pass
    {name: "Sam Smith", age: 25, active: true}, // will pass
]);

```

## Class Methods

| Method        | Arguments | Description  |
|:--------------|:----------|:-------|
| constructor | ...pipesOrSchemas | Class constructor method |
| exec | data (object/array)| Executes pipe's callback as non-transactional pass-through |
| subscribe | handler (object / function)| Subscribes to `pipe` output notifications |
| toJSON | | Provides current state of `pipe` output as JSON |
| toString | | Provides current state of `pipe` output as JSON string |
| txClone | | Returns clone of current `pipe` segment |
| txClose | | Terminates input on `pipe` segment |
| txWritable [getter] | | Returns write status of `pipe` |
| txLink | target (Pipe), ...pipesOrSchemas | links `pipe` segment to direct output to target `pipe` |
| txMerge | pipeOrPipes, schema | Merges multiple pipes into single output |
| txPipe | ...pipesOrSchemas | Returns new chained `pipe` segment |
| txSample | nth | Returns product of Nth occurrence of `pipe` execution |
| txSplit | ...pipesOrSchemas | Creates array of new `pipe` segments that run in parallel |
| txTap | | Provides current state of `pipe` output. alias for `toJSON` |
| txThrottle | rate (number) | Limit notifications to rate based on time interval |
| txUnlink | target (Pipe)| Unlinks `pipe` segment from target `pipe` |
| txWrite | data (object/array)| Writes data to `pipe` |
| txYield | data (object/array)| Executes `pipe` as generator, yielding output via `next` iterator callback |

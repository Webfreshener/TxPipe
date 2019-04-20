# TxPipe

[Online Developer Documentation](https://webfreshener.github.io/RxVO/)

### Goals 
 * Provide a quick and easy mechanism to transform and validate data
 * Provide a means to control and filter the flow of data throughout an application

### Table of Contents

**[Installation Instructions](#installation-instructions)**

**[Usage Examples](#usage-examples)**

#### Installation Instructions
```
$ npm i txpipe 
```

#### Usage Example 
```


```

Observable Transaction Pipes with JSON-Schema Validation

#### TxPipe Class ####
| Method        | Arguments | Description  |
|:--------------|:----------|:-------|
| constructor | vo, ...pipesOrSchemas | Class constructor method |
| exec | data (object/array)| Executes pipe's callback with data without writing to `pipe` |
| subscribe | handler (object / function)| Subscribes to `pipe` output notifications |
| toJSON | | Provides current state of `pipe` output as JSON |
| toString | | Provides current state of `pipe` output as JSON string |
| txClone | | Returns clone of current `pipe` segment |
| txClose | | Terminates input on `pipe` segment |
| txWritable [getter] | | Returns write status of `pipe` |
| txLink | target (Pipe), ...pipesOrSchemas | links `pipe` segment to direct output to target `pipe` |
| txMerge | pipeOrPipes, schema | Merges multiple pipes into single output |
| txOnce | | Informs `pipe` to close after first notification |
| txPipe | ...pipesOrSchemas | Returns new chained `pipe` segment |
| txSample | nth | Returns product of Nth occurrence of `pipe` execution |
| txSplit | ...pipesOrSchemas | Creates array of new `pipe` segments that run in parallel |
| txTap | | Provides current state of `pipe` output. alias for `toJSON` |
| txThrottle | rate (number) | Limit notifications to rate based on time interval |
| txUnlink | target (Pipe)| Unlinks `pipe` segment from target `pipe` |
| txWrite | data (object/array)| Writes data to `pipe` |

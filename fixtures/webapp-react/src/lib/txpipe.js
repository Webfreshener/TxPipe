var TxPipe = (function (exports) {
	'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function getAugmentedNamespace(n) {
		if (n.__esModule) return n;
		var a = Object.defineProperty({}, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	function createCommonjsModule(fn) {
	  var module = { exports: {} };
		return fn(module, module.exports), module.exports;
	}

	var rules = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getRules = exports.isJSONType = void 0;
	const _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
	const jsonTypes = new Set(_jsonTypes);
	function isJSONType(x) {
	    return typeof x == "string" && jsonTypes.has(x);
	}
	exports.isJSONType = isJSONType;
	function getRules() {
	    const groups = {
	        number: { type: "number", rules: [] },
	        string: { type: "string", rules: [] },
	        array: { type: "array", rules: [] },
	        object: { type: "object", rules: [] },
	    };
	    return {
	        types: { ...groups, integer: true, boolean: true, null: true },
	        rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
	        post: { rules: [] },
	        all: { type: true, $comment: true },
	        keywords: { type: true, $comment: true },
	    };
	}
	exports.getRules = getRules;

	});

	var applicability = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
	function schemaHasRulesForType({ schema, self }, type) {
	    const group = self.RULES.types[type];
	    return group && group !== true && shouldUseGroup(schema, group);
	}
	exports.schemaHasRulesForType = schemaHasRulesForType;
	function shouldUseGroup(schema, group) {
	    return group.rules.some((rule) => shouldUseRule(schema, rule));
	}
	exports.shouldUseGroup = shouldUseGroup;
	function shouldUseRule(schema, rule) {
	    var _a;
	    return (schema[rule.keyword] !== undefined || ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== undefined)));
	}
	exports.shouldUseRule = shouldUseRule;

	});

	var code = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
	class _CodeOrName {
	}
	exports._CodeOrName = _CodeOrName;
	exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
	class Name extends _CodeOrName {
	    constructor(s) {
	        super();
	        if (!exports.IDENTIFIER.test(s))
	            throw new Error("CodeGen: name must be a valid identifier");
	        this.str = s;
	    }
	    toString() {
	        return this.str;
	    }
	    emptyStr() {
	        return false;
	    }
	    get names() {
	        return { [this.str]: 1 };
	    }
	}
	exports.Name = Name;
	class _Code extends _CodeOrName {
	    constructor(code) {
	        super();
	        this._items = typeof code === "string" ? [code] : code;
	    }
	    toString() {
	        return this.str;
	    }
	    emptyStr() {
	        if (this._items.length > 1)
	            return false;
	        const item = this._items[0];
	        return item === "" || item === '""';
	    }
	    get str() {
	        var _a;
	        return ((_a = this._str) !== null && _a !== void 0 ? _a : (this._str = this._items.reduce((s, c) => `${s}${c}`, "")));
	    }
	    get names() {
	        var _a;
	        return ((_a = this._names) !== null && _a !== void 0 ? _a : (this._names = this._items.reduce((names, c) => {
	            if (c instanceof Name)
	                names[c.str] = (names[c.str] || 0) + 1;
	            return names;
	        }, {})));
	    }
	}
	exports._Code = _Code;
	exports.nil = new _Code("");
	function _(strs, ...args) {
	    const code = [strs[0]];
	    let i = 0;
	    while (i < args.length) {
	        addCodeArg(code, args[i]);
	        code.push(strs[++i]);
	    }
	    return new _Code(code);
	}
	exports._ = _;
	const plus = new _Code("+");
	function str(strs, ...args) {
	    const expr = [safeStringify(strs[0])];
	    let i = 0;
	    while (i < args.length) {
	        expr.push(plus);
	        addCodeArg(expr, args[i]);
	        expr.push(plus, safeStringify(strs[++i]));
	    }
	    optimize(expr);
	    return new _Code(expr);
	}
	exports.str = str;
	function addCodeArg(code, arg) {
	    if (arg instanceof _Code)
	        code.push(...arg._items);
	    else if (arg instanceof Name)
	        code.push(arg);
	    else
	        code.push(interpolate(arg));
	}
	exports.addCodeArg = addCodeArg;
	function optimize(expr) {
	    let i = 1;
	    while (i < expr.length - 1) {
	        if (expr[i] === plus) {
	            const res = mergeExprItems(expr[i - 1], expr[i + 1]);
	            if (res !== undefined) {
	                expr.splice(i - 1, 3, res);
	                continue;
	            }
	            expr[i++] = "+";
	        }
	        i++;
	    }
	}
	function mergeExprItems(a, b) {
	    if (b === '""')
	        return a;
	    if (a === '""')
	        return b;
	    if (typeof a == "string") {
	        if (b instanceof Name || a[a.length - 1] !== '"')
	            return;
	        if (typeof b != "string")
	            return `${a.slice(0, -1)}${b}"`;
	        if (b[0] === '"')
	            return a.slice(0, -1) + b.slice(1);
	        return;
	    }
	    if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
	        return `"${a}${b.slice(1)}`;
	    return;
	}
	function strConcat(c1, c2) {
	    return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str `${c1}${c2}`;
	}
	exports.strConcat = strConcat;
	// TODO do not allow arrays here
	function interpolate(x) {
	    return typeof x == "number" || typeof x == "boolean" || x === null
	        ? x
	        : safeStringify(Array.isArray(x) ? x.join(",") : x);
	}
	function stringify(x) {
	    return new _Code(safeStringify(x));
	}
	exports.stringify = stringify;
	function safeStringify(x) {
	    return JSON.stringify(x)
	        .replace(/\u2028/g, "\\u2028")
	        .replace(/\u2029/g, "\\u2029");
	}
	exports.safeStringify = safeStringify;
	function getProperty(key) {
	    return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _ `[${key}]`;
	}
	exports.getProperty = getProperty;

	});

	var scope = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = void 0;

	class ValueError extends Error {
	    constructor(name) {
	        super(`CodeGen: "code" for ${name} not defined`);
	        this.value = name.value;
	    }
	}
	exports.varKinds = {
	    const: new code.Name("const"),
	    let: new code.Name("let"),
	    var: new code.Name("var"),
	};
	class Scope {
	    constructor({ prefixes, parent } = {}) {
	        this._names = {};
	        this._prefixes = prefixes;
	        this._parent = parent;
	    }
	    toName(nameOrPrefix) {
	        return nameOrPrefix instanceof code.Name ? nameOrPrefix : this.name(nameOrPrefix);
	    }
	    name(prefix) {
	        return new code.Name(this._newName(prefix));
	    }
	    _newName(prefix) {
	        const ng = this._names[prefix] || this._nameGroup(prefix);
	        return `${prefix}${ng.index++}`;
	    }
	    _nameGroup(prefix) {
	        var _a, _b;
	        if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || (this._prefixes && !this._prefixes.has(prefix))) {
	            throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
	        }
	        return (this._names[prefix] = { prefix, index: 0 });
	    }
	}
	exports.Scope = Scope;
	class ValueScopeName extends code.Name {
	    constructor(prefix, nameStr) {
	        super(nameStr);
	        this.prefix = prefix;
	    }
	    setValue(value, { property, itemIndex }) {
	        this.value = value;
	        this.scopePath = code._ `.${new code.Name(property)}[${itemIndex}]`;
	    }
	}
	exports.ValueScopeName = ValueScopeName;
	const line = code._ `\n`;
	class ValueScope extends Scope {
	    constructor(opts) {
	        super(opts);
	        this._values = {};
	        this._scope = opts.scope;
	        this.opts = { ...opts, _n: opts.lines ? line : code.nil };
	    }
	    get() {
	        return this._scope;
	    }
	    name(prefix) {
	        return new ValueScopeName(prefix, this._newName(prefix));
	    }
	    value(nameOrPrefix, value) {
	        var _a;
	        if (value.ref === undefined)
	            throw new Error("CodeGen: ref must be passed in value");
	        const name = this.toName(nameOrPrefix);
	        const { prefix } = name;
	        const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
	        let vs = this._values[prefix];
	        if (vs) {
	            const _name = vs.get(valueKey);
	            if (_name)
	                return _name;
	        }
	        else {
	            vs = this._values[prefix] = new Map();
	        }
	        vs.set(valueKey, name);
	        const s = this._scope[prefix] || (this._scope[prefix] = []);
	        const itemIndex = s.length;
	        s[itemIndex] = value.ref;
	        name.setValue(value, { property: prefix, itemIndex });
	        return name;
	    }
	    getValue(prefix, keyOrRef) {
	        const vs = this._values[prefix];
	        if (!vs)
	            return;
	        return vs.get(keyOrRef);
	    }
	    scopeRefs(scopeName, values = this._values) {
	        return this._reduceValues(values, (name) => {
	            if (name.scopePath === undefined)
	                throw new Error(`CodeGen: name "${name}" has no value`);
	            return code._ `${scopeName}${name.scopePath}`;
	        });
	    }
	    scopeCode(values = this._values, usedValues, getCode) {
	        return this._reduceValues(values, (name) => {
	            if (name.value === undefined)
	                throw new Error(`CodeGen: name "${name}" has no value`);
	            return name.value.code;
	        }, usedValues, getCode);
	    }
	    _reduceValues(values, valueCode, usedValues = {}, getCode) {
	        let code$1 = code.nil;
	        for (const prefix in values) {
	            const vs = values[prefix];
	            if (!vs)
	                continue;
	            const nameSet = (usedValues[prefix] = usedValues[prefix] || new Set());
	            vs.forEach((name) => {
	                if (nameSet.has(name))
	                    return;
	                nameSet.add(name);
	                let c = valueCode(name);
	                if (c) {
	                    const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
	                    code$1 = code._ `${code$1}${def} ${name} = ${c};${this.opts._n}`;
	                }
	                else if ((c = getCode === null || getCode === void 0 ? void 0 : getCode(name))) {
	                    code$1 = code._ `${code$1}${c}${this.opts._n}`;
	                }
	                else {
	                    throw new ValueError(name);
	                }
	            });
	        }
	        return code$1;
	    }
	}
	exports.ValueScope = ValueScope;

	});

	var codegen = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;


	var code_2 = code;
	Object.defineProperty(exports, "_", { enumerable: true, get: function () { return code_2._; } });
	Object.defineProperty(exports, "str", { enumerable: true, get: function () { return code_2.str; } });
	Object.defineProperty(exports, "strConcat", { enumerable: true, get: function () { return code_2.strConcat; } });
	Object.defineProperty(exports, "nil", { enumerable: true, get: function () { return code_2.nil; } });
	Object.defineProperty(exports, "getProperty", { enumerable: true, get: function () { return code_2.getProperty; } });
	Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return code_2.stringify; } });
	Object.defineProperty(exports, "Name", { enumerable: true, get: function () { return code_2.Name; } });
	var scope_2 = scope;
	Object.defineProperty(exports, "Scope", { enumerable: true, get: function () { return scope_2.Scope; } });
	Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function () { return scope_2.ValueScope; } });
	Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function () { return scope_2.ValueScopeName; } });
	Object.defineProperty(exports, "varKinds", { enumerable: true, get: function () { return scope_2.varKinds; } });
	exports.operators = {
	    GT: new code._Code(">"),
	    GTE: new code._Code(">="),
	    LT: new code._Code("<"),
	    LTE: new code._Code("<="),
	    EQ: new code._Code("==="),
	    NEQ: new code._Code("!=="),
	    NOT: new code._Code("!"),
	    OR: new code._Code("||"),
	    AND: new code._Code("&&"),
	};
	class Node {
	    optimizeNodes() {
	        return this;
	    }
	    optimizeNames(_names, _constants) {
	        return this;
	    }
	}
	class Def extends Node {
	    constructor(varKind, name, rhs) {
	        super();
	        this.varKind = varKind;
	        this.name = name;
	        this.rhs = rhs;
	    }
	    render({ es5, _n }) {
	        const varKind = es5 ? scope.varKinds.var : this.varKind;
	        const rhs = this.rhs === undefined ? "" : ` = ${this.rhs}`;
	        return `${varKind} ${this.name}${rhs};` + _n;
	    }
	    optimizeNames(names, constants) {
	        if (!names[this.name.str])
	            return;
	        if (this.rhs)
	            this.rhs = optimizeExpr(this.rhs, names, constants);
	        return this;
	    }
	    get names() {
	        return this.rhs instanceof code._CodeOrName ? this.rhs.names : {};
	    }
	}
	class Assign extends Node {
	    constructor(lhs, rhs, sideEffects) {
	        super();
	        this.lhs = lhs;
	        this.rhs = rhs;
	        this.sideEffects = sideEffects;
	    }
	    render({ _n }) {
	        return `${this.lhs} = ${this.rhs};` + _n;
	    }
	    optimizeNames(names, constants) {
	        if (this.lhs instanceof code.Name && !names[this.lhs.str] && !this.sideEffects)
	            return;
	        this.rhs = optimizeExpr(this.rhs, names, constants);
	        return this;
	    }
	    get names() {
	        const names = this.lhs instanceof code.Name ? {} : { ...this.lhs.names };
	        return addExprNames(names, this.rhs);
	    }
	}
	class Label extends Node {
	    constructor(label) {
	        super();
	        this.label = label;
	        this.names = {};
	    }
	    render({ _n }) {
	        return `${this.label}:` + _n;
	    }
	}
	class Break extends Node {
	    constructor(label) {
	        super();
	        this.label = label;
	        this.names = {};
	    }
	    render({ _n }) {
	        const label = this.label ? ` ${this.label}` : "";
	        return `break${label};` + _n;
	    }
	}
	class Throw extends Node {
	    constructor(error) {
	        super();
	        this.error = error;
	    }
	    render({ _n }) {
	        return `throw ${this.error};` + _n;
	    }
	    get names() {
	        return this.error.names;
	    }
	}
	class AnyCode extends Node {
	    constructor(code) {
	        super();
	        this.code = code;
	    }
	    render({ _n }) {
	        return `${this.code};` + _n;
	    }
	    optimizeNodes() {
	        return `${this.code}` ? this : undefined;
	    }
	    optimizeNames(names, constants) {
	        this.code = optimizeExpr(this.code, names, constants);
	        return this;
	    }
	    get names() {
	        return this.code instanceof code._CodeOrName ? this.code.names : {};
	    }
	}
	class ParentNode extends Node {
	    constructor(nodes = []) {
	        super();
	        this.nodes = nodes;
	    }
	    render(opts) {
	        return this.nodes.reduce((code, n) => code + n.render(opts), "");
	    }
	    optimizeNodes() {
	        const { nodes } = this;
	        let i = nodes.length;
	        while (i--) {
	            const n = nodes[i].optimizeNodes();
	            if (Array.isArray(n))
	                nodes.splice(i, 1, ...n);
	            else if (n)
	                nodes[i] = n;
	            else
	                nodes.splice(i, 1);
	        }
	        return nodes.length > 0 ? this : undefined;
	    }
	    optimizeNames(names, constants) {
	        const { nodes } = this;
	        let i = nodes.length;
	        while (i--) {
	            // iterating backwards improves 1-pass optimization
	            const n = nodes[i];
	            if (n.optimizeNames(names, constants))
	                continue;
	            subtractNames(names, n.names);
	            nodes.splice(i, 1);
	        }
	        return nodes.length > 0 ? this : undefined;
	    }
	    get names() {
	        return this.nodes.reduce((names, n) => addNames(names, n.names), {});
	    }
	}
	class BlockNode extends ParentNode {
	    render(opts) {
	        return "{" + opts._n + super.render(opts) + "}" + opts._n;
	    }
	}
	class Root extends ParentNode {
	}
	class Else extends BlockNode {
	}
	Else.kind = "else";
	class If extends BlockNode {
	    constructor(condition, nodes) {
	        super(nodes);
	        this.condition = condition;
	    }
	    render(opts) {
	        let code = `if(${this.condition})` + super.render(opts);
	        if (this.else)
	            code += "else " + this.else.render(opts);
	        return code;
	    }
	    optimizeNodes() {
	        super.optimizeNodes();
	        const cond = this.condition;
	        if (cond === true)
	            return this.nodes; // else is ignored here
	        let e = this.else;
	        if (e) {
	            const ns = e.optimizeNodes();
	            e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
	        }
	        if (e) {
	            if (cond === false)
	                return e instanceof If ? e : e.nodes;
	            if (this.nodes.length)
	                return this;
	            return new If(not(cond), e instanceof If ? [e] : e.nodes);
	        }
	        if (cond === false || !this.nodes.length)
	            return undefined;
	        return this;
	    }
	    optimizeNames(names, constants) {
	        var _a;
	        this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
	        if (!(super.optimizeNames(names, constants) || this.else))
	            return;
	        this.condition = optimizeExpr(this.condition, names, constants);
	        return this;
	    }
	    get names() {
	        const names = super.names;
	        addExprNames(names, this.condition);
	        if (this.else)
	            addNames(names, this.else.names);
	        return names;
	    }
	}
	If.kind = "if";
	class For extends BlockNode {
	}
	For.kind = "for";
	class ForLoop extends For {
	    constructor(iteration) {
	        super();
	        this.iteration = iteration;
	    }
	    render(opts) {
	        return `for(${this.iteration})` + super.render(opts);
	    }
	    optimizeNames(names, constants) {
	        if (!super.optimizeNames(names, constants))
	            return;
	        this.iteration = optimizeExpr(this.iteration, names, constants);
	        return this;
	    }
	    get names() {
	        return addNames(super.names, this.iteration.names);
	    }
	}
	class ForRange extends For {
	    constructor(varKind, name, from, to) {
	        super();
	        this.varKind = varKind;
	        this.name = name;
	        this.from = from;
	        this.to = to;
	    }
	    render(opts) {
	        const varKind = opts.es5 ? scope.varKinds.var : this.varKind;
	        const { name, from, to } = this;
	        return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
	    }
	    get names() {
	        const names = addExprNames(super.names, this.from);
	        return addExprNames(names, this.to);
	    }
	}
	class ForIter extends For {
	    constructor(loop, varKind, name, iterable) {
	        super();
	        this.loop = loop;
	        this.varKind = varKind;
	        this.name = name;
	        this.iterable = iterable;
	    }
	    render(opts) {
	        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
	    }
	    optimizeNames(names, constants) {
	        if (!super.optimizeNames(names, constants))
	            return;
	        this.iterable = optimizeExpr(this.iterable, names, constants);
	        return this;
	    }
	    get names() {
	        return addNames(super.names, this.iterable.names);
	    }
	}
	class Func extends BlockNode {
	    constructor(name, args, async) {
	        super();
	        this.name = name;
	        this.args = args;
	        this.async = async;
	    }
	    render(opts) {
	        const _async = this.async ? "async " : "";
	        return `${_async}function ${this.name}(${this.args})` + super.render(opts);
	    }
	}
	Func.kind = "func";
	class Return extends ParentNode {
	    render(opts) {
	        return "return " + super.render(opts);
	    }
	}
	Return.kind = "return";
	class Try extends BlockNode {
	    render(opts) {
	        let code = "try" + super.render(opts);
	        if (this.catch)
	            code += this.catch.render(opts);
	        if (this.finally)
	            code += this.finally.render(opts);
	        return code;
	    }
	    optimizeNodes() {
	        var _a, _b;
	        super.optimizeNodes();
	        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNodes();
	        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNodes();
	        return this;
	    }
	    optimizeNames(names, constants) {
	        var _a, _b;
	        super.optimizeNames(names, constants);
	        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
	        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNames(names, constants);
	        return this;
	    }
	    get names() {
	        const names = super.names;
	        if (this.catch)
	            addNames(names, this.catch.names);
	        if (this.finally)
	            addNames(names, this.finally.names);
	        return names;
	    }
	}
	class Catch extends BlockNode {
	    constructor(error) {
	        super();
	        this.error = error;
	    }
	    render(opts) {
	        return `catch(${this.error})` + super.render(opts);
	    }
	}
	Catch.kind = "catch";
	class Finally extends BlockNode {
	    render(opts) {
	        return "finally" + super.render(opts);
	    }
	}
	Finally.kind = "finally";
	class CodeGen {
	    constructor(extScope, opts = {}) {
	        this._values = {};
	        this._blockStarts = [];
	        this._constants = {};
	        this.opts = { ...opts, _n: opts.lines ? "\n" : "" };
	        this._extScope = extScope;
	        this._scope = new scope.Scope({ parent: extScope });
	        this._nodes = [new Root()];
	    }
	    toString() {
	        return this._root.render(this.opts);
	    }
	    // returns unique name in the internal scope
	    name(prefix) {
	        return this._scope.name(prefix);
	    }
	    // reserves unique name in the external scope
	    scopeName(prefix) {
	        return this._extScope.name(prefix);
	    }
	    // reserves unique name in the external scope and assigns value to it
	    scopeValue(prefixOrName, value) {
	        const name = this._extScope.value(prefixOrName, value);
	        const vs = this._values[name.prefix] || (this._values[name.prefix] = new Set());
	        vs.add(name);
	        return name;
	    }
	    getScopeValue(prefix, keyOrRef) {
	        return this._extScope.getValue(prefix, keyOrRef);
	    }
	    // return code that assigns values in the external scope to the names that are used internally
	    // (same names that were returned by gen.scopeName or gen.scopeValue)
	    scopeRefs(scopeName) {
	        return this._extScope.scopeRefs(scopeName, this._values);
	    }
	    scopeCode() {
	        return this._extScope.scopeCode(this._values);
	    }
	    _def(varKind, nameOrPrefix, rhs, constant) {
	        const name = this._scope.toName(nameOrPrefix);
	        if (rhs !== undefined && constant)
	            this._constants[name.str] = rhs;
	        this._leafNode(new Def(varKind, name, rhs));
	        return name;
	    }
	    // `const` declaration (`var` in es5 mode)
	    const(nameOrPrefix, rhs, _constant) {
	        return this._def(scope.varKinds.const, nameOrPrefix, rhs, _constant);
	    }
	    // `let` declaration with optional assignment (`var` in es5 mode)
	    let(nameOrPrefix, rhs, _constant) {
	        return this._def(scope.varKinds.let, nameOrPrefix, rhs, _constant);
	    }
	    // `var` declaration with optional assignment
	    var(nameOrPrefix, rhs, _constant) {
	        return this._def(scope.varKinds.var, nameOrPrefix, rhs, _constant);
	    }
	    // assignment code
	    assign(lhs, rhs, sideEffects) {
	        return this._leafNode(new Assign(lhs, rhs, sideEffects));
	    }
	    // appends passed SafeExpr to code or executes Block
	    code(c) {
	        if (typeof c == "function")
	            c();
	        else if (c !== code.nil)
	            this._leafNode(new AnyCode(c));
	        return this;
	    }
	    // returns code for object literal for the passed argument list of key-value pairs
	    object(...keyValues) {
	        const code$1 = ["{"];
	        for (const [key, value] of keyValues) {
	            if (code$1.length > 1)
	                code$1.push(",");
	            code$1.push(key);
	            if (key !== value || this.opts.es5) {
	                code$1.push(":");
	                code.addCodeArg(code$1, value);
	            }
	        }
	        code$1.push("}");
	        return new code._Code(code$1);
	    }
	    // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
	    if(condition, thenBody, elseBody) {
	        this._blockNode(new If(condition));
	        if (thenBody && elseBody) {
	            this.code(thenBody).else().code(elseBody).endIf();
	        }
	        else if (thenBody) {
	            this.code(thenBody).endIf();
	        }
	        else if (elseBody) {
	            throw new Error('CodeGen: "else" body without "then" body');
	        }
	        return this;
	    }
	    // `else if` clause - invalid without `if` or after `else` clauses
	    elseIf(condition) {
	        return this._elseNode(new If(condition));
	    }
	    // `else` clause - only valid after `if` or `else if` clauses
	    else() {
	        return this._elseNode(new Else());
	    }
	    // end `if` statement (needed if gen.if was used only with condition)
	    endIf() {
	        return this._endBlockNode(If, Else);
	    }
	    _for(node, forBody) {
	        this._blockNode(node);
	        if (forBody)
	            this.code(forBody).endFor();
	        return this;
	    }
	    // a generic `for` clause (or statement if `forBody` is passed)
	    for(iteration, forBody) {
	        return this._for(new ForLoop(iteration), forBody);
	    }
	    // `for` statement for a range of values
	    forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope.varKinds.var : scope.varKinds.let) {
	        const name = this._scope.toName(nameOrPrefix);
	        return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
	    }
	    // `for-of` statement (in es5 mode replace with a normal for loop)
	    forOf(nameOrPrefix, iterable, forBody, varKind = scope.varKinds.const) {
	        const name = this._scope.toName(nameOrPrefix);
	        if (this.opts.es5) {
	            const arr = iterable instanceof code.Name ? iterable : this.var("_arr", iterable);
	            return this.forRange("_i", 0, code._ `${arr}.length`, (i) => {
	                this.var(name, code._ `${arr}[${i}]`);
	                forBody(name);
	            });
	        }
	        return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
	    }
	    // `for-in` statement.
	    // With option `ownProperties` replaced with a `for-of` loop for object keys
	    forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope.varKinds.var : scope.varKinds.const) {
	        if (this.opts.ownProperties) {
	            return this.forOf(nameOrPrefix, code._ `Object.keys(${obj})`, forBody);
	        }
	        const name = this._scope.toName(nameOrPrefix);
	        return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
	    }
	    // end `for` loop
	    endFor() {
	        return this._endBlockNode(For);
	    }
	    // `label` statement
	    label(label) {
	        return this._leafNode(new Label(label));
	    }
	    // `break` statement
	    break(label) {
	        return this._leafNode(new Break(label));
	    }
	    // `return` statement
	    return(value) {
	        const node = new Return();
	        this._blockNode(node);
	        this.code(value);
	        if (node.nodes.length !== 1)
	            throw new Error('CodeGen: "return" should have one node');
	        return this._endBlockNode(Return);
	    }
	    // `try` statement
	    try(tryBody, catchCode, finallyCode) {
	        if (!catchCode && !finallyCode)
	            throw new Error('CodeGen: "try" without "catch" and "finally"');
	        const node = new Try();
	        this._blockNode(node);
	        this.code(tryBody);
	        if (catchCode) {
	            const error = this.name("e");
	            this._currNode = node.catch = new Catch(error);
	            catchCode(error);
	        }
	        if (finallyCode) {
	            this._currNode = node.finally = new Finally();
	            this.code(finallyCode);
	        }
	        return this._endBlockNode(Catch, Finally);
	    }
	    // `throw` statement
	    throw(error) {
	        return this._leafNode(new Throw(error));
	    }
	    // start self-balancing block
	    block(body, nodeCount) {
	        this._blockStarts.push(this._nodes.length);
	        if (body)
	            this.code(body).endBlock(nodeCount);
	        return this;
	    }
	    // end the current self-balancing block
	    endBlock(nodeCount) {
	        const len = this._blockStarts.pop();
	        if (len === undefined)
	            throw new Error("CodeGen: not in self-balancing block");
	        const toClose = this._nodes.length - len;
	        if (toClose < 0 || (nodeCount !== undefined && toClose !== nodeCount)) {
	            throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
	        }
	        this._nodes.length = len;
	        return this;
	    }
	    // `function` heading (or definition if funcBody is passed)
	    func(name, args = code.nil, async, funcBody) {
	        this._blockNode(new Func(name, args, async));
	        if (funcBody)
	            this.code(funcBody).endFunc();
	        return this;
	    }
	    // end function definition
	    endFunc() {
	        return this._endBlockNode(Func);
	    }
	    optimize(n = 1) {
	        while (n-- > 0) {
	            this._root.optimizeNodes();
	            this._root.optimizeNames(this._root.names, this._constants);
	        }
	    }
	    _leafNode(node) {
	        this._currNode.nodes.push(node);
	        return this;
	    }
	    _blockNode(node) {
	        this._currNode.nodes.push(node);
	        this._nodes.push(node);
	    }
	    _endBlockNode(N1, N2) {
	        const n = this._currNode;
	        if (n instanceof N1 || (N2 && n instanceof N2)) {
	            this._nodes.pop();
	            return this;
	        }
	        throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
	    }
	    _elseNode(node) {
	        const n = this._currNode;
	        if (!(n instanceof If)) {
	            throw new Error('CodeGen: "else" without "if"');
	        }
	        this._currNode = n.else = node;
	        return this;
	    }
	    get _root() {
	        return this._nodes[0];
	    }
	    get _currNode() {
	        const ns = this._nodes;
	        return ns[ns.length - 1];
	    }
	    set _currNode(node) {
	        const ns = this._nodes;
	        ns[ns.length - 1] = node;
	    }
	}
	exports.CodeGen = CodeGen;
	function addNames(names, from) {
	    for (const n in from)
	        names[n] = (names[n] || 0) + (from[n] || 0);
	    return names;
	}
	function addExprNames(names, from) {
	    return from instanceof code._CodeOrName ? addNames(names, from.names) : names;
	}
	function optimizeExpr(expr, names, constants) {
	    if (expr instanceof code.Name)
	        return replaceName(expr);
	    if (!canOptimize(expr))
	        return expr;
	    return new code._Code(expr._items.reduce((items, c) => {
	        if (c instanceof code.Name)
	            c = replaceName(c);
	        if (c instanceof code._Code)
	            items.push(...c._items);
	        else
	            items.push(c);
	        return items;
	    }, []));
	    function replaceName(n) {
	        const c = constants[n.str];
	        if (c === undefined || names[n.str] !== 1)
	            return n;
	        delete names[n.str];
	        return c;
	    }
	    function canOptimize(e) {
	        return (e instanceof code._Code &&
	            e._items.some((c) => c instanceof code.Name && names[c.str] === 1 && constants[c.str] !== undefined));
	    }
	}
	function subtractNames(names, from) {
	    for (const n in from)
	        names[n] = (names[n] || 0) - (from[n] || 0);
	}
	function not(x) {
	    return typeof x == "boolean" || typeof x == "number" || x === null ? !x : code._ `!${par(x)}`;
	}
	exports.not = not;
	const andCode = mappend(exports.operators.AND);
	// boolean AND (&&) expression with the passed arguments
	function and(...args) {
	    return args.reduce(andCode);
	}
	exports.and = and;
	const orCode = mappend(exports.operators.OR);
	// boolean OR (||) expression with the passed arguments
	function or(...args) {
	    return args.reduce(orCode);
	}
	exports.or = or;
	function mappend(op) {
	    return (x, y) => (x === code.nil ? y : y === code.nil ? x : code._ `${par(x)} ${op} ${par(y)}`);
	}
	function par(x) {
	    return x instanceof code.Name ? x : code._ `(${x})`;
	}

	});

	const names = {
	    // validation function arguments
	    data: new codegen.Name("data"),
	    // args passed from referencing schema
	    valCxt: new codegen.Name("valCxt"),
	    dataPath: new codegen.Name("dataPath"),
	    parentData: new codegen.Name("parentData"),
	    parentDataProperty: new codegen.Name("parentDataProperty"),
	    rootData: new codegen.Name("rootData"),
	    dynamicAnchors: new codegen.Name("dynamicAnchors"),
	    // function scoped variables
	    vErrors: new codegen.Name("vErrors"),
	    errors: new codegen.Name("errors"),
	    this: new codegen.Name("this"),
	    // "globals"
	    self: new codegen.Name("self"),
	    scope: new codegen.Name("scope"),
	};
	var _default = names;


	var names_1 = /*#__PURE__*/Object.defineProperty({
		default: _default
	}, '__esModule', {value: true});

	var errors = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;


	exports.keywordError = {
	    message: ({ keyword }) => codegen.str `should pass "${keyword}" keyword validation`,
	};
	exports.keyword$DataError = {
	    message: ({ keyword, schemaType }) => schemaType
	        ? codegen.str `"${keyword}" keyword must be ${schemaType} ($data)`
	        : codegen.str `"${keyword}" keyword is invalid ($data)`,
	};
	function reportError(cxt, error, overrideAllErrors) {
	    const { it } = cxt;
	    const { gen, compositeRule, allErrors } = it;
	    const errObj = errorObjectCode(cxt, error);
	    if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : (compositeRule || allErrors)) {
	        addError(gen, errObj);
	    }
	    else {
	        returnErrors(it, codegen._ `[${errObj}]`);
	    }
	}
	exports.reportError = reportError;
	function reportExtraError(cxt, error) {
	    const { it } = cxt;
	    const { gen, compositeRule, allErrors } = it;
	    const errObj = errorObjectCode(cxt, error);
	    addError(gen, errObj);
	    if (!(compositeRule || allErrors)) {
	        returnErrors(it, names_1.default.vErrors);
	    }
	}
	exports.reportExtraError = reportExtraError;
	function resetErrorsCount(gen, errsCount) {
	    gen.assign(names_1.default.errors, errsCount);
	    gen.if(codegen._ `${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign(codegen._ `${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
	}
	exports.resetErrorsCount = resetErrorsCount;
	function extendErrors({ gen, keyword, schemaValue, data, errsCount, it, }) {
	    /* istanbul ignore if */
	    if (errsCount === undefined)
	        throw new Error("ajv implementation error");
	    const err = gen.name("err");
	    gen.forRange("i", errsCount, names_1.default.errors, (i) => {
	        gen.const(err, codegen._ `${names_1.default.vErrors}[${i}]`);
	        gen.if(codegen._ `${err}.dataPath === undefined`, () => gen.assign(codegen._ `${err}.dataPath`, codegen.strConcat(names_1.default.dataPath, it.errorPath)));
	        gen.assign(codegen._ `${err}.schemaPath`, codegen.str `${it.errSchemaPath}/${keyword}`);
	        if (it.opts.verbose) {
	            gen.assign(codegen._ `${err}.schema`, schemaValue);
	            gen.assign(codegen._ `${err}.data`, data);
	        }
	    });
	}
	exports.extendErrors = extendErrors;
	function addError(gen, errObj) {
	    const err = gen.const("err", errObj);
	    gen.if(codegen._ `${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, codegen._ `[${err}]`), codegen._ `${names_1.default.vErrors}.push(${err})`);
	    gen.code(codegen._ `${names_1.default.errors}++`);
	}
	function returnErrors(it, errs) {
	    const { gen, validateName, schemaEnv } = it;
	    if (schemaEnv.$async) {
	        gen.throw(codegen._ `new ${it.ValidationError}(${errs})`);
	    }
	    else {
	        gen.assign(codegen._ `${validateName}.errors`, errs);
	        gen.return(false);
	    }
	}
	const E = {
	    keyword: new codegen.Name("keyword"),
	    schemaPath: new codegen.Name("schemaPath"),
	    params: new codegen.Name("params"),
	    propertyName: new codegen.Name("propertyName"),
	    message: new codegen.Name("message"),
	    schema: new codegen.Name("schema"),
	    parentSchema: new codegen.Name("parentSchema"),
	};
	function errorObjectCode(cxt, error) {
	    const { keyword, data, schemaValue, it: { gen, createErrors, topSchemaRef, schemaPath, errorPath, errSchemaPath, propertyName, opts }, } = cxt;
	    if (createErrors === false)
	        return codegen._ `{}`;
	    const { params, message } = error;
	    const keyValues = [
	        [E.keyword, keyword],
	        [names_1.default.dataPath, codegen.strConcat(names_1.default.dataPath, errorPath)],
	        [E.schemaPath, codegen.str `${errSchemaPath}/${keyword}`],
	        [E.params, typeof params == "function" ? params(cxt) : params || codegen._ `{}`],
	    ];
	    if (propertyName)
	        keyValues.push([E.propertyName, propertyName]);
	    if (opts.messages !== false) {
	        const msg = typeof message == "function" ? message(cxt) : message;
	        keyValues.push([E.message, msg]);
	    }
	    if (opts.verbose) {
	        keyValues.push([E.schema, schemaValue], [E.parentSchema, codegen._ `${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
	    }
	    return gen.object(...keyValues);
	}

	});

	var boolSchema = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;



	const boolError = {
	    message: "boolean schema is false",
	};
	function topBoolOrEmptySchema(it) {
	    const { gen, schema, validateName } = it;
	    if (schema === false) {
	        falseSchemaError(it, false);
	    }
	    else if (typeof schema == "object" && schema.$async === true) {
	        gen.return(names_1.default.data);
	    }
	    else {
	        gen.assign(codegen._ `${validateName}.errors`, null);
	        gen.return(true);
	    }
	}
	exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
	function boolOrEmptySchema(it, valid) {
	    const { gen, schema } = it;
	    if (schema === false) {
	        gen.var(valid, false); // TODO var
	        falseSchemaError(it);
	    }
	    else {
	        gen.var(valid, true); // TODO var
	    }
	}
	exports.boolOrEmptySchema = boolOrEmptySchema;
	function falseSchemaError(it, overrideAllErrors) {
	    const { gen, data } = it;
	    // TODO maybe some other interface should be used for non-keyword validation errors...
	    const cxt = {
	        gen,
	        keyword: "false schema",
	        data,
	        schema: false,
	        schemaCode: false,
	        schemaValue: false,
	        params: {},
	        it,
	    };
	    errors.reportError(cxt, boolError, overrideAllErrors);
	}

	});

	var defaults = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.assignDefaults = void 0;


	function assignDefaults(it, ty) {
	    const { properties, items } = it.schema;
	    if (ty === "object" && properties) {
	        for (const key in properties) {
	            assignDefault(it, key, properties[key].default);
	        }
	    }
	    else if (ty === "array" && Array.isArray(items)) {
	        items.forEach((sch, i) => assignDefault(it, i, sch.default));
	    }
	}
	exports.assignDefaults = assignDefaults;
	function assignDefault(it, prop, defaultValue) {
	    const { gen, compositeRule, data, opts } = it;
	    if (defaultValue === undefined)
	        return;
	    const childData = codegen._ `${data}${codegen.getProperty(prop)}`;
	    if (compositeRule) {
	        validate.checkStrictMode(it, `default is ignored for: ${childData}`);
	        return;
	    }
	    let condition = codegen._ `${childData} === undefined`;
	    if (opts.useDefaults === "empty") {
	        condition = codegen._ `${condition} || ${childData} === null || ${childData} === ""`;
	    }
	    // `${childData} === undefined` +
	    // (opts.useDefaults === "empty" ? ` || ${childData} === null || ${childData} === ""` : "")
	    gen.if(condition, codegen._ `${childData} = ${codegen.stringify(defaultValue)}`);
	}

	});

	var code$1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;



	function checkReportMissingProp(cxt, prop) {
	    const { gen, data, it } = cxt;
	    gen.if(noPropertyInData(data, prop, it.opts.ownProperties), () => {
	        cxt.setParams({ missingProperty: codegen._ `${prop}` }, true);
	        cxt.error();
	    });
	}
	exports.checkReportMissingProp = checkReportMissingProp;
	function checkMissingProp({ data, it: { opts } }, properties, missing) {
	    return codegen.or(...properties.map((prop) => codegen._ `${noPropertyInData(data, prop, opts.ownProperties)} && (${missing} = ${prop})`));
	}
	exports.checkMissingProp = checkMissingProp;
	function reportMissingProp(cxt, missing) {
	    cxt.setParams({ missingProperty: missing }, true);
	    cxt.error();
	}
	exports.reportMissingProp = reportMissingProp;
	function isOwnProperty(data, property) {
	    return codegen._ `Object.prototype.hasOwnProperty.call(${data}, ${property})`;
	}
	function propertyInData(data, property, ownProperties) {
	    const cond = codegen._ `${data}${codegen.getProperty(property)} !== undefined`;
	    return ownProperties ? codegen._ `${cond} && ${isOwnProperty(data, property)}` : cond;
	}
	exports.propertyInData = propertyInData;
	function noPropertyInData(data, property, ownProperties) {
	    const cond = codegen._ `${data}${codegen.getProperty(property)} === undefined`;
	    return ownProperties ? codegen._ `${cond} || !${isOwnProperty(data, property)}` : cond;
	}
	exports.noPropertyInData = noPropertyInData;
	function allSchemaProperties(schemaMap) {
	    return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
	}
	exports.allSchemaProperties = allSchemaProperties;
	function schemaProperties(it, schemaMap) {
	    return allSchemaProperties(schemaMap).filter((p) => !util.alwaysValidSchema(it, schemaMap[p]));
	}
	exports.schemaProperties = schemaProperties;
	function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
	    const dataAndSchema = passSchema ? codegen._ `${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
	    const valCxt = [
	        [names_1.default.dataPath, codegen.strConcat(names_1.default.dataPath, errorPath)],
	        [names_1.default.parentData, it.parentData],
	        [names_1.default.parentDataProperty, it.parentDataProperty],
	        [names_1.default.rootData, names_1.default.rootData],
	    ];
	    if (it.opts.dynamicRef)
	        valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
	    const args = codegen._ `${dataAndSchema}, ${gen.object(...valCxt)}`;
	    return context !== codegen.nil ? codegen._ `${func}.call(${context}, ${args})` : codegen._ `${func}(${args})`;
	}
	exports.callValidateCode = callValidateCode;
	function usePattern(gen, pattern) {
	    return gen.scopeValue("pattern", {
	        key: pattern,
	        ref: new RegExp(pattern, "u"),
	        code: codegen._ `new RegExp(${pattern}, "u")`,
	    });
	}
	exports.usePattern = usePattern;

	});

	var keyword = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.keywordCode = void 0;





	function keywordCode(it, keyword, def, ruleType) {
	    const cxt = new context.default(it, def, keyword);
	    if ("code" in def) {
	        def.code(cxt, ruleType);
	    }
	    else if (cxt.$data && def.validate) {
	        funcKeywordCode(cxt, def);
	    }
	    else if ("macro" in def) {
	        macroKeywordCode(cxt, def);
	    }
	    else if (def.compile || def.validate) {
	        funcKeywordCode(cxt, def);
	    }
	}
	exports.keywordCode = keywordCode;
	function macroKeywordCode(cxt, def) {
	    const { gen, keyword, schema, parentSchema, it } = cxt;
	    const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
	    const schemaRef = useKeyword(gen, keyword, macroSchema);
	    if (it.opts.validateSchema !== false)
	        it.self.validateSchema(macroSchema, true);
	    const valid = gen.name("valid");
	    cxt.subschema({
	        schema: macroSchema,
	        schemaPath: codegen.nil,
	        errSchemaPath: `${it.errSchemaPath}/${keyword}`,
	        topSchemaRef: schemaRef,
	        compositeRule: true,
	    }, valid);
	    cxt.pass(valid, () => cxt.error(true));
	}
	function funcKeywordCode(cxt, def) {
	    var _a;
	    const { gen, keyword, schema, parentSchema, $data, it } = cxt;
	    checkAsync(it, def);
	    const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
	    const validateRef = useKeyword(gen, keyword, validate);
	    const valid = gen.let("valid");
	    cxt.block$data(valid, validateKeyword);
	    cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
	    function validateKeyword() {
	        if (def.errors === false) {
	            assignValid();
	            if (def.modifying)
	                modifyData(cxt);
	            reportErrs(() => cxt.error());
	        }
	        else {
	            const ruleErrs = def.async ? validateAsync() : validateSync();
	            if (def.modifying)
	                modifyData(cxt);
	            reportErrs(() => addErrs(cxt, ruleErrs));
	        }
	    }
	    function validateAsync() {
	        const ruleErrs = gen.let("ruleErrs", null);
	        gen.try(() => assignValid(codegen._ `await `), (e) => gen.assign(valid, false).if(codegen._ `${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, codegen._ `${e}.errors`), () => gen.throw(e)));
	        return ruleErrs;
	    }
	    function validateSync() {
	        const validateErrs = codegen._ `${validateRef}.errors`;
	        gen.assign(validateErrs, null);
	        assignValid(codegen.nil);
	        return validateErrs;
	    }
	    function assignValid(_await = def.async ? codegen._ `await ` : codegen.nil) {
	        const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
	        const passSchema = !(("compile" in def && !$data) || def.schema === false);
	        gen.assign(valid, codegen._ `${_await}${code$1.callValidateCode(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
	    }
	    function reportErrs(errors) {
	        var _a;
	        gen.if(codegen.not((_a = def.valid) !== null && _a !== void 0 ? _a : valid), errors);
	    }
	}
	function modifyData(cxt) {
	    const { gen, data, it } = cxt;
	    gen.if(it.parentData, () => gen.assign(data, codegen._ `${it.parentData}[${it.parentDataProperty}]`));
	}
	function addErrs(cxt, errs) {
	    const { gen } = cxt;
	    gen.if(codegen._ `Array.isArray(${errs})`, () => {
	        gen
	            .assign(names_1.default.vErrors, codegen._ `${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`)
	            .assign(names_1.default.errors, codegen._ `${names_1.default.vErrors}.length`);
	        errors.extendErrors(cxt);
	    }, () => cxt.error());
	}
	function checkAsync({ schemaEnv }, def) {
	    if (def.async && !schemaEnv.$async)
	        throw new Error("async keyword in sync schema");
	}
	function useKeyword(gen, keyword, result) {
	    if (result === undefined)
	        throw new Error(`keyword "${keyword}" failed to compile`);
	    return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: codegen.stringify(result) });
	}

	});

	var iterate = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.schemaKeywords = void 0;



	const dataType_2 = dataType;





	function schemaKeywords(it, types, typeErrors, errsCount) {
	    const { gen, schema, data, allErrors, opts, self } = it;
	    const { RULES } = self;
	    if (schema.$ref && (opts.ignoreKeywordsWithRef || !util.schemaHasRulesButRef(schema, RULES))) {
	        gen.block(() => keyword.keywordCode(it, "$ref", RULES.all.$ref.definition)); // TODO typecast
	        return;
	    }
	    checkStrictTypes(it, types);
	    gen.block(() => {
	        for (const group of RULES.rules)
	            groupKeywords(group);
	        groupKeywords(RULES.post);
	    });
	    function groupKeywords(group) {
	        if (!applicability.shouldUseGroup(schema, group))
	            return;
	        if (group.type) {
	            gen.if(dataType.checkDataType(group.type, data, opts.strict));
	            iterateKeywords(it, group);
	            if (types.length === 1 && types[0] === group.type && typeErrors) {
	                gen.else();
	                dataType_2.reportTypeError(it);
	            }
	            gen.endIf();
	        }
	        else {
	            iterateKeywords(it, group);
	        }
	        // TODO make it "ok" call?
	        if (!allErrors)
	            gen.if(codegen._ `${names_1.default.errors} === ${errsCount || 0}`);
	    }
	}
	exports.schemaKeywords = schemaKeywords;
	function iterateKeywords(it, group) {
	    const { gen, schema, opts: { useDefaults }, } = it;
	    if (useDefaults)
	        defaults.assignDefaults(it, group.type);
	    gen.block(() => {
	        for (const rule of group.rules) {
	            if (applicability.shouldUseRule(schema, rule)) {
	                keyword.keywordCode(it, rule.keyword, rule.definition, group.type);
	            }
	        }
	    });
	}
	function checkStrictTypes(it, types) {
	    if (it.schemaEnv.meta || !it.opts.strictTypes)
	        return;
	    checkContextTypes(it, types);
	    if (!it.opts.allowUnionTypes)
	        checkMultipleTypes(it, types);
	    checkKeywordTypes(it, it.dataTypes);
	}
	function checkContextTypes(it, types) {
	    if (!types.length)
	        return;
	    if (!it.dataTypes.length) {
	        it.dataTypes = types;
	        return;
	    }
	    types.forEach((t) => {
	        if (!includesType(it.dataTypes, t)) {
	            strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
	        }
	    });
	    it.dataTypes = it.dataTypes.filter((t) => includesType(types, t));
	}
	function checkMultipleTypes(it, ts) {
	    if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
	        strictTypesError(it, "use allowUnionTypes to allow union type keyword");
	    }
	}
	function checkKeywordTypes(it, ts) {
	    const rules = it.self.RULES.all;
	    for (const keyword in rules) {
	        const rule = rules[keyword];
	        if (typeof rule == "object" && applicability.shouldUseRule(it.schema, rule)) {
	            const { type } = rule.definition;
	            if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
	                strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
	            }
	        }
	    }
	}
	function hasApplicableType(schTs, kwdT) {
	    return schTs.includes(kwdT) || (kwdT === "number" && schTs.includes("integer"));
	}
	function includesType(ts, t) {
	    return ts.includes(t) || (t === "integer" && ts.includes("number"));
	}
	function strictTypesError(it, msg) {
	    const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
	    msg += ` at "${schemaPath}" (strictTypes)`;
	    validate.checkStrictMode(it, msg, it.opts.strictTypes);
	}

	});

	// do not edit .js files directly - edit src/index.jst



	var fastDeepEqual = function equal(a, b) {
	  if (a === b) return true;

	  if (a && b && typeof a == 'object' && typeof b == 'object') {
	    if (a.constructor !== b.constructor) return false;

	    var length, i, keys;
	    if (Array.isArray(a)) {
	      length = a.length;
	      if (length != b.length) return false;
	      for (i = length; i-- !== 0;)
	        if (!equal(a[i], b[i])) return false;
	      return true;
	    }



	    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
	    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
	    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

	    keys = Object.keys(a);
	    length = keys.length;
	    if (length !== Object.keys(b).length) return false;

	    for (i = length; i-- !== 0;)
	      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

	    for (i = length; i-- !== 0;) {
	      var key = keys[i];

	      if (!equal(a[key], b[key])) return false;
	    }

	    return true;
	  }

	  // true if both NaN, false otherwise
	  return a!==a && b!==b;
	};

	var jsonSchemaTraverse = createCommonjsModule(function (module) {

	var traverse = module.exports = function (schema, opts, cb) {
	  // Legacy support for v0.3.1 and earlier.
	  if (typeof opts == 'function') {
	    cb = opts;
	    opts = {};
	  }

	  cb = opts.cb || cb;
	  var pre = (typeof cb == 'function') ? cb : cb.pre || function() {};
	  var post = cb.post || function() {};

	  _traverse(opts, pre, post, schema, '', schema);
	};


	traverse.keywords = {
	  additionalItems: true,
	  items: true,
	  contains: true,
	  additionalProperties: true,
	  propertyNames: true,
	  not: true,
	  if: true,
	  then: true,
	  else: true
	};

	traverse.arrayKeywords = {
	  items: true,
	  allOf: true,
	  anyOf: true,
	  oneOf: true
	};

	traverse.propsKeywords = {
	  $defs: true,
	  definitions: true,
	  properties: true,
	  patternProperties: true,
	  dependencies: true
	};

	traverse.skipKeywords = {
	  default: true,
	  enum: true,
	  const: true,
	  required: true,
	  maximum: true,
	  minimum: true,
	  exclusiveMaximum: true,
	  exclusiveMinimum: true,
	  multipleOf: true,
	  maxLength: true,
	  minLength: true,
	  pattern: true,
	  format: true,
	  maxItems: true,
	  minItems: true,
	  uniqueItems: true,
	  maxProperties: true,
	  minProperties: true
	};


	function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
	  if (schema && typeof schema == 'object' && !Array.isArray(schema)) {
	    pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
	    for (var key in schema) {
	      var sch = schema[key];
	      if (Array.isArray(sch)) {
	        if (key in traverse.arrayKeywords) {
	          for (var i=0; i<sch.length; i++)
	            _traverse(opts, pre, post, sch[i], jsonPtr + '/' + key + '/' + i, rootSchema, jsonPtr, key, schema, i);
	        }
	      } else if (key in traverse.propsKeywords) {
	        if (sch && typeof sch == 'object') {
	          for (var prop in sch)
	            _traverse(opts, pre, post, sch[prop], jsonPtr + '/' + key + '/' + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
	        }
	      } else if (key in traverse.keywords || (opts.allKeys && !(key in traverse.skipKeywords))) {
	        _traverse(opts, pre, post, sch, jsonPtr + '/' + key, rootSchema, jsonPtr, key, schema);
	      }
	    }
	    post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
	  }
	}


	function escapeJsonPtr(str) {
	  return str.replace(/~/g, '~0').replace(/\//g, '~1');
	}
	});

	/** @license URI.js v4.4.0 (c) 2011 Gary Court. License: http://github.com/garycourt/uri-js */

	var uri_all = createCommonjsModule(function (module, exports) {
	(function (global, factory) {
		 factory(exports) ;
	}(commonjsGlobal, (function (exports) {
	function merge() {
	    for (var _len = arguments.length, sets = Array(_len), _key = 0; _key < _len; _key++) {
	        sets[_key] = arguments[_key];
	    }

	    if (sets.length > 1) {
	        sets[0] = sets[0].slice(0, -1);
	        var xl = sets.length - 1;
	        for (var x = 1; x < xl; ++x) {
	            sets[x] = sets[x].slice(1, -1);
	        }
	        sets[xl] = sets[xl].slice(1);
	        return sets.join('');
	    } else {
	        return sets[0];
	    }
	}
	function subexp(str) {
	    return "(?:" + str + ")";
	}
	function typeOf(o) {
	    return o === undefined ? "undefined" : o === null ? "null" : Object.prototype.toString.call(o).split(" ").pop().split("]").shift().toLowerCase();
	}
	function toUpperCase(str) {
	    return str.toUpperCase();
	}
	function toArray(obj) {
	    return obj !== undefined && obj !== null ? obj instanceof Array ? obj : typeof obj.length !== "number" || obj.split || obj.setInterval || obj.call ? [obj] : Array.prototype.slice.call(obj) : [];
	}
	function assign(target, source) {
	    var obj = target;
	    if (source) {
	        for (var key in source) {
	            obj[key] = source[key];
	        }
	    }
	    return obj;
	}

	function buildExps(isIRI) {
	    var ALPHA$$ = "[A-Za-z]",
	        DIGIT$$ = "[0-9]",
	        HEXDIG$$ = merge(DIGIT$$, "[A-Fa-f]"),
	        PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)),
	        //expanded
	    GEN_DELIMS$$ = "[\\:\\/\\?\\#\\[\\]\\@]",
	        SUB_DELIMS$$ = "[\\!\\$\\&\\'\\(\\)\\*\\+\\,\\;\\=]",
	        RESERVED$$ = merge(GEN_DELIMS$$, SUB_DELIMS$$),
	        UCSCHAR$$ = isIRI ? "[\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF]" : "[]",
	        //subset, excludes bidi control characters
	    IPRIVATE$$ = isIRI ? "[\\uE000-\\uF8FF]" : "[]",
	        //subset
	    UNRESERVED$$ = merge(ALPHA$$, DIGIT$$, "[\\-\\.\\_\\~]", UCSCHAR$$),
	        SCHEME$ = subexp(ALPHA$$ + merge(ALPHA$$, DIGIT$$, "[\\+\\-\\.]") + "*"),
	        USERINFO$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]")) + "*"),
	        DEC_OCTET_RELAXED$ = subexp(subexp("25[0-5]") + "|" + subexp("2[0-4]" + DIGIT$$) + "|" + subexp("1" + DIGIT$$ + DIGIT$$) + "|" + subexp("0?[1-9]" + DIGIT$$) + "|0?0?" + DIGIT$$),
	        //relaxed parsing rules
	    IPV4ADDRESS$ = subexp(DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$ + "\\." + DEC_OCTET_RELAXED$),
	        H16$ = subexp(HEXDIG$$ + "{1,4}"),
	        LS32$ = subexp(subexp(H16$ + "\\:" + H16$) + "|" + IPV4ADDRESS$),
	        IPV6ADDRESS1$ = subexp(subexp(H16$ + "\\:") + "{6}" + LS32$),
	        //                           6( h16 ":" ) ls32
	    IPV6ADDRESS2$ = subexp("\\:\\:" + subexp(H16$ + "\\:") + "{5}" + LS32$),
	        //                      "::" 5( h16 ":" ) ls32
	    IPV6ADDRESS3$ = subexp(subexp(H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{4}" + LS32$),
	        //[               h16 ] "::" 4( h16 ":" ) ls32
	    IPV6ADDRESS4$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,1}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{3}" + LS32$),
	        //[ *1( h16 ":" ) h16 ] "::" 3( h16 ":" ) ls32
	    IPV6ADDRESS5$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,2}" + H16$) + "?\\:\\:" + subexp(H16$ + "\\:") + "{2}" + LS32$),
	        //[ *2( h16 ":" ) h16 ] "::" 2( h16 ":" ) ls32
	    IPV6ADDRESS6$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,3}" + H16$) + "?\\:\\:" + H16$ + "\\:" + LS32$),
	        //[ *3( h16 ":" ) h16 ] "::"    h16 ":"   ls32
	    IPV6ADDRESS7$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,4}" + H16$) + "?\\:\\:" + LS32$),
	        //[ *4( h16 ":" ) h16 ] "::"              ls32
	    IPV6ADDRESS8$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,5}" + H16$) + "?\\:\\:" + H16$),
	        //[ *5( h16 ":" ) h16 ] "::"              h16
	    IPV6ADDRESS9$ = subexp(subexp(subexp(H16$ + "\\:") + "{0,6}" + H16$) + "?\\:\\:"),
	        //[ *6( h16 ":" ) h16 ] "::"
	    IPV6ADDRESS$ = subexp([IPV6ADDRESS1$, IPV6ADDRESS2$, IPV6ADDRESS3$, IPV6ADDRESS4$, IPV6ADDRESS5$, IPV6ADDRESS6$, IPV6ADDRESS7$, IPV6ADDRESS8$, IPV6ADDRESS9$].join("|")),
	        ZONEID$ = subexp(subexp(UNRESERVED$$ + "|" + PCT_ENCODED$) + "+"),
	        //RFC 6874, with relaxed parsing rules
	    IPVFUTURE$ = subexp("[vV]" + HEXDIG$$ + "+\\." + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:]") + "+"),
	        //RFC 6874
	    REG_NAME$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$)) + "*"),
	        PCHAR$ = subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@]")),
	        SEGMENT_NZ_NC$ = subexp(subexp(PCT_ENCODED$ + "|" + merge(UNRESERVED$$, SUB_DELIMS$$, "[\\@]")) + "+"),
	        QUERY$ = subexp(subexp(PCHAR$ + "|" + merge("[\\/\\?]", IPRIVATE$$)) + "*");
	    return {
	        NOT_SCHEME: new RegExp(merge("[^]", ALPHA$$, DIGIT$$, "[\\+\\-\\.]"), "g"),
	        NOT_USERINFO: new RegExp(merge("[^\\%\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
	        NOT_HOST: new RegExp(merge("[^\\%\\[\\]\\:]", UNRESERVED$$, SUB_DELIMS$$), "g"),
	        NOT_PATH: new RegExp(merge("[^\\%\\/\\:\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
	        NOT_PATH_NOSCHEME: new RegExp(merge("[^\\%\\/\\@]", UNRESERVED$$, SUB_DELIMS$$), "g"),
	        NOT_QUERY: new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]", IPRIVATE$$), "g"),
	        NOT_FRAGMENT: new RegExp(merge("[^\\%]", UNRESERVED$$, SUB_DELIMS$$, "[\\:\\@\\/\\?]"), "g"),
	        ESCAPE: new RegExp(merge("[^]", UNRESERVED$$, SUB_DELIMS$$), "g"),
	        UNRESERVED: new RegExp(UNRESERVED$$, "g"),
	        OTHER_CHARS: new RegExp(merge("[^\\%]", UNRESERVED$$, RESERVED$$), "g"),
	        PCT_ENCODED: new RegExp(PCT_ENCODED$, "g"),
	        IPV4ADDRESS: new RegExp("^(" + IPV4ADDRESS$ + ")$"),
	        IPV6ADDRESS: new RegExp("^\\[?(" + IPV6ADDRESS$ + ")" + subexp(subexp("\\%25|\\%(?!" + HEXDIG$$ + "{2})") + "(" + ZONEID$ + ")") + "?\\]?$") //RFC 6874, with relaxed parsing rules
	    };
	}
	var URI_PROTOCOL = buildExps(false);

	var IRI_PROTOCOL = buildExps(true);

	var slicedToArray = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;

	    try {
	      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);

	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }

	    return _arr;
	  }

	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if (Symbol.iterator in Object(arr)) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();













	var toConsumableArray = function (arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

	    return arr2;
	  } else {
	    return Array.from(arr);
	  }
	};

	/** Highest positive signed 32-bit float value */

	var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	var base = 36;
	var tMin = 1;
	var tMax = 26;
	var skew = 38;
	var damp = 700;
	var initialBias = 72;
	var initialN = 128; // 0x80
	var delimiter = '-'; // '\x2D'

	/** Regular expressions */
	var regexPunycode = /^xn--/;
	var regexNonASCII = /[^\0-\x7E]/; // non-ASCII chars
	var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

	/** Error messages */
	var errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	};

	/** Convenience shortcuts */
	var baseMinusTMin = base - tMin;
	var floor = Math.floor;
	var stringFromCharCode = String.fromCharCode;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error$1(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var result = [];
		var length = array.length;
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		while (counter < length) {
			var value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// It's a high surrogate, and there is a next character.
				var extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) {
					// Low surrogate.
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// It's an unmatched surrogate; only append this code unit, in case the
					// next code unit is the high surrogate of a surrogate pair.
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	var ucs2encode = function ucs2encode(array) {
		return String.fromCodePoint.apply(String, toConsumableArray(array));
	};

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	var basicToDigit = function basicToDigit(codePoint) {
		if (codePoint - 0x30 < 0x0A) {
			return codePoint - 0x16;
		}
		if (codePoint - 0x41 < 0x1A) {
			return codePoint - 0x41;
		}
		if (codePoint - 0x61 < 0x1A) {
			return codePoint - 0x61;
		}
		return base;
	};

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	var digitToBasic = function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	};

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	var adapt = function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (; /* no initialization */delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	};

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	var decode = function decode(input) {
		// Don't use UCS-2.
		var output = [];
		var inputLength = input.length;
		var i = 0;
		var n = initialN;
		var bias = initialBias;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		var basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (var j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error$1('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (var index = basic > 0 ? basic + 1 : 0; index < inputLength;) /* no final expression */{

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			var oldi = i;
			for (var w = 1, k = base;; /* no condition */k += base) {

				if (index >= inputLength) {
					error$1('invalid-input');
				}

				var digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error$1('overflow');
				}

				i += digit * w;
				var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

				if (digit < t) {
					break;
				}

				var baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error$1('overflow');
				}

				w *= baseMinusT;
			}

			var out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error$1('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output.
			output.splice(i++, 0, n);
		}

		return String.fromCodePoint.apply(String, output);
	};

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	var encode = function encode(input) {
		var output = [];

		// Convert the input in UCS-2 to an array of Unicode code points.
		input = ucs2decode(input);

		// Cache the length.
		var inputLength = input.length;

		// Initialize the state.
		var n = initialN;
		var delta = 0;
		var bias = initialBias;

		// Handle the basic code points.
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = input[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var _currentValue2 = _step.value;

				if (_currentValue2 < 0x80) {
					output.push(stringFromCharCode(_currentValue2));
				}
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		var basicLength = output.length;
		var handledCPCount = basicLength;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string with a delimiter unless it's empty.
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			var m = maxInt;
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = input[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var currentValue = _step2.value;

					if (currentValue >= n && currentValue < m) {
						m = currentValue;
					}
				}

				// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
				// but guard against overflow.
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			var handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error$1('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			var _iteratorNormalCompletion3 = true;
			var _didIteratorError3 = false;
			var _iteratorError3 = undefined;

			try {
				for (var _iterator3 = input[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
					var _currentValue = _step3.value;

					if (_currentValue < n && ++delta > maxInt) {
						error$1('overflow');
					}
					if (_currentValue == n) {
						// Represent delta as a generalized variable-length integer.
						var q = delta;
						for (var k = base;; /* no condition */k += base) {
							var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
							if (q < t) {
								break;
							}
							var qMinusT = q - t;
							var baseMinusT = base - t;
							output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
							q = floor(qMinusT / baseMinusT);
						}

						output.push(stringFromCharCode(digitToBasic(q, 0)));
						bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
						delta = 0;
						++handledCPCount;
					}
				}
			} catch (err) {
				_didIteratorError3 = true;
				_iteratorError3 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion3 && _iterator3.return) {
						_iterator3.return();
					}
				} finally {
					if (_didIteratorError3) {
						throw _iteratorError3;
					}
				}
			}

			++delta;
			++n;
		}
		return output.join('');
	};

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	var toUnicode = function toUnicode(input) {
		return mapDomain(input, function (string) {
			return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
		});
	};

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	var toASCII = function toASCII(input) {
		return mapDomain(input, function (string) {
			return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
		});
	};

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	var punycode = {
		/**
	  * A string representing the current Punycode.js version number.
	  * @memberOf punycode
	  * @type String
	  */
		'version': '2.1.0',
		/**
	  * An object of methods to convert from JavaScript's internal character
	  * representation (UCS-2) to Unicode code points, and back.
	  * @see <https://mathiasbynens.be/notes/javascript-encoding>
	  * @memberOf punycode
	  * @type Object
	  */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/**
	 * URI.js
	 *
	 * @fileoverview An RFC 3986 compliant, scheme extendable URI parsing/validating/resolving library for JavaScript.
	 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
	 * @see http://github.com/garycourt/uri-js
	 */
	/**
	 * Copyright 2011 Gary Court. All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without modification, are
	 * permitted provided that the following conditions are met:
	 *
	 *    1. Redistributions of source code must retain the above copyright notice, this list of
	 *       conditions and the following disclaimer.
	 *
	 *    2. Redistributions in binary form must reproduce the above copyright notice, this list
	 *       of conditions and the following disclaimer in the documentation and/or other materials
	 *       provided with the distribution.
	 *
	 * THIS SOFTWARE IS PROVIDED BY GARY COURT ``AS IS'' AND ANY EXPRESS OR IMPLIED
	 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GARY COURT OR
	 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
	 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
	 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
	 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
	 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 *
	 * The views and conclusions contained in the software and documentation are those of the
	 * authors and should not be interpreted as representing official policies, either expressed
	 * or implied, of Gary Court.
	 */
	var SCHEMES = {};
	function pctEncChar(chr) {
	    var c = chr.charCodeAt(0);
	    var e = void 0;
	    if (c < 16) e = "%0" + c.toString(16).toUpperCase();else if (c < 128) e = "%" + c.toString(16).toUpperCase();else if (c < 2048) e = "%" + (c >> 6 | 192).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();else e = "%" + (c >> 12 | 224).toString(16).toUpperCase() + "%" + (c >> 6 & 63 | 128).toString(16).toUpperCase() + "%" + (c & 63 | 128).toString(16).toUpperCase();
	    return e;
	}
	function pctDecChars(str) {
	    var newStr = "";
	    var i = 0;
	    var il = str.length;
	    while (i < il) {
	        var c = parseInt(str.substr(i + 1, 2), 16);
	        if (c < 128) {
	            newStr += String.fromCharCode(c);
	            i += 3;
	        } else if (c >= 194 && c < 224) {
	            if (il - i >= 6) {
	                var c2 = parseInt(str.substr(i + 4, 2), 16);
	                newStr += String.fromCharCode((c & 31) << 6 | c2 & 63);
	            } else {
	                newStr += str.substr(i, 6);
	            }
	            i += 6;
	        } else if (c >= 224) {
	            if (il - i >= 9) {
	                var _c = parseInt(str.substr(i + 4, 2), 16);
	                var c3 = parseInt(str.substr(i + 7, 2), 16);
	                newStr += String.fromCharCode((c & 15) << 12 | (_c & 63) << 6 | c3 & 63);
	            } else {
	                newStr += str.substr(i, 9);
	            }
	            i += 9;
	        } else {
	            newStr += str.substr(i, 3);
	            i += 3;
	        }
	    }
	    return newStr;
	}
	function _normalizeComponentEncoding(components, protocol) {
	    function decodeUnreserved(str) {
	        var decStr = pctDecChars(str);
	        return !decStr.match(protocol.UNRESERVED) ? str : decStr;
	    }
	    if (components.scheme) components.scheme = String(components.scheme).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_SCHEME, "");
	    if (components.userinfo !== undefined) components.userinfo = String(components.userinfo).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_USERINFO, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
	    if (components.host !== undefined) components.host = String(components.host).replace(protocol.PCT_ENCODED, decodeUnreserved).toLowerCase().replace(protocol.NOT_HOST, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
	    if (components.path !== undefined) components.path = String(components.path).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(components.scheme ? protocol.NOT_PATH : protocol.NOT_PATH_NOSCHEME, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
	    if (components.query !== undefined) components.query = String(components.query).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_QUERY, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
	    if (components.fragment !== undefined) components.fragment = String(components.fragment).replace(protocol.PCT_ENCODED, decodeUnreserved).replace(protocol.NOT_FRAGMENT, pctEncChar).replace(protocol.PCT_ENCODED, toUpperCase);
	    return components;
	}

	function _stripLeadingZeros(str) {
	    return str.replace(/^0*(.*)/, "$1") || "0";
	}
	function _normalizeIPv4(host, protocol) {
	    var matches = host.match(protocol.IPV4ADDRESS) || [];

	    var _matches = slicedToArray(matches, 2),
	        address = _matches[1];

	    if (address) {
	        return address.split(".").map(_stripLeadingZeros).join(".");
	    } else {
	        return host;
	    }
	}
	function _normalizeIPv6(host, protocol) {
	    var matches = host.match(protocol.IPV6ADDRESS) || [];

	    var _matches2 = slicedToArray(matches, 3),
	        address = _matches2[1],
	        zone = _matches2[2];

	    if (address) {
	        var _address$toLowerCase$ = address.toLowerCase().split('::').reverse(),
	            _address$toLowerCase$2 = slicedToArray(_address$toLowerCase$, 2),
	            last = _address$toLowerCase$2[0],
	            first = _address$toLowerCase$2[1];

	        var firstFields = first ? first.split(":").map(_stripLeadingZeros) : [];
	        var lastFields = last.split(":").map(_stripLeadingZeros);
	        var isLastFieldIPv4Address = protocol.IPV4ADDRESS.test(lastFields[lastFields.length - 1]);
	        var fieldCount = isLastFieldIPv4Address ? 7 : 8;
	        var lastFieldsStart = lastFields.length - fieldCount;
	        var fields = Array(fieldCount);
	        for (var x = 0; x < fieldCount; ++x) {
	            fields[x] = firstFields[x] || lastFields[lastFieldsStart + x] || '';
	        }
	        if (isLastFieldIPv4Address) {
	            fields[fieldCount - 1] = _normalizeIPv4(fields[fieldCount - 1], protocol);
	        }
	        var allZeroFields = fields.reduce(function (acc, field, index) {
	            if (!field || field === "0") {
	                var lastLongest = acc[acc.length - 1];
	                if (lastLongest && lastLongest.index + lastLongest.length === index) {
	                    lastLongest.length++;
	                } else {
	                    acc.push({ index: index, length: 1 });
	                }
	            }
	            return acc;
	        }, []);
	        var longestZeroFields = allZeroFields.sort(function (a, b) {
	            return b.length - a.length;
	        })[0];
	        var newHost = void 0;
	        if (longestZeroFields && longestZeroFields.length > 1) {
	            var newFirst = fields.slice(0, longestZeroFields.index);
	            var newLast = fields.slice(longestZeroFields.index + longestZeroFields.length);
	            newHost = newFirst.join(":") + "::" + newLast.join(":");
	        } else {
	            newHost = fields.join(":");
	        }
	        if (zone) {
	            newHost += "%" + zone;
	        }
	        return newHost;
	    } else {
	        return host;
	    }
	}
	var URI_PARSE = /^(?:([^:\/?#]+):)?(?:\/\/((?:([^\/?#@]*)@)?(\[[^\/?#\]]+\]|[^\/?#:]*)(?:\:(\d*))?))?([^?#]*)(?:\?([^#]*))?(?:#((?:.|\n|\r)*))?/i;
	var NO_MATCH_IS_UNDEFINED = "".match(/(){0}/)[1] === undefined;
	function parse(uriString) {
	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    var components = {};
	    var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
	    if (options.reference === "suffix") uriString = (options.scheme ? options.scheme + ":" : "") + "//" + uriString;
	    var matches = uriString.match(URI_PARSE);
	    if (matches) {
	        if (NO_MATCH_IS_UNDEFINED) {
	            //store each component
	            components.scheme = matches[1];
	            components.userinfo = matches[3];
	            components.host = matches[4];
	            components.port = parseInt(matches[5], 10);
	            components.path = matches[6] || "";
	            components.query = matches[7];
	            components.fragment = matches[8];
	            //fix port number
	            if (isNaN(components.port)) {
	                components.port = matches[5];
	            }
	        } else {
	            //IE FIX for improper RegExp matching
	            //store each component
	            components.scheme = matches[1] || undefined;
	            components.userinfo = uriString.indexOf("@") !== -1 ? matches[3] : undefined;
	            components.host = uriString.indexOf("//") !== -1 ? matches[4] : undefined;
	            components.port = parseInt(matches[5], 10);
	            components.path = matches[6] || "";
	            components.query = uriString.indexOf("?") !== -1 ? matches[7] : undefined;
	            components.fragment = uriString.indexOf("#") !== -1 ? matches[8] : undefined;
	            //fix port number
	            if (isNaN(components.port)) {
	                components.port = uriString.match(/\/\/(?:.|\n)*\:(?:\/|\?|\#|$)/) ? matches[4] : undefined;
	            }
	        }
	        if (components.host) {
	            //normalize IP hosts
	            components.host = _normalizeIPv6(_normalizeIPv4(components.host, protocol), protocol);
	        }
	        //determine reference type
	        if (components.scheme === undefined && components.userinfo === undefined && components.host === undefined && components.port === undefined && !components.path && components.query === undefined) {
	            components.reference = "same-document";
	        } else if (components.scheme === undefined) {
	            components.reference = "relative";
	        } else if (components.fragment === undefined) {
	            components.reference = "absolute";
	        } else {
	            components.reference = "uri";
	        }
	        //check for reference errors
	        if (options.reference && options.reference !== "suffix" && options.reference !== components.reference) {
	            components.error = components.error || "URI is not a " + options.reference + " reference.";
	        }
	        //find scheme handler
	        var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
	        //check if scheme can't handle IRIs
	        if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
	            //if host component is a domain name
	            if (components.host && (options.domainHost || schemeHandler && schemeHandler.domainHost)) {
	                //convert Unicode IDN -> ASCII IDN
	                try {
	                    components.host = punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase());
	                } catch (e) {
	                    components.error = components.error || "Host's domain name can not be converted to ASCII via punycode: " + e;
	                }
	            }
	            //convert IRI -> URI
	            _normalizeComponentEncoding(components, URI_PROTOCOL);
	        } else {
	            //normalize encodings
	            _normalizeComponentEncoding(components, protocol);
	        }
	        //perform scheme specific parsing
	        if (schemeHandler && schemeHandler.parse) {
	            schemeHandler.parse(components, options);
	        }
	    } else {
	        components.error = components.error || "URI can not be parsed.";
	    }
	    return components;
	}

	function _recomposeAuthority(components, options) {
	    var protocol = options.iri !== false ? IRI_PROTOCOL : URI_PROTOCOL;
	    var uriTokens = [];
	    if (components.userinfo !== undefined) {
	        uriTokens.push(components.userinfo);
	        uriTokens.push("@");
	    }
	    if (components.host !== undefined) {
	        //normalize IP hosts, add brackets and escape zone separator for IPv6
	        uriTokens.push(_normalizeIPv6(_normalizeIPv4(String(components.host), protocol), protocol).replace(protocol.IPV6ADDRESS, function (_, $1, $2) {
	            return "[" + $1 + ($2 ? "%25" + $2 : "") + "]";
	        }));
	    }
	    if (typeof components.port === "number" || typeof components.port === "string") {
	        uriTokens.push(":");
	        uriTokens.push(String(components.port));
	    }
	    return uriTokens.length ? uriTokens.join("") : undefined;
	}

	var RDS1 = /^\.\.?\//;
	var RDS2 = /^\/\.(\/|$)/;
	var RDS3 = /^\/\.\.(\/|$)/;
	var RDS5 = /^\/?(?:.|\n)*?(?=\/|$)/;
	function removeDotSegments(input) {
	    var output = [];
	    while (input.length) {
	        if (input.match(RDS1)) {
	            input = input.replace(RDS1, "");
	        } else if (input.match(RDS2)) {
	            input = input.replace(RDS2, "/");
	        } else if (input.match(RDS3)) {
	            input = input.replace(RDS3, "/");
	            output.pop();
	        } else if (input === "." || input === "..") {
	            input = "";
	        } else {
	            var im = input.match(RDS5);
	            if (im) {
	                var s = im[0];
	                input = input.slice(s.length);
	                output.push(s);
	            } else {
	                throw new Error("Unexpected dot segment condition");
	            }
	        }
	    }
	    return output.join("");
	}

	function serialize(components) {
	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    var protocol = options.iri ? IRI_PROTOCOL : URI_PROTOCOL;
	    var uriTokens = [];
	    //find scheme handler
	    var schemeHandler = SCHEMES[(options.scheme || components.scheme || "").toLowerCase()];
	    //perform scheme specific serialization
	    if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(components, options);
	    if (components.host) {
	        //if host component is an IPv6 address
	        if (protocol.IPV6ADDRESS.test(components.host)) ;
	        //TODO: normalize IPv6 address as per RFC 5952

	        //if host component is a domain name
	        else if (options.domainHost || schemeHandler && schemeHandler.domainHost) {
	                //convert IDN via punycode
	                try {
	                    components.host = !options.iri ? punycode.toASCII(components.host.replace(protocol.PCT_ENCODED, pctDecChars).toLowerCase()) : punycode.toUnicode(components.host);
	                } catch (e) {
	                    components.error = components.error || "Host's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
	                }
	            }
	    }
	    //normalize encoding
	    _normalizeComponentEncoding(components, protocol);
	    if (options.reference !== "suffix" && components.scheme) {
	        uriTokens.push(components.scheme);
	        uriTokens.push(":");
	    }
	    var authority = _recomposeAuthority(components, options);
	    if (authority !== undefined) {
	        if (options.reference !== "suffix") {
	            uriTokens.push("//");
	        }
	        uriTokens.push(authority);
	        if (components.path && components.path.charAt(0) !== "/") {
	            uriTokens.push("/");
	        }
	    }
	    if (components.path !== undefined) {
	        var s = components.path;
	        if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
	            s = removeDotSegments(s);
	        }
	        if (authority === undefined) {
	            s = s.replace(/^\/\//, "/%2F"); //don't allow the path to start with "//"
	        }
	        uriTokens.push(s);
	    }
	    if (components.query !== undefined) {
	        uriTokens.push("?");
	        uriTokens.push(components.query);
	    }
	    if (components.fragment !== undefined) {
	        uriTokens.push("#");
	        uriTokens.push(components.fragment);
	    }
	    return uriTokens.join(""); //merge tokens into a string
	}

	function resolveComponents(base, relative) {
	    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	    var skipNormalization = arguments[3];

	    var target = {};
	    if (!skipNormalization) {
	        base = parse(serialize(base, options), options); //normalize base components
	        relative = parse(serialize(relative, options), options); //normalize relative components
	    }
	    options = options || {};
	    if (!options.tolerant && relative.scheme) {
	        target.scheme = relative.scheme;
	        //target.authority = relative.authority;
	        target.userinfo = relative.userinfo;
	        target.host = relative.host;
	        target.port = relative.port;
	        target.path = removeDotSegments(relative.path || "");
	        target.query = relative.query;
	    } else {
	        if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
	            //target.authority = relative.authority;
	            target.userinfo = relative.userinfo;
	            target.host = relative.host;
	            target.port = relative.port;
	            target.path = removeDotSegments(relative.path || "");
	            target.query = relative.query;
	        } else {
	            if (!relative.path) {
	                target.path = base.path;
	                if (relative.query !== undefined) {
	                    target.query = relative.query;
	                } else {
	                    target.query = base.query;
	                }
	            } else {
	                if (relative.path.charAt(0) === "/") {
	                    target.path = removeDotSegments(relative.path);
	                } else {
	                    if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
	                        target.path = "/" + relative.path;
	                    } else if (!base.path) {
	                        target.path = relative.path;
	                    } else {
	                        target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
	                    }
	                    target.path = removeDotSegments(target.path);
	                }
	                target.query = relative.query;
	            }
	            //target.authority = base.authority;
	            target.userinfo = base.userinfo;
	            target.host = base.host;
	            target.port = base.port;
	        }
	        target.scheme = base.scheme;
	    }
	    target.fragment = relative.fragment;
	    return target;
	}

	function resolve(baseURI, relativeURI, options) {
	    var schemelessOptions = assign({ scheme: 'null' }, options);
	    return serialize(resolveComponents(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true), schemelessOptions);
	}

	function normalize(uri, options) {
	    if (typeof uri === "string") {
	        uri = serialize(parse(uri, options), options);
	    } else if (typeOf(uri) === "object") {
	        uri = parse(serialize(uri, options), options);
	    }
	    return uri;
	}

	function equal(uriA, uriB, options) {
	    if (typeof uriA === "string") {
	        uriA = serialize(parse(uriA, options), options);
	    } else if (typeOf(uriA) === "object") {
	        uriA = serialize(uriA, options);
	    }
	    if (typeof uriB === "string") {
	        uriB = serialize(parse(uriB, options), options);
	    } else if (typeOf(uriB) === "object") {
	        uriB = serialize(uriB, options);
	    }
	    return uriA === uriB;
	}

	function escapeComponent(str, options) {
	    return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.ESCAPE : IRI_PROTOCOL.ESCAPE, pctEncChar);
	}

	function unescapeComponent(str, options) {
	    return str && str.toString().replace(!options || !options.iri ? URI_PROTOCOL.PCT_ENCODED : IRI_PROTOCOL.PCT_ENCODED, pctDecChars);
	}

	var handler = {
	    scheme: "http",
	    domainHost: true,
	    parse: function parse(components, options) {
	        //report missing host
	        if (!components.host) {
	            components.error = components.error || "HTTP URIs must have a host.";
	        }
	        return components;
	    },
	    serialize: function serialize(components, options) {
	        var secure = String(components.scheme).toLowerCase() === "https";
	        //normalize the default port
	        if (components.port === (secure ? 443 : 80) || components.port === "") {
	            components.port = undefined;
	        }
	        //normalize the empty path
	        if (!components.path) {
	            components.path = "/";
	        }
	        //NOTE: We do not parse query strings for HTTP URIs
	        //as WWW Form Url Encoded query strings are part of the HTML4+ spec,
	        //and not the HTTP spec.
	        return components;
	    }
	};

	var handler$1 = {
	    scheme: "https",
	    domainHost: handler.domainHost,
	    parse: handler.parse,
	    serialize: handler.serialize
	};

	function isSecure(wsComponents) {
	    return typeof wsComponents.secure === 'boolean' ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === "wss";
	}
	//RFC 6455
	var handler$2 = {
	    scheme: "ws",
	    domainHost: true,
	    parse: function parse(components, options) {
	        var wsComponents = components;
	        //indicate if the secure flag is set
	        wsComponents.secure = isSecure(wsComponents);
	        //construct resouce name
	        wsComponents.resourceName = (wsComponents.path || '/') + (wsComponents.query ? '?' + wsComponents.query : '');
	        wsComponents.path = undefined;
	        wsComponents.query = undefined;
	        return wsComponents;
	    },
	    serialize: function serialize(wsComponents, options) {
	        //normalize the default port
	        if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === "") {
	            wsComponents.port = undefined;
	        }
	        //ensure scheme matches secure flag
	        if (typeof wsComponents.secure === 'boolean') {
	            wsComponents.scheme = wsComponents.secure ? 'wss' : 'ws';
	            wsComponents.secure = undefined;
	        }
	        //reconstruct path from resource name
	        if (wsComponents.resourceName) {
	            var _wsComponents$resourc = wsComponents.resourceName.split('?'),
	                _wsComponents$resourc2 = slicedToArray(_wsComponents$resourc, 2),
	                path = _wsComponents$resourc2[0],
	                query = _wsComponents$resourc2[1];

	            wsComponents.path = path && path !== '/' ? path : undefined;
	            wsComponents.query = query;
	            wsComponents.resourceName = undefined;
	        }
	        //forbid fragment component
	        wsComponents.fragment = undefined;
	        return wsComponents;
	    }
	};

	var handler$3 = {
	    scheme: "wss",
	    domainHost: handler$2.domainHost,
	    parse: handler$2.parse,
	    serialize: handler$2.serialize
	};

	var O = {};
	//RFC 3986
	var UNRESERVED$$ = "[A-Za-z0-9\\-\\.\\_\\~" + ( "\\xA0-\\u200D\\u2010-\\u2029\\u202F-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF" ) + "]";
	var HEXDIG$$ = "[0-9A-Fa-f]"; //case-insensitive
	var PCT_ENCODED$ = subexp(subexp("%[EFef]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%[89A-Fa-f]" + HEXDIG$$ + "%" + HEXDIG$$ + HEXDIG$$) + "|" + subexp("%" + HEXDIG$$ + HEXDIG$$)); //expanded
	//RFC 5322, except these symbols as per RFC 6068: @ : / ? # [ ] & ; =
	//const ATEXT$$ = "[A-Za-z0-9\\!\\#\\$\\%\\&\\'\\*\\+\\-\\/\\=\\?\\^\\_\\`\\{\\|\\}\\~]";
	//const WSP$$ = "[\\x20\\x09]";
	//const OBS_QTEXT$$ = "[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]";  //(%d1-8 / %d11-12 / %d14-31 / %d127)
	//const QTEXT$$ = merge("[\\x21\\x23-\\x5B\\x5D-\\x7E]", OBS_QTEXT$$);  //%d33 / %d35-91 / %d93-126 / obs-qtext
	//const VCHAR$$ = "[\\x21-\\x7E]";
	//const WSP$$ = "[\\x20\\x09]";
	//const OBS_QP$ = subexp("\\\\" + merge("[\\x00\\x0D\\x0A]", OBS_QTEXT$$));  //%d0 / CR / LF / obs-qtext
	//const FWS$ = subexp(subexp(WSP$$ + "*" + "\\x0D\\x0A") + "?" + WSP$$ + "+");
	//const QUOTED_PAIR$ = subexp(subexp("\\\\" + subexp(VCHAR$$ + "|" + WSP$$)) + "|" + OBS_QP$);
	//const QUOTED_STRING$ = subexp('\\"' + subexp(FWS$ + "?" + QCONTENT$) + "*" + FWS$ + "?" + '\\"');
	var ATEXT$$ = "[A-Za-z0-9\\!\\$\\%\\'\\*\\+\\-\\^\\_\\`\\{\\|\\}\\~]";
	var QTEXT$$ = "[\\!\\$\\%\\'\\(\\)\\*\\+\\,\\-\\.0-9\\<\\>A-Z\\x5E-\\x7E]";
	var VCHAR$$ = merge(QTEXT$$, "[\\\"\\\\]");
	var SOME_DELIMS$$ = "[\\!\\$\\'\\(\\)\\*\\+\\,\\;\\:\\@]";
	var UNRESERVED = new RegExp(UNRESERVED$$, "g");
	var PCT_ENCODED = new RegExp(PCT_ENCODED$, "g");
	var NOT_LOCAL_PART = new RegExp(merge("[^]", ATEXT$$, "[\\.]", '[\\"]', VCHAR$$), "g");
	var NOT_HFNAME = new RegExp(merge("[^]", UNRESERVED$$, SOME_DELIMS$$), "g");
	var NOT_HFVALUE = NOT_HFNAME;
	function decodeUnreserved(str) {
	    var decStr = pctDecChars(str);
	    return !decStr.match(UNRESERVED) ? str : decStr;
	}
	var handler$4 = {
	    scheme: "mailto",
	    parse: function parse$$1(components, options) {
	        var mailtoComponents = components;
	        var to = mailtoComponents.to = mailtoComponents.path ? mailtoComponents.path.split(",") : [];
	        mailtoComponents.path = undefined;
	        if (mailtoComponents.query) {
	            var unknownHeaders = false;
	            var headers = {};
	            var hfields = mailtoComponents.query.split("&");
	            for (var x = 0, xl = hfields.length; x < xl; ++x) {
	                var hfield = hfields[x].split("=");
	                switch (hfield[0]) {
	                    case "to":
	                        var toAddrs = hfield[1].split(",");
	                        for (var _x = 0, _xl = toAddrs.length; _x < _xl; ++_x) {
	                            to.push(toAddrs[_x]);
	                        }
	                        break;
	                    case "subject":
	                        mailtoComponents.subject = unescapeComponent(hfield[1], options);
	                        break;
	                    case "body":
	                        mailtoComponents.body = unescapeComponent(hfield[1], options);
	                        break;
	                    default:
	                        unknownHeaders = true;
	                        headers[unescapeComponent(hfield[0], options)] = unescapeComponent(hfield[1], options);
	                        break;
	                }
	            }
	            if (unknownHeaders) mailtoComponents.headers = headers;
	        }
	        mailtoComponents.query = undefined;
	        for (var _x2 = 0, _xl2 = to.length; _x2 < _xl2; ++_x2) {
	            var addr = to[_x2].split("@");
	            addr[0] = unescapeComponent(addr[0]);
	            if (!options.unicodeSupport) {
	                //convert Unicode IDN -> ASCII IDN
	                try {
	                    addr[1] = punycode.toASCII(unescapeComponent(addr[1], options).toLowerCase());
	                } catch (e) {
	                    mailtoComponents.error = mailtoComponents.error || "Email address's domain name can not be converted to ASCII via punycode: " + e;
	                }
	            } else {
	                addr[1] = unescapeComponent(addr[1], options).toLowerCase();
	            }
	            to[_x2] = addr.join("@");
	        }
	        return mailtoComponents;
	    },
	    serialize: function serialize$$1(mailtoComponents, options) {
	        var components = mailtoComponents;
	        var to = toArray(mailtoComponents.to);
	        if (to) {
	            for (var x = 0, xl = to.length; x < xl; ++x) {
	                var toAddr = String(to[x]);
	                var atIdx = toAddr.lastIndexOf("@");
	                var localPart = toAddr.slice(0, atIdx).replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_LOCAL_PART, pctEncChar);
	                var domain = toAddr.slice(atIdx + 1);
	                //convert IDN via punycode
	                try {
	                    domain = !options.iri ? punycode.toASCII(unescapeComponent(domain, options).toLowerCase()) : punycode.toUnicode(domain);
	                } catch (e) {
	                    components.error = components.error || "Email address's domain name can not be converted to " + (!options.iri ? "ASCII" : "Unicode") + " via punycode: " + e;
	                }
	                to[x] = localPart + "@" + domain;
	            }
	            components.path = to.join(",");
	        }
	        var headers = mailtoComponents.headers = mailtoComponents.headers || {};
	        if (mailtoComponents.subject) headers["subject"] = mailtoComponents.subject;
	        if (mailtoComponents.body) headers["body"] = mailtoComponents.body;
	        var fields = [];
	        for (var name in headers) {
	            if (headers[name] !== O[name]) {
	                fields.push(name.replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFNAME, pctEncChar) + "=" + headers[name].replace(PCT_ENCODED, decodeUnreserved).replace(PCT_ENCODED, toUpperCase).replace(NOT_HFVALUE, pctEncChar));
	            }
	        }
	        if (fields.length) {
	            components.query = fields.join("&");
	        }
	        return components;
	    }
	};

	var URN_PARSE = /^([^\:]+)\:(.*)/;
	//RFC 2141
	var handler$5 = {
	    scheme: "urn",
	    parse: function parse$$1(components, options) {
	        var matches = components.path && components.path.match(URN_PARSE);
	        var urnComponents = components;
	        if (matches) {
	            var scheme = options.scheme || urnComponents.scheme || "urn";
	            var nid = matches[1].toLowerCase();
	            var nss = matches[2];
	            var urnScheme = scheme + ":" + (options.nid || nid);
	            var schemeHandler = SCHEMES[urnScheme];
	            urnComponents.nid = nid;
	            urnComponents.nss = nss;
	            urnComponents.path = undefined;
	            if (schemeHandler) {
	                urnComponents = schemeHandler.parse(urnComponents, options);
	            }
	        } else {
	            urnComponents.error = urnComponents.error || "URN can not be parsed.";
	        }
	        return urnComponents;
	    },
	    serialize: function serialize$$1(urnComponents, options) {
	        var scheme = options.scheme || urnComponents.scheme || "urn";
	        var nid = urnComponents.nid;
	        var urnScheme = scheme + ":" + (options.nid || nid);
	        var schemeHandler = SCHEMES[urnScheme];
	        if (schemeHandler) {
	            urnComponents = schemeHandler.serialize(urnComponents, options);
	        }
	        var uriComponents = urnComponents;
	        var nss = urnComponents.nss;
	        uriComponents.path = (nid || options.nid) + ":" + nss;
	        return uriComponents;
	    }
	};

	var UUID = /^[0-9A-Fa-f]{8}(?:\-[0-9A-Fa-f]{4}){3}\-[0-9A-Fa-f]{12}$/;
	//RFC 4122
	var handler$6 = {
	    scheme: "urn:uuid",
	    parse: function parse(urnComponents, options) {
	        var uuidComponents = urnComponents;
	        uuidComponents.uuid = uuidComponents.nss;
	        uuidComponents.nss = undefined;
	        if (!options.tolerant && (!uuidComponents.uuid || !uuidComponents.uuid.match(UUID))) {
	            uuidComponents.error = uuidComponents.error || "UUID is not valid.";
	        }
	        return uuidComponents;
	    },
	    serialize: function serialize(uuidComponents, options) {
	        var urnComponents = uuidComponents;
	        //normalize UUID
	        urnComponents.nss = (uuidComponents.uuid || "").toLowerCase();
	        return urnComponents;
	    }
	};

	SCHEMES[handler.scheme] = handler;
	SCHEMES[handler$1.scheme] = handler$1;
	SCHEMES[handler$2.scheme] = handler$2;
	SCHEMES[handler$3.scheme] = handler$3;
	SCHEMES[handler$4.scheme] = handler$4;
	SCHEMES[handler$5.scheme] = handler$5;
	SCHEMES[handler$6.scheme] = handler$6;

	exports.SCHEMES = SCHEMES;
	exports.pctEncChar = pctEncChar;
	exports.pctDecChars = pctDecChars;
	exports.parse = parse;
	exports.removeDotSegments = removeDotSegments;
	exports.serialize = serialize;
	exports.resolveComponents = resolveComponents;
	exports.resolve = resolve;
	exports.normalize = normalize;
	exports.equal = equal;
	exports.escapeComponent = escapeComponent;
	exports.unescapeComponent = unescapeComponent;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));

	});

	var resolve = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;




	// TODO refactor to use keyword definitions
	const SIMPLE_INLINED = new Set([
	    "type",
	    "format",
	    "pattern",
	    "maxLength",
	    "minLength",
	    "maxProperties",
	    "minProperties",
	    "maxItems",
	    "minItems",
	    "maximum",
	    "minimum",
	    "uniqueItems",
	    "multipleOf",
	    "required",
	    "enum",
	    "const",
	]);
	function inlineRef(schema, limit = true) {
	    if (typeof schema == "boolean")
	        return true;
	    if (limit === true)
	        return !hasRef(schema);
	    if (!limit)
	        return false;
	    return countKeys(schema) <= limit;
	}
	exports.inlineRef = inlineRef;
	const REF_KEYWORDS = new Set([
	    "$ref",
	    "$recursiveRef",
	    "$recursiveAnchor",
	    "$dynamicRef",
	    "$dynamicAnchor",
	]);
	function hasRef(schema) {
	    for (const key in schema) {
	        if (REF_KEYWORDS.has(key))
	            return true;
	        const sch = schema[key];
	        if (Array.isArray(sch) && sch.some(hasRef))
	            return true;
	        if (typeof sch == "object" && hasRef(sch))
	            return true;
	    }
	    return false;
	}
	function countKeys(schema) {
	    let count = 0;
	    for (const key in schema) {
	        if (key === "$ref")
	            return Infinity;
	        count++;
	        if (SIMPLE_INLINED.has(key))
	            continue;
	        if (typeof schema[key] == "object") {
	            util.eachItem(schema[key], (sch) => (count += countKeys(sch)));
	        }
	        if (count === Infinity)
	            return Infinity;
	    }
	    return count;
	}
	function getFullPath(id = "", normalize) {
	    if (normalize !== false)
	        id = normalizeId(id);
	    const p = uri_all.parse(id);
	    return _getFullPath(p);
	}
	exports.getFullPath = getFullPath;
	function _getFullPath(p) {
	    return uri_all.serialize(p).split("#")[0] + "#";
	}
	exports._getFullPath = _getFullPath;
	const TRAILING_SLASH_HASH = /#\/?$/;
	function normalizeId(id) {
	    return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
	}
	exports.normalizeId = normalizeId;
	function resolveUrl(baseId, id) {
	    id = normalizeId(id);
	    return uri_all.resolve(baseId, id);
	}
	exports.resolveUrl = resolveUrl;
	const ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
	function getSchemaRefs(schema) {
	    if (typeof schema == "boolean")
	        return {};
	    const schemaId = normalizeId(schema.$id);
	    const baseIds = { "": schemaId };
	    const pathPrefix = getFullPath(schemaId, false);
	    const localRefs = {};
	    const schemaRefs = new Set();
	    jsonSchemaTraverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
	        if (parentJsonPtr === undefined)
	            return;
	        const fullPath = pathPrefix + jsonPtr;
	        let baseId = baseIds[parentJsonPtr];
	        if (typeof sch.$id == "string")
	            baseId = addRef.call(this, sch.$id);
	        addAnchor.call(this, sch.$anchor);
	        addAnchor.call(this, sch.$dynamicAnchor);
	        baseIds[jsonPtr] = baseId;
	        function addRef(ref) {
	            ref = normalizeId(baseId ? uri_all.resolve(baseId, ref) : ref);
	            if (schemaRefs.has(ref))
	                throw ambiguos(ref);
	            schemaRefs.add(ref);
	            let schOrRef = this.refs[ref];
	            if (typeof schOrRef == "string")
	                schOrRef = this.refs[schOrRef];
	            if (typeof schOrRef == "object") {
	                checkAmbiguosRef(sch, schOrRef.schema, ref);
	            }
	            else if (ref !== normalizeId(fullPath)) {
	                if (ref[0] === "#") {
	                    checkAmbiguosRef(sch, localRefs[ref], ref);
	                    localRefs[ref] = sch;
	                }
	                else {
	                    this.refs[ref] = fullPath;
	                }
	            }
	            return ref;
	        }
	        function addAnchor(anchor) {
	            if (typeof anchor == "string") {
	                if (!ANCHOR.test(anchor))
	                    throw new Error(`invalid anchor "${anchor}"`);
	                addRef.call(this, `#${anchor}`);
	            }
	        }
	    });
	    return localRefs;
	    function checkAmbiguosRef(sch1, sch2, ref) {
	        if (sch2 !== undefined && !fastDeepEqual(sch1, sch2))
	            throw ambiguos(ref);
	    }
	    function ambiguos(ref) {
	        return new Error(`reference "${ref}" resolves to more than one schema`);
	    }
	}
	exports.getSchemaRefs = getSchemaRefs;

	});

	var validate = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.checkStrictMode = exports.schemaCxtHasRules = exports.subschemaCode = exports.validateFunctionCode = void 0;







	// schema compilation - generates validation function, subschemaCode (below) is used for subschemas
	function validateFunctionCode(it) {
	    if (isSchemaObj(it)) {
	        checkKeywords(it);
	        if (schemaCxtHasRules(it)) {
	            topSchemaObjCode(it);
	            return;
	        }
	    }
	    validateFunction(it, () => boolSchema.topBoolOrEmptySchema(it));
	}
	exports.validateFunctionCode = validateFunctionCode;
	function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
	    if (opts.code.es5) {
	        gen.func(validateName, codegen._ `${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
	            gen.code(codegen._ `"use strict"; ${funcSourceUrl(schema, opts)}`);
	            destructureValCxtES5(gen, opts);
	            gen.code(body);
	        });
	    }
	    else {
	        gen.func(validateName, codegen._ `${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
	    }
	}
	function destructureValCxt(opts) {
	    return codegen._ `{${names_1.default.dataPath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? codegen._ `, ${names_1.default.dynamicAnchors}={}` : codegen.nil}}={}`;
	}
	function destructureValCxtES5(gen, opts) {
	    gen.if(names_1.default.valCxt, () => {
	        gen.var(names_1.default.dataPath, codegen._ `${names_1.default.valCxt}.${names_1.default.dataPath}`);
	        gen.var(names_1.default.parentData, codegen._ `${names_1.default.valCxt}.${names_1.default.parentData}`);
	        gen.var(names_1.default.parentDataProperty, codegen._ `${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
	        gen.var(names_1.default.rootData, codegen._ `${names_1.default.valCxt}.${names_1.default.rootData}`);
	        if (opts.dynamicRef)
	            gen.var(names_1.default.dynamicAnchors, codegen._ `${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
	    }, () => {
	        gen.var(names_1.default.dataPath, codegen._ `""`);
	        gen.var(names_1.default.parentData, codegen._ `undefined`);
	        gen.var(names_1.default.parentDataProperty, codegen._ `undefined`);
	        gen.var(names_1.default.rootData, names_1.default.data);
	        if (opts.dynamicRef)
	            gen.var(names_1.default.dynamicAnchors, codegen._ `{}`);
	    });
	}
	function topSchemaObjCode(it) {
	    const { schema, opts, gen } = it;
	    validateFunction(it, () => {
	        if (opts.$comment && schema.$comment)
	            commentKeyword(it);
	        checkNoDefault(it);
	        gen.let(names_1.default.vErrors, null);
	        gen.let(names_1.default.errors, 0);
	        if (opts.unevaluated)
	            resetEvaluated(it);
	        typeAndKeywords(it);
	        returnResults(it);
	    });
	    return;
	}
	function resetEvaluated(it) {
	    // TODO maybe some hook to execute it in the end to check whether props/items are Name, as in assignEvaluated
	    const { gen, validateName } = it;
	    it.evaluated = gen.const("evaluated", codegen._ `${validateName}.evaluated`);
	    gen.if(codegen._ `${it.evaluated}.dynamicProps`, () => gen.assign(codegen._ `${it.evaluated}.props`, codegen._ `undefined`));
	    gen.if(codegen._ `${it.evaluated}.dynamicItems`, () => gen.assign(codegen._ `${it.evaluated}.items`, codegen._ `undefined`));
	}
	function funcSourceUrl(schema, opts) {
	    return typeof schema == "object" && schema.$id && (opts.code.source || opts.code.process)
	        ? codegen._ `/*# sourceURL=${schema.$id} */`
	        : codegen.nil;
	}
	// schema compilation - this function is used recursively to generate code for sub-schemas
	function subschemaCode(it, valid) {
	    if (isSchemaObj(it)) {
	        checkKeywords(it);
	        if (schemaCxtHasRules(it)) {
	            subSchemaObjCode(it, valid);
	            return;
	        }
	    }
	    boolSchema.boolOrEmptySchema(it, valid);
	}
	exports.subschemaCode = subschemaCode;
	function schemaCxtHasRules({ schema, self }) {
	    if (typeof schema == "boolean")
	        return !schema;
	    for (const key in schema)
	        if (self.RULES.all[key])
	            return true;
	    return false;
	}
	exports.schemaCxtHasRules = schemaCxtHasRules;
	function isSchemaObj(it) {
	    return typeof it.schema != "boolean";
	}
	function subSchemaObjCode(it, valid) {
	    const { schema, gen, opts } = it;
	    if (opts.$comment && schema.$comment)
	        commentKeyword(it);
	    updateContext(it);
	    checkAsync(it);
	    const errsCount = gen.const("_errs", names_1.default.errors);
	    typeAndKeywords(it, errsCount);
	    // TODO var
	    gen.var(valid, codegen._ `${errsCount} === ${names_1.default.errors}`);
	}
	function checkKeywords(it) {
	    util.checkUnknownRules(it);
	    checkRefsAndKeywords(it);
	}
	function typeAndKeywords(it, errsCount) {
	    const types = dataType.getSchemaTypes(it.schema);
	    const checkedTypes = dataType.coerceAndCheckDataType(it, types);
	    iterate.schemaKeywords(it, types, !checkedTypes, errsCount);
	}
	function checkRefsAndKeywords(it) {
	    const { schema, errSchemaPath, opts, self } = it;
	    if (schema.$ref && opts.ignoreKeywordsWithRef && util.schemaHasRulesButRef(schema, self.RULES)) {
	        self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
	    }
	}
	function checkNoDefault(it) {
	    const { schema, opts } = it;
	    if (schema.default !== undefined && opts.useDefaults && opts.strict) {
	        checkStrictMode(it, "default is ignored in the schema root");
	    }
	}
	function updateContext(it) {
	    if (it.schema.$id)
	        it.baseId = resolve.resolveUrl(it.baseId, it.schema.$id);
	}
	function checkAsync(it) {
	    if (it.schema.$async && !it.schemaEnv.$async)
	        throw new Error("async schema in sync schema");
	}
	function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
	    const msg = schema.$comment;
	    if (opts.$comment === true) {
	        gen.code(codegen._ `${names_1.default.self}.logger.log(${msg})`);
	    }
	    else if (typeof opts.$comment == "function") {
	        const schemaPath = codegen.str `${errSchemaPath}/$comment`;
	        const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
	        gen.code(codegen._ `${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
	    }
	}
	function returnResults(it) {
	    const { gen, schemaEnv, validateName, ValidationError, opts } = it;
	    if (schemaEnv.$async) {
	        // TODO assign unevaluated
	        gen.if(codegen._ `${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw(codegen._ `new ${ValidationError}(${names_1.default.vErrors})`));
	    }
	    else {
	        gen.assign(codegen._ `${validateName}.errors`, names_1.default.vErrors);
	        if (opts.unevaluated)
	            assignEvaluated(it);
	        gen.return(codegen._ `${names_1.default.errors} === 0`);
	    }
	}
	function assignEvaluated({ gen, evaluated, props, items }) {
	    if (props instanceof codegen.Name)
	        gen.assign(codegen._ `${evaluated}.props`, props);
	    if (items instanceof codegen.Name)
	        gen.assign(codegen._ `${evaluated}.items`, items);
	}
	function checkStrictMode(it, msg, mode = it.opts.strict) {
	    if (!mode)
	        return;
	    msg = `strict mode: ${msg}`;
	    if (mode === true)
	        throw new Error(msg);
	    it.self.logger.warn(msg);
	}
	exports.checkStrictMode = checkStrictMode;

	});

	var util = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;


	// TODO refactor to use Set
	function toHash(arr) {
	    const hash = {};
	    for (const item of arr)
	        hash[item] = true;
	    return hash;
	}
	exports.toHash = toHash;
	function alwaysValidSchema(it, schema) {
	    if (typeof schema == "boolean")
	        return schema;
	    if (Object.keys(schema).length === 0)
	        return true;
	    checkUnknownRules(it, schema);
	    return !schemaHasRules(schema, it.self.RULES.all);
	}
	exports.alwaysValidSchema = alwaysValidSchema;
	function checkUnknownRules(it, schema = it.schema) {
	    const { opts, self } = it;
	    if (!opts.strict)
	        return;
	    if (typeof schema === "boolean")
	        return;
	    const rules = self.RULES.keywords;
	    for (const key in schema) {
	        if (!rules[key])
	            validate.checkStrictMode(it, `unknown keyword: "${key}"`);
	    }
	}
	exports.checkUnknownRules = checkUnknownRules;
	function schemaHasRules(schema, rules) {
	    if (typeof schema == "boolean")
	        return !schema;
	    for (const key in schema)
	        if (rules[key])
	            return true;
	    return false;
	}
	exports.schemaHasRules = schemaHasRules;
	function schemaHasRulesButRef(schema, RULES) {
	    if (typeof schema == "boolean")
	        return !schema;
	    for (const key in schema)
	        if (key !== "$ref" && RULES.all[key])
	            return true;
	    return false;
	}
	exports.schemaHasRulesButRef = schemaHasRulesButRef;
	function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
	    if (!$data) {
	        if (typeof schema == "number" || typeof schema == "boolean")
	            return schema;
	        if (typeof schema == "string")
	            return codegen._ `${schema}`;
	    }
	    return codegen._ `${topSchemaRef}${schemaPath}${codegen.getProperty(keyword)}`;
	}
	exports.schemaRefOrVal = schemaRefOrVal;
	function unescapeFragment(str) {
	    return unescapeJsonPointer(decodeURIComponent(str));
	}
	exports.unescapeFragment = unescapeFragment;
	function escapeFragment(str) {
	    return encodeURIComponent(escapeJsonPointer(str));
	}
	exports.escapeFragment = escapeFragment;
	function escapeJsonPointer(str) {
	    if (typeof str == "number")
	        return `${str}`;
	    return str.replace(/~/g, "~0").replace(/\//g, "~1");
	}
	exports.escapeJsonPointer = escapeJsonPointer;
	function unescapeJsonPointer(str) {
	    return str.replace(/~1/g, "/").replace(/~0/g, "~");
	}
	exports.unescapeJsonPointer = unescapeJsonPointer;
	function eachItem(xs, f) {
	    if (Array.isArray(xs)) {
	        for (const x of xs)
	            f(x);
	    }
	    else {
	        f(xs);
	    }
	}
	exports.eachItem = eachItem;
	function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName, }) {
	    return (gen, from, to, toName) => {
	        const res = to === undefined
	            ? from
	            : to instanceof codegen.Name
	                ? (from instanceof codegen.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to)
	                : from instanceof codegen.Name
	                    ? (mergeToName(gen, to, from), from)
	                    : mergeValues(from, to);
	        return toName === codegen.Name && !(res instanceof codegen.Name) ? resultToName(gen, res) : res;
	    };
	}
	exports.mergeEvaluated = {
	    props: makeMergeEvaluated({
	        mergeNames: (gen, from, to) => gen.if(codegen._ `${to} !== true && ${from} !== undefined`, () => {
	            gen.if(codegen._ `${from} === true`, () => gen.assign(to, true), () => gen.code(codegen._ `Object.assign(${to}, ${from})`));
	        }),
	        mergeToName: (gen, from, to) => gen.if(codegen._ `${to} !== true`, () => {
	            if (from === true) {
	                gen.assign(to, true);
	            }
	            else {
	                gen.assign(to, codegen._ `${to} || {}`);
	                setEvaluated(gen, to, from);
	            }
	        }),
	        mergeValues: (from, to) => (from === true ? true : { ...from, ...to }),
	        resultToName: evaluatedPropsToName,
	    }),
	    items: makeMergeEvaluated({
	        mergeNames: (gen, from, to) => gen.if(codegen._ `${to} !== true && ${from} !== undefined`, () => gen.assign(to, codegen._ `${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
	        mergeToName: (gen, from, to) => gen.if(codegen._ `${to} !== true`, () => gen.assign(to, from === true ? true : codegen._ `${to} > ${from} ? ${to} : ${from}`)),
	        mergeValues: (from, to) => (from === true ? true : Math.max(from, to)),
	        resultToName: (gen, items) => gen.var("items", items),
	    }),
	};
	function evaluatedPropsToName(gen, ps) {
	    if (ps === true)
	        return gen.var("props", true);
	    const props = gen.var("props", codegen._ `{}`);
	    if (ps !== undefined)
	        setEvaluated(gen, props, ps);
	    return props;
	}
	exports.evaluatedPropsToName = evaluatedPropsToName;
	function setEvaluated(gen, props, ps) {
	    Object.keys(ps).forEach((p) => gen.assign(codegen._ `${props}${codegen.getProperty(p)}`, true));
	}
	exports.setEvaluated = setEvaluated;

	});

	var dataType = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;





	var DataType;
	(function (DataType) {
	    DataType[DataType["Correct"] = 0] = "Correct";
	    DataType[DataType["Wrong"] = 1] = "Wrong";
	})(DataType = exports.DataType || (exports.DataType = {}));
	function getSchemaTypes(schema) {
	    const types = getJSONTypes(schema.type);
	    const hasNull = types.includes("null");
	    if (hasNull) {
	        if (schema.nullable === false)
	            throw new Error("type: null contradicts nullable: false");
	    }
	    else {
	        if (!types.length && schema.nullable !== undefined) {
	            throw new Error('"nullable" cannot be used without "type"');
	        }
	        if (schema.nullable === true)
	            types.push("null");
	    }
	    return types;
	}
	exports.getSchemaTypes = getSchemaTypes;
	function getJSONTypes(ts) {
	    const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
	    if (types.every(rules.isJSONType))
	        return types;
	    throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
	}
	exports.getJSONTypes = getJSONTypes;
	function coerceAndCheckDataType(it, types) {
	    const { gen, data, opts } = it;
	    const coerceTo = coerceToTypes(types, opts.coerceTypes);
	    const checkTypes = types.length > 0 &&
	        !(coerceTo.length === 0 && types.length === 1 && applicability.schemaHasRulesForType(it, types[0]));
	    if (checkTypes) {
	        const wrongType = checkDataTypes(types, data, opts.strict, DataType.Wrong);
	        gen.if(wrongType, () => {
	            if (coerceTo.length)
	                coerceData(it, types, coerceTo);
	            else
	                reportTypeError(it);
	        });
	    }
	    return checkTypes;
	}
	exports.coerceAndCheckDataType = coerceAndCheckDataType;
	const COERCIBLE = new Set(["string", "number", "integer", "boolean", "null"]);
	function coerceToTypes(types, coerceTypes) {
	    return coerceTypes
	        ? types.filter((t) => COERCIBLE.has(t) || (coerceTypes === "array" && t === "array"))
	        : [];
	}
	function coerceData(it, types, coerceTo) {
	    const { gen, data, opts } = it;
	    const dataType = gen.let("dataType", codegen._ `typeof ${data}`);
	    const coerced = gen.let("coerced", codegen._ `undefined`);
	    if (opts.coerceTypes === "array") {
	        gen.if(codegen._ `${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen
	            .assign(data, codegen._ `${data}[0]`)
	            .assign(dataType, codegen._ `typeof ${data}`)
	            .if(checkDataTypes(types, data, opts.strict), () => gen.assign(coerced, data)));
	    }
	    gen.if(codegen._ `${coerced} !== undefined`);
	    for (const t of coerceTo) {
	        if (COERCIBLE.has(t) || (t === "array" && opts.coerceTypes === "array")) {
	            coerceSpecificType(t);
	        }
	    }
	    gen.else();
	    reportTypeError(it);
	    gen.endIf();
	    gen.if(codegen._ `${coerced} !== undefined`, () => {
	        gen.assign(data, coerced);
	        assignParentData(it, coerced);
	    });
	    function coerceSpecificType(t) {
	        switch (t) {
	            case "string":
	                gen
	                    .elseIf(codegen._ `${dataType} == "number" || ${dataType} == "boolean"`)
	                    .assign(coerced, codegen._ `"" + ${data}`)
	                    .elseIf(codegen._ `${data} === null`)
	                    .assign(coerced, codegen._ `""`);
	                return;
	            case "number":
	                gen
	                    .elseIf(codegen._ `${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`)
	                    .assign(coerced, codegen._ `+${data}`);
	                return;
	            case "integer":
	                gen
	                    .elseIf(codegen._ `${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`)
	                    .assign(coerced, codegen._ `+${data}`);
	                return;
	            case "boolean":
	                gen
	                    .elseIf(codegen._ `${data} === "false" || ${data} === 0 || ${data} === null`)
	                    .assign(coerced, false)
	                    .elseIf(codegen._ `${data} === "true" || ${data} === 1`)
	                    .assign(coerced, true);
	                return;
	            case "null":
	                gen.elseIf(codegen._ `${data} === "" || ${data} === 0 || ${data} === false`);
	                gen.assign(coerced, null);
	                return;
	            case "array":
	                gen
	                    .elseIf(codegen._ `${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`)
	                    .assign(coerced, codegen._ `[${data}]`);
	        }
	    }
	}
	function assignParentData({ gen, parentData, parentDataProperty }, expr) {
	    // TODO use gen.property
	    gen.if(codegen._ `${parentData} !== undefined`, () => gen.assign(codegen._ `${parentData}[${parentDataProperty}]`, expr));
	}
	function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
	    const EQ = correct === DataType.Correct ? codegen.operators.EQ : codegen.operators.NEQ;
	    let cond;
	    switch (dataType) {
	        case "null":
	            return codegen._ `${data} ${EQ} null`;
	        case "array":
	            cond = codegen._ `Array.isArray(${data})`;
	            break;
	        case "object":
	            cond = codegen._ `${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
	            break;
	        case "integer":
	            cond = numCond(codegen._ `!(${data} % 1) && !isNaN(${data})`);
	            break;
	        case "number":
	            cond = numCond();
	            break;
	        default:
	            return codegen._ `typeof ${data} ${EQ} ${dataType}`;
	    }
	    return correct === DataType.Correct ? cond : codegen.not(cond);
	    function numCond(_cond = codegen.nil) {
	        return codegen.and(codegen._ `typeof ${data} == "number"`, _cond, strictNums ? codegen._ `isFinite(${data})` : codegen.nil);
	    }
	}
	exports.checkDataType = checkDataType;
	function checkDataTypes(dataTypes, data, strictNums, correct) {
	    if (dataTypes.length === 1) {
	        return checkDataType(dataTypes[0], data, strictNums, correct);
	    }
	    let cond;
	    const types = util.toHash(dataTypes);
	    if (types.array && types.object) {
	        const notObj = codegen._ `typeof ${data} != "object"`;
	        cond = types.null ? notObj : codegen._ `!${data} || ${notObj}`;
	        delete types.null;
	        delete types.array;
	        delete types.object;
	    }
	    else {
	        cond = codegen.nil;
	    }
	    if (types.number)
	        delete types.integer;
	    for (const t in types)
	        cond = codegen.and(cond, checkDataType(t, data, strictNums, correct));
	    return cond;
	}
	exports.checkDataTypes = checkDataTypes;
	const typeError = {
	    message: ({ schema }) => codegen.str `should be ${schema}`,
	    params: ({ schema, schemaValue }) => typeof schema == "string" ? codegen._ `{type: ${schema}}` : codegen._ `{type: ${schemaValue}}`,
	};
	function reportTypeError(it) {
	    const cxt = getTypeErrorContext(it);
	    errors.reportError(cxt, typeError);
	}
	exports.reportTypeError = reportTypeError;
	function getTypeErrorContext(it) {
	    const { gen, data, schema } = it;
	    const schemaCode = util.schemaRefOrVal(it, schema, "type");
	    return {
	        gen,
	        keyword: "type",
	        data,
	        schema: schema.type,
	        schemaCode,
	        schemaValue: schemaCode,
	        parentSchema: schema,
	        params: {},
	        it,
	    };
	}

	});

	var subschema = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.applySubschema = exports.Type = void 0;



	var Type;
	(function (Type) {
	    Type[Type["Num"] = 0] = "Num";
	    Type[Type["Str"] = 1] = "Str";
	})(Type = exports.Type || (exports.Type = {}));
	function applySubschema(it, appl, valid) {
	    const subschema = getSubschema(it, appl);
	    extendSubschemaData(subschema, it, appl);
	    extendSubschemaMode(subschema, appl);
	    const nextContext = { ...it, ...subschema, items: undefined, props: undefined };
	    validate.subschemaCode(nextContext, valid);
	    return nextContext;
	}
	exports.applySubschema = applySubschema;
	function getSubschema(it, { keyword, schemaProp, schema, strictSchema, schemaPath, errSchemaPath, topSchemaRef, }) {
	    if (keyword !== undefined && schema !== undefined) {
	        throw new Error('both "keyword" and "schema" passed, only one allowed');
	    }
	    if (keyword !== undefined) {
	        const sch = it.schema[keyword];
	        return schemaProp === undefined
	            ? {
	                schema: sch,
	                schemaPath: codegen._ `${it.schemaPath}${codegen.getProperty(keyword)}`,
	                errSchemaPath: `${it.errSchemaPath}/${keyword}`,
	            }
	            : {
	                schema: sch[schemaProp],
	                schemaPath: codegen._ `${it.schemaPath}${codegen.getProperty(keyword)}${codegen.getProperty(schemaProp)}`,
	                errSchemaPath: `${it.errSchemaPath}/${keyword}/${util.escapeFragment(schemaProp)}`,
	            };
	    }
	    if (schema !== undefined) {
	        if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
	            throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
	        }
	        return {
	            schema,
	            strictSchema,
	            schemaPath,
	            topSchemaRef,
	            errSchemaPath,
	        };
	    }
	    throw new Error('either "keyword" or "schema" must be passed');
	}
	function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
	    if (data !== undefined && dataProp !== undefined) {
	        throw new Error('both "data" and "dataProp" passed, only one allowed');
	    }
	    const { gen } = it;
	    if (dataProp !== undefined) {
	        const { errorPath, dataPathArr, opts } = it;
	        const nextData = gen.let("data", codegen._ `${it.data}${codegen.getProperty(dataProp)}`, true);
	        dataContextProps(nextData);
	        subschema.errorPath = codegen.str `${errorPath}${getErrorPath(dataProp, dpType, opts.jsPropertySyntax)}`;
	        subschema.parentDataProperty = codegen._ `${dataProp}`;
	        subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
	    }
	    if (data !== undefined) {
	        const nextData = data instanceof codegen.Name ? data : gen.let("data", data, true); // replaceable if used once?
	        dataContextProps(nextData);
	        if (propertyName !== undefined)
	            subschema.propertyName = propertyName;
	        // TODO something is possibly wrong here with not changing parentDataProperty and not appending dataPathArr
	    }
	    if (dataTypes)
	        subschema.dataTypes = dataTypes;
	    function dataContextProps(_nextData) {
	        subschema.data = _nextData;
	        subschema.dataLevel = it.dataLevel + 1;
	        subschema.dataTypes = [];
	        subschema.parentData = it.data;
	        subschema.dataNames = [...it.dataNames, _nextData];
	    }
	}
	function extendSubschemaMode(subschema, { compositeRule, createErrors, allErrors, strictSchema }) {
	    if (compositeRule !== undefined)
	        subschema.compositeRule = compositeRule;
	    if (createErrors !== undefined)
	        subschema.createErrors = createErrors;
	    if (allErrors !== undefined)
	        subschema.allErrors = allErrors;
	    subschema.strictSchema = strictSchema; // not inherited
	}
	function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
	    // let path
	    if (dataProp instanceof codegen.Name) {
	        const isNumber = dataPropType === Type.Num;
	        return jsPropertySyntax
	            ? isNumber
	                ? codegen._ `"[" + ${dataProp} + "]"`
	                : codegen._ `"['" + ${dataProp} + "']"`
	            : isNumber
	                ? codegen._ `"/" + ${dataProp}`
	                : codegen._ `"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`; // TODO maybe use global escapePointer
	    }
	    return jsPropertySyntax ? codegen.getProperty(dataProp).toString() : "/" + util.escapeJsonPointer(dataProp);
	}

	});

	var context = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getData = void 0;






	class KeywordCxt {
	    constructor(it, def, keyword) {
	        validateKeywordUsage(it, def, keyword);
	        this.gen = it.gen;
	        this.allErrors = it.allErrors;
	        this.keyword = keyword;
	        this.data = it.data;
	        this.schema = it.schema[keyword];
	        this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
	        this.schemaValue = util.schemaRefOrVal(it, this.schema, keyword, this.$data);
	        this.schemaType = def.schemaType;
	        this.parentSchema = it.schema;
	        this.params = {};
	        this.it = it;
	        this.def = def;
	        if (this.$data) {
	            this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
	        }
	        else {
	            this.schemaCode = this.schemaValue;
	            if (!validSchemaType(this.schema, def.schemaType, def.allowUndefined)) {
	                throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
	            }
	        }
	        if ("code" in def ? def.trackErrors : def.errors !== false) {
	            this.errsCount = it.gen.const("_errs", names_1.default.errors);
	        }
	    }
	    result(condition, successAction, failAction) {
	        this.gen.if(codegen.not(condition));
	        if (failAction)
	            failAction();
	        else
	            this.error();
	        if (successAction) {
	            this.gen.else();
	            successAction();
	            if (this.allErrors)
	                this.gen.endIf();
	        }
	        else {
	            if (this.allErrors)
	                this.gen.endIf();
	            else
	                this.gen.else();
	        }
	    }
	    pass(condition, failAction) {
	        this.result(condition, undefined, failAction);
	    }
	    fail(condition) {
	        if (condition === undefined) {
	            this.error();
	            if (!this.allErrors)
	                this.gen.if(false); // this branch will be removed by gen.optimize
	            return;
	        }
	        this.gen.if(condition);
	        this.error();
	        if (this.allErrors)
	            this.gen.endIf();
	        else
	            this.gen.else();
	    }
	    fail$data(condition) {
	        if (!this.$data)
	            return this.fail(condition);
	        const { schemaCode } = this;
	        this.fail(codegen._ `${schemaCode} !== undefined && (${codegen.or(this.invalid$data(), condition)})`);
	    }
	    error(append) {
	        (append ? errors.reportExtraError : errors.reportError)(this, this.def.error || errors.keywordError);
	    }
	    $dataError() {
	        errors.reportError(this, this.def.$dataError || errors.keyword$DataError);
	    }
	    reset() {
	        if (this.errsCount === undefined)
	            throw new Error('add "trackErrors" to keyword definition');
	        errors.resetErrorsCount(this.gen, this.errsCount);
	    }
	    ok(cond) {
	        if (!this.allErrors)
	            this.gen.if(cond);
	    }
	    setParams(obj, assign) {
	        if (assign)
	            Object.assign(this.params, obj);
	        else
	            this.params = obj;
	    }
	    block$data(valid, codeBlock, $dataValid = codegen.nil) {
	        this.gen.block(() => {
	            this.check$data(valid, $dataValid);
	            codeBlock();
	        });
	    }
	    check$data(valid = codegen.nil, $dataValid = codegen.nil) {
	        if (!this.$data)
	            return;
	        const { gen, schemaCode, schemaType, def } = this;
	        gen.if(codegen.or(codegen._ `${schemaCode} === undefined`, $dataValid));
	        if (valid !== codegen.nil)
	            gen.assign(valid, true);
	        if (schemaType.length || def.validateSchema) {
	            gen.elseIf(this.invalid$data());
	            this.$dataError();
	            if (valid !== codegen.nil)
	                gen.assign(valid, false);
	        }
	        gen.else();
	    }
	    invalid$data() {
	        const { gen, schemaCode, schemaType, def, it } = this;
	        return codegen.or(wrong$DataType(), invalid$DataSchema());
	        function wrong$DataType() {
	            if (schemaType.length) {
	                /* istanbul ignore if */
	                if (!(schemaCode instanceof codegen.Name))
	                    throw new Error("ajv implementation error");
	                const st = Array.isArray(schemaType) ? schemaType : [schemaType];
	                return codegen._ `${dataType.checkDataTypes(st, schemaCode, it.opts.strict, dataType.DataType.Wrong)}`;
	            }
	            return codegen.nil;
	        }
	        function invalid$DataSchema() {
	            if (def.validateSchema) {
	                const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema }); // TODO value.code for standalone
	                return codegen._ `!${validateSchemaRef}(${schemaCode})`;
	            }
	            return codegen.nil;
	        }
	    }
	    subschema(appl, valid) {
	        return subschema.applySubschema(this.it, appl, valid);
	    }
	    mergeEvaluated(schemaCxt, toName) {
	        const { it, gen } = this;
	        if (!it.opts.unevaluated)
	            return;
	        if (it.props !== true && schemaCxt.props !== undefined) {
	            it.props = util.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
	        }
	        if (it.items !== true && schemaCxt.items !== undefined) {
	            it.items = util.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
	        }
	    }
	    mergeValidEvaluated(schemaCxt, valid) {
	        const { it, gen } = this;
	        if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
	            gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen.Name));
	            return true;
	        }
	    }
	}
	exports.default = KeywordCxt;
	function validSchemaType(schema, schemaType, allowUndefined = false) {
	    // TODO add tests
	    return (!schemaType.length ||
	        schemaType.some((st) => st === "array"
	            ? Array.isArray(schema)
	            : st === "object"
	                ? schema && typeof schema == "object" && !Array.isArray(schema)
	                : typeof schema == st || (allowUndefined && typeof schema == "undefined")));
	}
	function validateKeywordUsage({ schema, opts, self }, def, keyword) {
	    /* istanbul ignore if */
	    if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
	        throw new Error("ajv implementation error");
	    }
	    const deps = def.dependencies;
	    if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
	        throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
	    }
	    if (def.validateSchema) {
	        const valid = def.validateSchema(schema[keyword]);
	        if (!valid) {
	            const msg = "keyword value is invalid: " + self.errorsText(def.validateSchema.errors);
	            if (opts.validateSchema === "log")
	                self.logger.error(msg);
	            else
	                throw new Error(msg);
	        }
	    }
	}
	const JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
	const RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
	function getData($data, { dataLevel, dataNames, dataPathArr }) {
	    let jsonPointer;
	    let data;
	    if ($data === "")
	        return names_1.default.rootData;
	    if ($data[0] === "/") {
	        if (!JSON_POINTER.test($data))
	            throw new Error(`Invalid JSON-pointer: ${$data}`);
	        jsonPointer = $data;
	        data = names_1.default.rootData;
	    }
	    else {
	        const matches = RELATIVE_JSON_POINTER.exec($data);
	        if (!matches)
	            throw new Error(`Invalid JSON-pointer: ${$data}`);
	        const up = +matches[1];
	        jsonPointer = matches[2];
	        if (jsonPointer === "#") {
	            if (up >= dataLevel)
	                throw new Error(errorMsg("property/index", up));
	            return dataPathArr[dataLevel - up];
	        }
	        if (up > dataLevel)
	            throw new Error(errorMsg("data", up));
	        data = dataNames[dataLevel - up];
	        if (!jsonPointer)
	            return data;
	    }
	    let expr = data;
	    const segments = jsonPointer.split("/");
	    for (const segment of segments) {
	        if (segment) {
	            data = codegen._ `${data}${codegen.getProperty(util.unescapeJsonPointer(segment))}`;
	            expr = codegen._ `${expr} && ${data}`;
	        }
	    }
	    return expr;
	    function errorMsg(pointerType, up) {
	        return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
	    }
	}
	exports.getData = getData;

	});

	var error_classes = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MissingRefError = exports.ValidationError = void 0;

	class ValidationError extends Error {
	    constructor(errors) {
	        super("validation failed");
	        this.errors = errors;
	        this.ajv = this.validation = true;
	    }
	}
	exports.ValidationError = ValidationError;
	class MissingRefError extends Error {
	    constructor(baseId, ref) {
	        super(`can't resolve reference ${ref} from id ${baseId}`);
	        this.missingRef = resolve.resolveUrl(baseId, ref);
	        this.missingSchema = resolve.normalizeId(resolve.getFullPath(this.missingRef));
	    }
	}
	exports.MissingRefError = MissingRefError;
	module.exports = {
	    ValidationError,
	    MissingRefError,
	};

	});

	var compile = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.resolveSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;







	class SchemaEnv {
	    constructor(env) {
	        var _a;
	        this.refs = {};
	        this.dynamicAnchors = {};
	        let schema;
	        if (typeof env.schema == "object")
	            schema = env.schema;
	        this.schema = env.schema;
	        this.root = env.root || this;
	        this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : resolve.normalizeId(schema === null || schema === void 0 ? void 0 : schema.$id);
	        this.localRefs = env.localRefs;
	        this.meta = env.meta;
	        this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
	        this.refs = {};
	    }
	}
	exports.SchemaEnv = SchemaEnv;
	// let codeSize = 0
	// let nodeCount = 0
	// Compiles schema in SchemaEnv
	function compileSchema(sch) {
	    // TODO refactor - remove compilations
	    const _sch = getCompilingSchema.call(this, sch);
	    if (_sch)
	        return _sch;
	    const rootId = resolve.getFullPath(sch.root.baseId); // TODO if getFullPath removed 1 tests fails
	    const { es5, lines } = this.opts.code;
	    const { ownProperties } = this.opts;
	    const gen = new codegen.CodeGen(this.scope, { es5, lines, ownProperties });
	    let _ValidationError;
	    if (sch.$async) {
	        _ValidationError = gen.scopeValue("Error", {
	            ref: error_classes.ValidationError,
	            code: codegen._ `require("ajv/dist/compile/error_classes").ValidationError`,
	        });
	    }
	    const validateName = gen.scopeName("validate");
	    sch.validateName = validateName;
	    const schemaCxt = {
	        gen,
	        allErrors: this.opts.allErrors,
	        data: names_1.default.data,
	        parentData: names_1.default.parentData,
	        parentDataProperty: names_1.default.parentDataProperty,
	        dataNames: [names_1.default.data],
	        dataPathArr: [codegen.nil],
	        dataLevel: 0,
	        dataTypes: [],
	        topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true
	            ? { ref: sch.schema, code: codegen.stringify(sch.schema) }
	            : { ref: sch.schema }),
	        validateName,
	        ValidationError: _ValidationError,
	        schema: sch.schema,
	        schemaEnv: sch,
	        strictSchema: true,
	        rootId,
	        baseId: sch.baseId || rootId,
	        schemaPath: codegen.nil,
	        errSchemaPath: "#",
	        errorPath: codegen._ `""`,
	        opts: this.opts,
	        self: this,
	    };
	    let sourceCode;
	    try {
	        this._compilations.add(sch);
	        validate.validateFunctionCode(schemaCxt);
	        gen.optimize(this.opts.code.optimize);
	        // gen.optimize(1)
	        const validateCode = gen.toString();
	        sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
	        // console.log((codeSize += sourceCode.length), (nodeCount += gen.nodeCount))
	        if (this.opts.code.process)
	            sourceCode = this.opts.code.process(sourceCode, sch);
	        // console.log("\n\n\n *** \n", sourceCode)
	        const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
	        const validate$1 = makeValidate(this, this.scope.get());
	        this.scope.value(validateName, { ref: validate$1 });
	        validate$1.errors = null;
	        validate$1.schema = sch.schema;
	        validate$1.schemaEnv = sch;
	        if (sch.$async)
	            validate$1.$async = true;
	        if (this.opts.code.source === true) {
	            validate$1.source = { validateName, validateCode, scopeValues: gen._values };
	        }
	        if (this.opts.unevaluated) {
	            const { props, items } = schemaCxt;
	            validate$1.evaluated = {
	                props: props instanceof codegen.Name ? undefined : props,
	                items: items instanceof codegen.Name ? undefined : items,
	                dynamicProps: props instanceof codegen.Name,
	                dynamicItems: items instanceof codegen.Name,
	            };
	            if (validate$1.source)
	                validate$1.source.evaluated = codegen.stringify(validate$1.evaluated);
	        }
	        sch.validate = validate$1;
	        return sch;
	    }
	    catch (e) {
	        delete sch.validate;
	        delete sch.validateName;
	        if (sourceCode)
	            this.logger.error("Error compiling schema, function code:", sourceCode);
	        // console.log("\n\n\n *** \n", sourceCode, this.opts)
	        throw e;
	    }
	    finally {
	        this._compilations.delete(sch);
	    }
	}
	exports.compileSchema = compileSchema;
	function resolveRef(root, baseId, ref) {
	    var _a;
	    ref = resolve.resolveUrl(baseId, ref);
	    const schOrFunc = root.refs[ref];
	    if (schOrFunc)
	        return schOrFunc;
	    let _sch = resolve$1.call(this, root, ref);
	    if (_sch === undefined) {
	        const schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref]; // TODO maybe localRefs should hold SchemaEnv
	        if (schema)
	            _sch = new SchemaEnv({ schema, root, baseId });
	    }
	    if (_sch === undefined)
	        return;
	    return (root.refs[ref] = inlineOrCompile.call(this, _sch));
	}
	exports.resolveRef = resolveRef;
	function inlineOrCompile(sch) {
	    if (resolve.inlineRef(sch.schema, this.opts.inlineRefs))
	        return sch.schema;
	    return sch.validate ? sch : compileSchema.call(this, sch);
	}
	// Index of schema compilation in the currently compiled list
	function getCompilingSchema(schEnv) {
	    for (const sch of this._compilations) {
	        if (sameSchemaEnv(sch, schEnv))
	            return sch;
	    }
	}
	function sameSchemaEnv(s1, s2) {
	    return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
	}
	// resolve and compile the references ($ref)
	// TODO returns AnySchemaObject (if the schema can be inlined) or validation function
	function resolve$1(root, // information about the root schema for the current schema
	ref // reference to resolve
	) {
	    let sch;
	    while (typeof (sch = this.refs[ref]) == "string")
	        ref = sch;
	    return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
	}
	// Resolve schema, its root and baseId
	function resolveSchema(root, // root object with properties schema, refs TODO below SchemaEnv is assigned to it
	ref // reference to resolve
	) {
	    const p = uri_all.parse(ref);
	    const refPath = resolve._getFullPath(p);
	    const baseId = resolve.getFullPath(root.baseId);
	    // TODO `Object.keys(root.schema).length > 0` should not be needed - but removing breaks 2 tests
	    if (Object.keys(root.schema).length > 0 && refPath === baseId) {
	        return getJsonPointer.call(this, p, root);
	    }
	    const id = resolve.normalizeId(refPath);
	    const schOrRef = this.refs[id] || this.schemas[id];
	    if (typeof schOrRef == "string") {
	        const sch = resolveSchema.call(this, root, schOrRef);
	        if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object")
	            return;
	        return getJsonPointer.call(this, p, sch);
	    }
	    if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object")
	        return;
	    if (!schOrRef.validate)
	        compileSchema.call(this, schOrRef);
	    if (id === resolve.normalizeId(ref))
	        return new SchemaEnv({ schema: schOrRef.schema, root, baseId });
	    return getJsonPointer.call(this, p, schOrRef);
	}
	exports.resolveSchema = resolveSchema;
	const PREVENT_SCOPE_CHANGE = new Set([
	    "properties",
	    "patternProperties",
	    "enum",
	    "dependencies",
	    "definitions",
	]);
	function getJsonPointer(parsedRef, { baseId, schema, root }) {
	    var _a;
	    if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/")
	        return;
	    for (const part of parsedRef.fragment.slice(1).split("/")) {
	        if (typeof schema == "boolean")
	            return;
	        schema = schema[util.unescapeFragment(part)];
	        if (schema === undefined)
	            return;
	        // TODO PREVENT_SCOPE_CHANGE could be defined in keyword def?
	        if (!PREVENT_SCOPE_CHANGE.has(part) && typeof schema == "object" && schema.$id) {
	            baseId = resolve.resolveUrl(baseId, schema.$id);
	        }
	    }
	    let env;
	    if (typeof schema != "boolean" && schema.$ref && !util.schemaHasRulesButRef(schema, this.RULES)) {
	        const $ref = resolve.resolveUrl(baseId, schema.$ref);
	        env = resolveSchema.call(this, root, $ref);
	    }
	    // even though resolution failed we need to return SchemaEnv to throw exception
	    // so that compileAsync loads missing schema.
	    env = env || new SchemaEnv({ schema, root, baseId });
	    if (env.schema !== env.root.schema)
	        return env;
	    return undefined;
	}

	});

	var $id = "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#";
	var description = "Meta-schema for $data reference (JSON AnySchema extension proposal)";
	var type = "object";
	var required = [
		"$data"
	];
	var properties = {
		$data: {
			type: "string",
			anyOf: [
				{
					format: "relative-json-pointer"
				},
				{
					format: "json-pointer"
				}
			]
		}
	};
	var additionalProperties = false;
	var $dataRefSchema = {
		$id: $id,
		description: description,
		type: type,
		required: required,
		properties: properties,
		additionalProperties: additionalProperties
	};

	var core = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;

	exports.KeywordCxt = context.default;

	Object.defineProperty(exports, "_", { enumerable: true, get: function () { return codegen._; } });
	Object.defineProperty(exports, "str", { enumerable: true, get: function () { return codegen.str; } });
	Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return codegen.stringify; } });
	Object.defineProperty(exports, "nil", { enumerable: true, get: function () { return codegen.nil; } });
	Object.defineProperty(exports, "Name", { enumerable: true, get: function () { return codegen.Name; } });
	Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function () { return codegen.CodeGen; } });



	const codegen_2 = codegen;




	const META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
	const EXT_SCOPE_NAMES = new Set([
	    "validate",
	    "wrapper",
	    "root",
	    "schema",
	    "keyword",
	    "pattern",
	    "formats",
	    "validate$data",
	    "func",
	    "obj",
	    "Error",
	]);
	const removedOptions = {
	    errorDataPath: "",
	    format: "`validateFormats: false` can be used instead.",
	    nullable: '"nullable" keyword is supported by default.',
	    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
	    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
	    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
	    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
	    sourceCode: "Use option `code: {source: true}`",
	    schemaId: "JSON Schema draft-04 is not supported in Ajv v7.",
	    strictDefaults: "It is default now, see option `strict`.",
	    strictKeywords: "It is default now, see option `strict`.",
	    strictNumbers: "It is default now, see option `strict`.",
	    uniqueItems: '"uniqueItems" keyword is always validated.',
	    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
	    cache: "Map is used as cache, schema object as key.",
	    serialize: "Map is used as cache, schema object as key.",
	};
	const deprecatedOptions = {
	    ignoreKeywordsWithRef: "",
	    jsPropertySyntax: "",
	    unicode: '"minLength"/"maxLength" account for unicode characters by default.',
	};
	function requiredOptions(o) {
	    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
	    const strict = (_a = o.strict) !== null && _a !== void 0 ? _a : true;
	    const strictLog = strict ? "log" : false;
	    const _optz = (_b = o.code) === null || _b === void 0 ? void 0 : _b.optimize;
	    const optimize = _optz === true || _optz === undefined ? 1 : _optz || 0;
	    return {
	        strict,
	        strictTypes: (_c = o.strictTypes) !== null && _c !== void 0 ? _c : strictLog,
	        strictTuples: (_d = o.strictTuples) !== null && _d !== void 0 ? _d : strictLog,
	        code: o.code ? { ...o.code, optimize } : { optimize },
	        loopRequired: (_e = o.loopRequired) !== null && _e !== void 0 ? _e : Infinity,
	        loopEnum: (_f = o.loopEnum) !== null && _f !== void 0 ? _f : Infinity,
	        meta: (_g = o.meta) !== null && _g !== void 0 ? _g : true,
	        messages: (_h = o.messages) !== null && _h !== void 0 ? _h : true,
	        inlineRefs: (_j = o.inlineRefs) !== null && _j !== void 0 ? _j : true,
	        addUsedSchema: (_k = o.addUsedSchema) !== null && _k !== void 0 ? _k : true,
	        validateSchema: (_l = o.validateSchema) !== null && _l !== void 0 ? _l : true,
	        validateFormats: (_m = o.validateFormats) !== null && _m !== void 0 ? _m : true,
	    };
	}
	class Ajv {
	    constructor(opts = {}) {
	        this.schemas = {};
	        this.refs = {};
	        this.formats = {};
	        this._compilations = new Set();
	        this._loading = {};
	        this._cache = new Map();
	        opts = this.opts = { ...opts, ...requiredOptions(opts) };
	        const { es5, lines } = this.opts.code;
	        this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
	        this.logger = getLogger(opts.logger);
	        const formatOpt = opts.validateFormats;
	        opts.validateFormats = false;
	        this.RULES = rules.getRules();
	        checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
	        checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
	        this._metaOpts = getMetaSchemaOptions.call(this);
	        if (opts.formats)
	            addInitialFormats.call(this);
	        this._addVocabularies();
	        this._addDefaultMetaSchema();
	        if (opts.keywords)
	            addInitialKeywords.call(this, opts.keywords);
	        if (typeof opts.meta == "object")
	            this.addMetaSchema(opts.meta);
	        addInitialSchemas.call(this);
	        opts.validateFormats = formatOpt;
	    }
	    _addVocabularies() {
	        this.addKeyword("$async");
	    }
	    _addDefaultMetaSchema() {
	        const { $data, meta } = this.opts;
	        if (meta && $data)
	            this.addMetaSchema($dataRefSchema, $dataRefSchema.$id, false);
	    }
	    defaultMeta() {
	        const { meta } = this.opts;
	        return (this.opts.defaultMeta = typeof meta == "object" ? meta.$id || meta : undefined);
	    }
	    validate(schemaKeyRef, // key, ref or schema object
	    data // to be validated
	    ) {
	        let v;
	        if (typeof schemaKeyRef == "string") {
	            v = this.getSchema(schemaKeyRef);
	            if (!v)
	                throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
	        }
	        else {
	            v = this.compile(schemaKeyRef);
	        }
	        const valid = v(data);
	        if (!("$async" in v))
	            this.errors = v.errors;
	        return valid;
	    }
	    compile(schema, _meta) {
	        const sch = this._addSchema(schema, _meta);
	        return (sch.validate || this._compileSchemaEnv(sch));
	    }
	    compileAsync(schema, meta) {
	        if (typeof this.opts.loadSchema != "function") {
	            throw new Error("options.loadSchema should be a function");
	        }
	        const { loadSchema } = this.opts;
	        return runCompileAsync.call(this, schema, meta);
	        async function runCompileAsync(_schema, _meta) {
	            await loadMetaSchema.call(this, _schema.$schema);
	            const sch = this._addSchema(_schema, _meta);
	            return sch.validate || _compileAsync.call(this, sch);
	        }
	        async function loadMetaSchema($ref) {
	            if ($ref && !this.getSchema($ref)) {
	                await runCompileAsync.call(this, { $ref }, true);
	            }
	        }
	        async function _compileAsync(sch) {
	            try {
	                return this._compileSchemaEnv(sch);
	            }
	            catch (e) {
	                if (!(e instanceof error_classes.MissingRefError))
	                    throw e;
	                checkLoaded.call(this, e);
	                await loadMissingSchema.call(this, e.missingSchema);
	                return _compileAsync.call(this, sch);
	            }
	        }
	        function checkLoaded({ missingSchema: ref, missingRef }) {
	            if (this.refs[ref]) {
	                throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
	            }
	        }
	        async function loadMissingSchema(ref) {
	            const _schema = await _loadSchema.call(this, ref);
	            if (!this.refs[ref])
	                await loadMetaSchema.call(this, _schema.$schema);
	            if (!this.refs[ref])
	                this.addSchema(_schema, ref, meta);
	        }
	        async function _loadSchema(ref) {
	            const p = this._loading[ref];
	            if (p)
	                return p;
	            try {
	                return await (this._loading[ref] = loadSchema(ref));
	            }
	            finally {
	                delete this._loading[ref];
	            }
	        }
	    }
	    // Adds schema to the instance
	    addSchema(schema, // If array is passed, `key` will be ignored
	    key, // Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
	    _meta, // true if schema is a meta-schema. Used internally, addMetaSchema should be used instead.
	    _validateSchema = this.opts.validateSchema // false to skip schema validation. Used internally, option validateSchema should be used instead.
	    ) {
	        if (Array.isArray(schema)) {
	            for (const sch of schema)
	                this.addSchema(sch, undefined, _meta, _validateSchema);
	            return this;
	        }
	        let id;
	        if (typeof schema === "object") {
	            id = schema.$id;
	            if (id !== undefined && typeof id != "string")
	                throw new Error("schema id must be string");
	        }
	        key = resolve.normalizeId(key || id);
	        this._checkUnique(key);
	        this.schemas[key] = this._addSchema(schema, _meta, _validateSchema, true);
	        return this;
	    }
	    // Add schema that will be used to validate other schemas
	    // options in META_IGNORE_OPTIONS are alway set to false
	    addMetaSchema(schema, key, // schema key
	    _validateSchema = this.opts.validateSchema // false to skip schema validation, can be used to override validateSchema option for meta-schema
	    ) {
	        this.addSchema(schema, key, true, _validateSchema);
	        return this;
	    }
	    //  Validate schema against its meta-schema
	    validateSchema(schema, throwOrLogError) {
	        if (typeof schema == "boolean")
	            return true;
	        let $schema;
	        $schema = schema.$schema;
	        if ($schema !== undefined && typeof $schema != "string") {
	            throw new Error("$schema must be a string");
	        }
	        $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
	        if (!$schema) {
	            this.logger.warn("meta-schema not available");
	            this.errors = null;
	            return true;
	        }
	        const valid = this.validate($schema, schema);
	        if (!valid && throwOrLogError) {
	            const message = "schema is invalid: " + this.errorsText();
	            if (this.opts.validateSchema === "log")
	                this.logger.error(message);
	            else
	                throw new Error(message);
	        }
	        return valid;
	    }
	    // Get compiled schema by `key` or `ref`.
	    // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
	    getSchema(keyRef) {
	        let sch;
	        while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
	            keyRef = sch;
	        if (sch === undefined) {
	            const root = new compile.SchemaEnv({ schema: {} });
	            sch = compile.resolveSchema.call(this, root, keyRef);
	            if (!sch)
	                return;
	            this.refs[keyRef] = sch;
	        }
	        return (sch.validate || this._compileSchemaEnv(sch));
	    }
	    // Remove cached schema(s).
	    // If no parameter is passed all schemas but meta-schemas are removed.
	    // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
	    // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
	    removeSchema(schemaKeyRef) {
	        if (schemaKeyRef instanceof RegExp) {
	            this._removeAllSchemas(this.schemas, schemaKeyRef);
	            this._removeAllSchemas(this.refs, schemaKeyRef);
	            return this;
	        }
	        switch (typeof schemaKeyRef) {
	            case "undefined":
	                this._removeAllSchemas(this.schemas);
	                this._removeAllSchemas(this.refs);
	                this._cache.clear();
	                return this;
	            case "string": {
	                const sch = getSchEnv.call(this, schemaKeyRef);
	                if (typeof sch == "object")
	                    this._cache.delete(sch.schema);
	                delete this.schemas[schemaKeyRef];
	                delete this.refs[schemaKeyRef];
	                return this;
	            }
	            case "object": {
	                const cacheKey = schemaKeyRef;
	                this._cache.delete(cacheKey);
	                let id = schemaKeyRef.$id;
	                if (id) {
	                    id = resolve.normalizeId(id);
	                    delete this.schemas[id];
	                    delete this.refs[id];
	                }
	                return this;
	            }
	            default:
	                throw new Error("ajv.removeSchema: invalid parameter");
	        }
	    }
	    // add "vocabulary" - a collection of keywords
	    addVocabulary(definitions) {
	        for (const def of definitions)
	            this.addKeyword(def);
	        return this;
	    }
	    addKeyword(kwdOrDef, def // deprecated
	    ) {
	        let keyword;
	        if (typeof kwdOrDef == "string") {
	            keyword = kwdOrDef;
	            if (typeof def == "object") {
	                this.logger.warn("these parameters are deprecated, see docs for addKeyword");
	                def.keyword = keyword;
	            }
	        }
	        else if (typeof kwdOrDef == "object" && def === undefined) {
	            def = kwdOrDef;
	            keyword = def.keyword;
	            if (Array.isArray(keyword) && !keyword.length) {
	                throw new Error("addKeywords: keyword must be string or non-empty array");
	            }
	        }
	        else {
	            throw new Error("invalid addKeywords parameters");
	        }
	        checkKeyword.call(this, keyword, def);
	        if (!def) {
	            util.eachItem(keyword, (kwd) => addRule.call(this, kwd));
	            return this;
	        }
	        keywordMetaschema.call(this, def);
	        const definition = {
	            ...def,
	            type: dataType.getJSONTypes(def.type),
	            schemaType: dataType.getJSONTypes(def.schemaType),
	        };
	        util.eachItem(keyword, definition.type.length === 0
	            ? (k) => addRule.call(this, k, definition)
	            : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
	        return this;
	    }
	    getKeyword(keyword) {
	        const rule = this.RULES.all[keyword];
	        return typeof rule == "object" ? rule.definition : !!rule;
	    }
	    // Remove keyword
	    removeKeyword(keyword) {
	        // TODO return type should be Ajv
	        const { RULES } = this;
	        delete RULES.keywords[keyword];
	        delete RULES.all[keyword];
	        for (const group of RULES.rules) {
	            const i = group.rules.findIndex((rule) => rule.keyword === keyword);
	            if (i >= 0)
	                group.rules.splice(i, 1);
	        }
	        return this;
	    }
	    // Add format
	    addFormat(name, format) {
	        if (typeof format == "string")
	            format = new RegExp(format);
	        this.formats[name] = format;
	        return this;
	    }
	    errorsText(errors = this.errors, // optional array of validation errors
	    { separator = ", ", dataVar = "data" } = {} // optional options with properties `separator` and `dataVar`
	    ) {
	        if (!errors || errors.length === 0)
	            return "No errors";
	        return errors
	            .map((e) => `${dataVar}${e.dataPath} ${e.message}`)
	            .reduce((text, msg) => text + separator + msg);
	    }
	    $dataMetaSchema(metaSchema, keywordsJsonPointers) {
	        const rules = this.RULES.all;
	        metaSchema = JSON.parse(JSON.stringify(metaSchema));
	        for (const jsonPointer of keywordsJsonPointers) {
	            const segments = jsonPointer.split("/").slice(1); // first segment is an empty string
	            let keywords = metaSchema;
	            for (const seg of segments)
	                keywords = keywords[seg];
	            for (const key in rules) {
	                const rule = rules[key];
	                if (typeof rule != "object")
	                    continue;
	                const { $data } = rule.definition;
	                const schema = keywords[key];
	                if ($data && schema)
	                    keywords[key] = schemaOrData(schema);
	            }
	        }
	        return metaSchema;
	    }
	    _removeAllSchemas(schemas, regex) {
	        for (const keyRef in schemas) {
	            const sch = schemas[keyRef];
	            if (!regex || regex.test(keyRef)) {
	                if (typeof sch == "string") {
	                    delete schemas[keyRef];
	                }
	                else if (sch && !sch.meta) {
	                    this._cache.delete(sch.schema);
	                    delete schemas[keyRef];
	                }
	            }
	        }
	    }
	    _addSchema(schema, meta, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
	        if (typeof schema != "object" && typeof schema != "boolean") {
	            throw new Error("schema must be object or boolean");
	        }
	        let sch = this._cache.get(schema);
	        if (sch !== undefined)
	            return sch;
	        const localRefs = resolve.getSchemaRefs.call(this, schema);
	        sch = new compile.SchemaEnv({ schema, meta, localRefs });
	        this._cache.set(sch.schema, sch);
	        const id = sch.baseId;
	        if (addSchema && !id.startsWith("#")) {
	            // TODO atm it is allowed to overwrite schemas without id (instead of not adding them)
	            if (id)
	                this._checkUnique(id);
	            this.refs[id] = sch;
	        }
	        if (validateSchema)
	            this.validateSchema(schema, true);
	        return sch;
	    }
	    _checkUnique(id) {
	        if (this.schemas[id] || this.refs[id]) {
	            throw new Error(`schema with key or id "${id}" already exists`);
	        }
	    }
	    _compileSchemaEnv(sch) {
	        if (sch.meta)
	            this._compileMetaSchema(sch);
	        else
	            compile.compileSchema.call(this, sch);
	        /* istanbul ignore if */
	        if (!sch.validate)
	            throw new Error("ajv implementation error");
	        return sch.validate;
	    }
	    _compileMetaSchema(sch) {
	        const currentOpts = this.opts;
	        this.opts = this._metaOpts;
	        try {
	            compile.compileSchema.call(this, sch);
	        }
	        finally {
	            this.opts = currentOpts;
	        }
	    }
	}
	exports.default = Ajv;
	Ajv.ValidationError = error_classes.ValidationError;
	Ajv.MissingRefError = error_classes.MissingRefError;
	function checkOptions(checkOpts, options, msg, log = "error") {
	    for (const key in checkOpts) {
	        const opt = key;
	        if (opt in options)
	            this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
	    }
	}
	function getSchEnv(keyRef) {
	    keyRef = resolve.normalizeId(keyRef); // TODO tests fail without this line
	    return this.schemas[keyRef] || this.refs[keyRef];
	}
	function addInitialSchemas() {
	    const optsSchemas = this.opts.schemas;
	    if (!optsSchemas)
	        return;
	    if (Array.isArray(optsSchemas))
	        this.addSchema(optsSchemas);
	    else
	        for (const key in optsSchemas)
	            this.addSchema(optsSchemas[key], key);
	}
	function addInitialFormats() {
	    for (const name in this.opts.formats) {
	        const format = this.opts.formats[name];
	        if (format)
	            this.addFormat(name, format);
	    }
	}
	function addInitialKeywords(defs) {
	    if (Array.isArray(defs)) {
	        this.addVocabulary(defs);
	        return;
	    }
	    this.logger.warn("keywords option as map is deprecated, pass array");
	    for (const keyword in defs) {
	        const def = defs[keyword];
	        if (!def.keyword)
	            def.keyword = keyword;
	        this.addKeyword(def);
	    }
	}
	function getMetaSchemaOptions() {
	    const metaOpts = { ...this.opts };
	    for (const opt of META_IGNORE_OPTIONS)
	        delete metaOpts[opt];
	    return metaOpts;
	}
	const noLogs = { log() { }, warn() { }, error() { } };
	function getLogger(logger) {
	    if (logger === false)
	        return noLogs;
	    if (logger === undefined)
	        return console;
	    if (logger.log && logger.warn && logger.error)
	        return logger;
	    throw new Error("logger must implement log, warn and error methods");
	}
	const KEYWORD_NAME = /^[a-z_$][a-z0-9_$-]*$/i;
	function checkKeyword(keyword, def) {
	    const { RULES } = this;
	    util.eachItem(keyword, (kwd) => {
	        if (RULES.keywords[kwd])
	            throw new Error(`Keyword ${kwd} is already defined`);
	        if (!KEYWORD_NAME.test(kwd))
	            throw new Error(`Keyword ${kwd} has invalid name`);
	    });
	    if (!def)
	        return;
	    if (def.$data && !("code" in def || "validate" in def)) {
	        throw new Error('$data keyword must have "code" or "validate" function');
	    }
	}
	function addRule(keyword, definition, dataType$1) {
	    var _a;
	    const post = definition === null || definition === void 0 ? void 0 : definition.post;
	    if (dataType$1 && post)
	        throw new Error('keyword with "post" flag cannot have "type"');
	    const { RULES } = this;
	    let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType$1);
	    if (!ruleGroup) {
	        ruleGroup = { type: dataType$1, rules: [] };
	        RULES.rules.push(ruleGroup);
	    }
	    RULES.keywords[keyword] = true;
	    if (!definition)
	        return;
	    const rule = {
	        keyword,
	        definition: {
	            ...definition,
	            type: dataType.getJSONTypes(definition.type),
	            schemaType: dataType.getJSONTypes(definition.schemaType),
	        },
	    };
	    if (definition.before)
	        addBeforeRule.call(this, ruleGroup, rule, definition.before);
	    else
	        ruleGroup.rules.push(rule);
	    RULES.all[keyword] = rule;
	    (_a = definition.implements) === null || _a === void 0 ? void 0 : _a.forEach((kwd) => this.addKeyword(kwd));
	}
	function addBeforeRule(ruleGroup, rule, before) {
	    const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
	    if (i >= 0) {
	        ruleGroup.rules.splice(i, 0, rule);
	    }
	    else {
	        ruleGroup.rules.push(rule);
	        this.logger.warn(`rule ${before} is not defined`);
	    }
	}
	function keywordMetaschema(def) {
	    let { metaSchema } = def;
	    if (metaSchema === undefined)
	        return;
	    if (def.$data && this.opts.$data)
	        metaSchema = schemaOrData(metaSchema);
	    def.validateSchema = this.compile(metaSchema, true);
	}
	const $dataRef = {
	    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
	};
	function schemaOrData(schema) {
	    return { anyOf: [schema, $dataRef] };
	}

	});

	const def = {
	    keyword: "id",
	    code() {
	        throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
	    },
	};
	var _default$1 = def;


	var id = /*#__PURE__*/Object.defineProperty({
		default: _default$1
	}, '__esModule', {value: true});

	var ref = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.callRef = exports.getValidate = void 0;






	const def = {
	    keyword: "$ref",
	    schemaType: "string",
	    code(cxt) {
	        const { gen, schema, it } = cxt;
	        const { baseId, schemaEnv: env, validateName, opts, self } = it;
	        // TODO See comment in dynamicRef.ts
	        // This has to be improved to resolve #815.
	        if (schema === "#" || schema === "#/")
	            return callRootRef();
	        const schOrEnv = compile.resolveRef.call(self, env.root, baseId, schema);
	        if (schOrEnv === undefined)
	            throw new error_classes.MissingRefError(baseId, schema);
	        if (schOrEnv instanceof compile.SchemaEnv)
	            return callValidate(schOrEnv);
	        return inlineRefSchema(schOrEnv);
	        function callRootRef() {
	            if (env === env.root)
	                return callRef(cxt, validateName, env, env.$async);
	            const rootName = gen.scopeValue("root", { ref: env.root });
	            return callRef(cxt, codegen._ `${rootName}.validate`, env.root, env.root.$async);
	        }
	        function callValidate(sch) {
	            const v = getValidate(cxt, sch);
	            callRef(cxt, v, sch, sch.$async);
	        }
	        function inlineRefSchema(sch) {
	            const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: codegen.stringify(sch) } : { ref: sch });
	            const valid = gen.name("valid");
	            const schCxt = cxt.subschema({
	                schema: sch,
	                strictSchema: true,
	                dataTypes: [],
	                schemaPath: codegen.nil,
	                topSchemaRef: schName,
	                errSchemaPath: schema,
	            }, valid);
	            cxt.mergeEvaluated(schCxt);
	            cxt.ok(valid);
	        }
	    },
	};
	function getValidate(cxt, sch) {
	    const { gen } = cxt;
	    return sch.validate
	        ? gen.scopeValue("validate", { ref: sch.validate })
	        : codegen._ `${gen.scopeValue("wrapper", { ref: sch })}.validate`;
	}
	exports.getValidate = getValidate;
	function callRef(cxt, v, sch, $async) {
	    const { gen, it } = cxt;
	    const { allErrors, schemaEnv: env, opts } = it;
	    const passCxt = opts.passContext ? names_1.default.this : codegen.nil;
	    if ($async)
	        callAsyncRef();
	    else
	        callSyncRef();
	    function callAsyncRef() {
	        if (!env.$async)
	            throw new Error("async schema referenced by sync schema");
	        const valid = gen.let("valid");
	        gen.try(() => {
	            gen.code(codegen._ `await ${code$1.callValidateCode(cxt, v, passCxt)}`);
	            addEvaluatedFrom(v); // TODO will not work with async, it has to be returned with the result
	            if (!allErrors)
	                gen.assign(valid, true);
	        }, (e) => {
	            gen.if(codegen._ `!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
	            addErrorsFrom(e);
	            if (!allErrors)
	                gen.assign(valid, false);
	        });
	        cxt.ok(valid);
	    }
	    function callSyncRef() {
	        cxt.result(code$1.callValidateCode(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
	    }
	    function addErrorsFrom(source) {
	        const errs = codegen._ `${source}.errors`;
	        gen.assign(names_1.default.vErrors, codegen._ `${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`); // TODO tagged
	        gen.assign(names_1.default.errors, codegen._ `${names_1.default.vErrors}.length`);
	    }
	    function addEvaluatedFrom(source) {
	        var _a;
	        if (!it.opts.unevaluated)
	            return;
	        const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
	        // TODO refactor
	        if (it.props !== true) {
	            if (schEvaluated && !schEvaluated.dynamicProps) {
	                if (schEvaluated.props !== undefined) {
	                    it.props = util.mergeEvaluated.props(gen, schEvaluated.props, it.props);
	                }
	            }
	            else {
	                const props = gen.var("props", codegen._ `${source}.evaluated.props`);
	                it.props = util.mergeEvaluated.props(gen, props, it.props, codegen.Name);
	            }
	        }
	        if (it.items !== true) {
	            if (schEvaluated && !schEvaluated.dynamicItems) {
	                if (schEvaluated.items !== undefined) {
	                    it.items = util.mergeEvaluated.items(gen, schEvaluated.items, it.items);
	                }
	            }
	            else {
	                const items = gen.var("items", codegen._ `${source}.evaluated.items`);
	                it.items = util.mergeEvaluated.items(gen, items, it.items, codegen.Name);
	            }
	        }
	    }
	}
	exports.callRef = callRef;
	exports.default = def;

	});

	const core$1 = [
	    "$schema",
	    "$id",
	    "$defs",
	    "$vocabulary",
	    "definitions",
	    id.default,
	    ref.default,
	];
	var _default$2 = core$1;


	var core_1 = /*#__PURE__*/Object.defineProperty({
		default: _default$2
	}, '__esModule', {value: true});

	const ops = codegen.operators;
	const KWDs = {
	    maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
	    minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
	    exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
	    exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE },
	};
	const error = {
	    message: ({ keyword, schemaCode }) => codegen.str `should be ${KWDs[keyword].okStr} ${schemaCode}`,
	    params: ({ keyword, schemaCode }) => codegen._ `{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`,
	};
	const def$1 = {
	    keyword: Object.keys(KWDs),
	    type: "number",
	    schemaType: "number",
	    $data: true,
	    error,
	    code(cxt) {
	        const { keyword, data, schemaCode } = cxt;
	        cxt.fail$data(codegen._ `${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
	    },
	};
	var _default$3 = def$1;


	var limitNumber = /*#__PURE__*/Object.defineProperty({
		default: _default$3
	}, '__esModule', {value: true});

	const error$1 = {
	    message: ({ schemaCode }) => codegen.str `should be multiple of ${schemaCode}`,
	    params: ({ schemaCode }) => codegen._ `{multipleOf: ${schemaCode}}`,
	};
	const def$2 = {
	    keyword: "multipleOf",
	    type: "number",
	    schemaType: "number",
	    $data: true,
	    error: error$1,
	    code(cxt) {
	        const { gen, data, schemaCode, it } = cxt;
	        // const bdt = bad$DataType(schemaCode, <string>def.schemaType, $data)
	        const prec = it.opts.multipleOfPrecision;
	        const res = gen.let("res");
	        const invalid = prec
	            ? codegen._ `Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}`
	            : codegen._ `${res} !== parseInt(${res})`;
	        cxt.fail$data(codegen._ `(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
	    },
	};
	var _default$4 = def$2;


	var multipleOf = /*#__PURE__*/Object.defineProperty({
		default: _default$4
	}, '__esModule', {value: true});

	// https://mathiasbynens.be/notes/javascript-encoding
	// https://github.com/bestiejs/punycode.js - punycode.ucs2.decode
	function ucs2length(str) {
	    const len = str.length;
	    let length = 0;
	    let pos = 0;
	    let value;
	    while (pos < len) {
	        length++;
	        value = str.charCodeAt(pos++);
	        if (value >= 0xd800 && value <= 0xdbff && pos < len) {
	            // high surrogate, and there is a next character
	            value = str.charCodeAt(pos);
	            if ((value & 0xfc00) === 0xdc00)
	                pos++; // low surrogate
	        }
	    }
	    return length;
	}
	var _default$5 = ucs2length;


	var ucs2length_1 = /*#__PURE__*/Object.defineProperty({
		default: _default$5
	}, '__esModule', {value: true});

	const error$2 = {
	    message({ keyword, schemaCode }) {
	        const comp = keyword === "maxLength" ? "more" : "fewer";
	        return codegen.str `should NOT have ${comp} than ${schemaCode} characters`;
	    },
	    params: ({ schemaCode }) => codegen._ `{limit: ${schemaCode}}`,
	};
	const def$3 = {
	    keyword: ["maxLength", "minLength"],
	    type: "string",
	    schemaType: "number",
	    $data: true,
	    error: error$2,
	    code(cxt) {
	        const { keyword, data, schemaCode, it } = cxt;
	        const op = keyword === "maxLength" ? codegen.operators.GT : codegen.operators.LT;
	        let len;
	        if (it.opts.unicode === false) {
	            len = codegen._ `${data}.length`;
	        }
	        else {
	            const u2l = cxt.gen.scopeValue("func", {
	                ref: ucs2length_1.default,
	                code: codegen._ `require("ajv/dist/compile/ucs2length").default`,
	            });
	            len = codegen._ `${u2l}(${data})`;
	        }
	        cxt.fail$data(codegen._ `${len} ${op} ${schemaCode}`);
	    },
	};
	var _default$6 = def$3;


	var limitLength = /*#__PURE__*/Object.defineProperty({
		default: _default$6
	}, '__esModule', {value: true});

	const error$3 = {
	    message: ({ schemaCode }) => codegen.str `should match pattern "${schemaCode}"`,
	    params: ({ schemaCode }) => codegen._ `{pattern: ${schemaCode}}`,
	};
	const def$4 = {
	    keyword: "pattern",
	    type: "string",
	    schemaType: "string",
	    $data: true,
	    error: error$3,
	    code(cxt) {
	        const { gen, data, $data, schema, schemaCode } = cxt;
	        const regExp = $data ? codegen._ `(new RegExp(${schemaCode}, "u"))` : code$1.usePattern(gen, schema); // TODO regexp should be wrapped in try/catch
	        cxt.fail$data(codegen._ `!${regExp}.test(${data})`);
	    },
	};
	var _default$7 = def$4;


	var pattern = /*#__PURE__*/Object.defineProperty({
		default: _default$7
	}, '__esModule', {value: true});

	const error$4 = {
	    message({ keyword, schemaCode }) {
	        const comp = keyword === "maxProperties" ? "more" : "fewer";
	        return codegen.str `should NOT have ${comp} than ${schemaCode} items`;
	    },
	    params: ({ schemaCode }) => codegen._ `{limit: ${schemaCode}}`,
	};
	const def$5 = {
	    keyword: ["maxProperties", "minProperties"],
	    type: "object",
	    schemaType: "number",
	    $data: true,
	    error: error$4,
	    code(cxt) {
	        const { keyword, data, schemaCode } = cxt;
	        const op = keyword === "maxProperties" ? codegen.operators.GT : codegen.operators.LT;
	        cxt.fail$data(codegen._ `Object.keys(${data}).length ${op} ${schemaCode}`);
	    },
	};
	var _default$8 = def$5;


	var limitProperties = /*#__PURE__*/Object.defineProperty({
		default: _default$8
	}, '__esModule', {value: true});

	const error$5 = {
	    message: ({ params: { missingProperty } }) => codegen.str `should have required property '${missingProperty}'`,
	    params: ({ params: { missingProperty } }) => codegen._ `{missingProperty: ${missingProperty}}`,
	};
	const def$6 = {
	    keyword: "required",
	    type: "object",
	    schemaType: "array",
	    $data: true,
	    error: error$5,
	    code(cxt) {
	        const { gen, schema, schemaCode, data, $data, it } = cxt;
	        const { opts } = it;
	        if (!$data && schema.length === 0)
	            return;
	        const useLoop = schema.length >= opts.loopRequired;
	        if (it.allErrors)
	            allErrorsMode();
	        else
	            exitOnErrorMode();
	        function allErrorsMode() {
	            if (useLoop || $data) {
	                cxt.block$data(codegen.nil, loopAllRequired);
	            }
	            else {
	                for (const prop of schema) {
	                    code$1.checkReportMissingProp(cxt, prop);
	                }
	            }
	        }
	        function exitOnErrorMode() {
	            const missing = gen.let("missing");
	            if (useLoop || $data) {
	                const valid = gen.let("valid", true);
	                cxt.block$data(valid, () => loopUntilMissing(missing, valid));
	                cxt.ok(valid);
	            }
	            else {
	                gen.if(code$1.checkMissingProp(cxt, schema, missing));
	                code$1.reportMissingProp(cxt, missing);
	                gen.else();
	            }
	        }
	        function loopAllRequired() {
	            gen.forOf("prop", schemaCode, (prop) => {
	                cxt.setParams({ missingProperty: prop });
	                gen.if(code$1.noPropertyInData(data, prop, opts.ownProperties), () => cxt.error());
	            });
	        }
	        function loopUntilMissing(missing, valid) {
	            cxt.setParams({ missingProperty: missing });
	            gen.forOf(missing, schemaCode, () => {
	                gen.assign(valid, code$1.propertyInData(data, missing, opts.ownProperties));
	                gen.if(codegen.not(valid), () => {
	                    cxt.error();
	                    gen.break();
	                });
	            }, codegen.nil);
	        }
	    },
	};
	var _default$9 = def$6;


	var required$1 = /*#__PURE__*/Object.defineProperty({
		default: _default$9
	}, '__esModule', {value: true});

	const error$6 = {
	    message({ keyword, schemaCode }) {
	        const comp = keyword === "maxItems" ? "more" : "fewer";
	        return codegen.str `should NOT have ${comp} than ${schemaCode} items`;
	    },
	    params: ({ schemaCode }) => codegen._ `{limit: ${schemaCode}}`,
	};
	const def$7 = {
	    keyword: ["maxItems", "minItems"],
	    type: "array",
	    schemaType: "number",
	    $data: true,
	    error: error$6,
	    code(cxt) {
	        const { keyword, data, schemaCode } = cxt;
	        const op = keyword === "maxItems" ? codegen.operators.GT : codegen.operators.LT;
	        cxt.fail$data(codegen._ `${data}.length ${op} ${schemaCode}`);
	    },
	};
	var _default$a = def$7;


	var limitItems = /*#__PURE__*/Object.defineProperty({
		default: _default$a
	}, '__esModule', {value: true});

	const error$7 = {
	    message: ({ params: { i, j } }) => codegen.str `should NOT have duplicate items (items ## ${j} and ${i} are identical)`,
	    params: ({ params: { i, j } }) => codegen._ `{i: ${i}, j: ${j}}`,
	};
	const def$8 = {
	    keyword: "uniqueItems",
	    type: "array",
	    schemaType: "boolean",
	    $data: true,
	    error: error$7,
	    code(cxt) {
	        const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
	        if (!$data && !schema)
	            return;
	        const valid = gen.let("valid");
	        const itemTypes = parentSchema.items ? dataType.getSchemaTypes(parentSchema.items) : [];
	        cxt.block$data(valid, validateUniqueItems, codegen._ `${schemaCode} === false`);
	        cxt.ok(valid);
	        function validateUniqueItems() {
	            const i = gen.let("i", codegen._ `${data}.length`);
	            const j = gen.let("j");
	            cxt.setParams({ i, j });
	            gen.assign(valid, true);
	            gen.if(codegen._ `${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
	        }
	        function canOptimize() {
	            return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
	        }
	        function loopN(i, j) {
	            const item = gen.name("item");
	            const wrongType = dataType.checkDataTypes(itemTypes, item, it.opts.strict, dataType.DataType.Wrong);
	            const indices = gen.const("indices", codegen._ `{}`);
	            gen.for(codegen._ `;${i}--;`, () => {
	                gen.let(item, codegen._ `${data}[${i}]`);
	                gen.if(wrongType, codegen._ `continue`);
	                if (itemTypes.length > 1)
	                    gen.if(codegen._ `typeof ${item} == "string"`, codegen._ `${item} += "_"`);
	                gen
	                    .if(codegen._ `typeof ${indices}[${item}] == "number"`, () => {
	                    gen.assign(j, codegen._ `${indices}[${item}]`);
	                    cxt.error();
	                    gen.assign(valid, false).break();
	                })
	                    .code(codegen._ `${indices}[${item}] = ${i}`);
	            });
	        }
	        function loopN2(i, j) {
	            const eql = cxt.gen.scopeValue("func", {
	                ref: fastDeepEqual,
	                code: codegen._ `require("ajv/dist/compile/equal")`,
	            });
	            const outer = gen.name("outer");
	            gen.label(outer).for(codegen._ `;${i}--;`, () => gen.for(codegen._ `${j} = ${i}; ${j}--;`, () => gen.if(codegen._ `${eql}(${data}[${i}], ${data}[${j}])`, () => {
	                cxt.error();
	                gen.assign(valid, false).break(outer);
	            })));
	        }
	    },
	};
	var _default$b = def$8;


	var uniqueItems = /*#__PURE__*/Object.defineProperty({
		default: _default$b
	}, '__esModule', {value: true});

	const error$8 = {
	    message: "should be equal to constant",
	    params: ({ schemaCode }) => codegen._ `{allowedValue: ${schemaCode}}`,
	};
	const def$9 = {
	    keyword: "const",
	    $data: true,
	    error: error$8,
	    code(cxt) {
	        const eql = cxt.gen.scopeValue("func", {
	            ref: fastDeepEqual,
	            code: codegen._ `require("ajv/dist/compile/equal")`,
	        });
	        // TODO optimize for scalar values in schema
	        cxt.fail$data(codegen._ `!${eql}(${cxt.data}, ${cxt.schemaCode})`);
	    },
	};
	var _default$c = def$9;


	var _const = /*#__PURE__*/Object.defineProperty({
		default: _default$c
	}, '__esModule', {value: true});

	const error$9 = {
	    message: "should be equal to one of the allowed values",
	    params: ({ schemaCode }) => codegen._ `{allowedValues: ${schemaCode}}`,
	};
	const def$a = {
	    keyword: "enum",
	    schemaType: "array",
	    $data: true,
	    error: error$9,
	    code(cxt) {
	        const { gen, data, $data, schema, schemaCode, it } = cxt;
	        if (!$data && schema.length === 0)
	            throw new Error("enum must have non-empty array");
	        const useLoop = schema.length >= it.opts.loopEnum;
	        const eql = cxt.gen.scopeValue("func", {
	            ref: fastDeepEqual,
	            code: codegen._ `require("ajv/dist/compile/equal")`,
	        });
	        let valid;
	        if (useLoop || $data) {
	            valid = gen.let("valid");
	            cxt.block$data(valid, loopEnum);
	        }
	        else {
	            /* istanbul ignore if */
	            if (!Array.isArray(schema))
	                throw new Error("ajv implementation error");
	            const vSchema = gen.const("vSchema", schemaCode);
	            valid = codegen.or(...schema.map((_x, i) => equalCode(vSchema, i)));
	        }
	        cxt.pass(valid);
	        function loopEnum() {
	            gen.assign(valid, false);
	            gen.forOf("v", schemaCode, (v) => gen.if(codegen._ `${eql}(${data}, ${v})`, () => gen.assign(valid, true).break()));
	        }
	        function equalCode(vSchema, i) {
	            const sch = schema[i];
	            return sch && typeof sch === "object"
	                ? codegen._ `${eql}(${data}, ${vSchema}[${i}])`
	                : codegen._ `${data} === ${sch}`;
	        }
	    },
	};
	var _default$d = def$a;


	var _enum = /*#__PURE__*/Object.defineProperty({
		default: _default$d
	}, '__esModule', {value: true});

	const validation = [
	    // number
	    limitNumber.default,
	    multipleOf.default,
	    // string
	    limitLength.default,
	    pattern.default,
	    // object
	    limitProperties.default,
	    required$1.default,
	    // array
	    limitItems.default,
	    uniqueItems.default,
	    // any
	    { keyword: "nullable", schemaType: "boolean" },
	    _const.default,
	    _enum.default,
	];
	var _default$e = validation;


	var validation_1 = /*#__PURE__*/Object.defineProperty({
		default: _default$e
	}, '__esModule', {value: true});

	const error$a = {
	    message: ({ params: { len } }) => codegen.str `should NOT have more than ${len} items`,
	    params: ({ params: { len } }) => codegen._ `{limit: ${len}}`,
	};
	const def$b = {
	    keyword: "additionalItems",
	    type: "array",
	    schemaType: ["boolean", "object"],
	    before: "uniqueItems",
	    error: error$a,
	    code(cxt) {
	        const { gen, schema, parentSchema, data, it } = cxt;
	        const { items } = parentSchema;
	        if (!Array.isArray(items)) {
	            validate.checkStrictMode(it, '"additionalItems" is ignored when "items" is not an array of schemas');
	            return;
	        }
	        it.items = true;
	        const len = gen.const("len", codegen._ `${data}.length`);
	        if (schema === false) {
	            cxt.setParams({ len: items.length });
	            cxt.pass(codegen._ `${len} <= ${items.length}`);
	        }
	        else if (typeof schema == "object" && !util.alwaysValidSchema(it, schema)) {
	            const valid = gen.var("valid", codegen._ `${len} <= ${items.length}`); // TODO var
	            gen.if(codegen.not(valid), () => validateItems(valid));
	            cxt.ok(valid);
	        }
	        function validateItems(valid) {
	            gen.forRange("i", items.length, len, (i) => {
	                cxt.subschema({ keyword: "additionalItems", dataProp: i, dataPropType: subschema.Type.Num }, valid);
	                if (!it.allErrors)
	                    gen.if(codegen.not(valid), () => gen.break());
	            });
	        }
	    },
	};
	var _default$f = def$b;


	var additionalItems = /*#__PURE__*/Object.defineProperty({
		default: _default$f
	}, '__esModule', {value: true});

	const def$c = {
	    keyword: "items",
	    type: "array",
	    schemaType: ["object", "array", "boolean"],
	    before: "uniqueItems",
	    code(cxt) {
	        const { gen, schema, parentSchema, data, it } = cxt;
	        const len = gen.const("len", codegen._ `${data}.length`);
	        if (Array.isArray(schema)) {
	            if (it.opts.unevaluated && schema.length && it.items !== true) {
	                it.items = util.mergeEvaluated.items(gen, schema.length, it.items);
	            }
	            validateTuple(schema);
	        }
	        else {
	            it.items = true;
	            if (!util.alwaysValidSchema(it, schema))
	                validateArray();
	        }
	        function validateTuple(schArr) {
	            if (it.opts.strictTuples && !fullTupleSchema(schema.length, parentSchema)) {
	                const msg = `"items" is ${schArr.length}-tuple, but minItems or maxItems/additionalItems are not specified or different`;
	                validate.checkStrictMode(it, msg, it.opts.strictTuples);
	            }
	            const valid = gen.name("valid");
	            schArr.forEach((sch, i) => {
	                if (util.alwaysValidSchema(it, sch))
	                    return;
	                gen.if(codegen._ `${len} > ${i}`, () => cxt.subschema({
	                    keyword: "items",
	                    schemaProp: i,
	                    dataProp: i,
	                    strictSchema: it.strictSchema,
	                }, valid));
	                cxt.ok(valid);
	            });
	        }
	        function validateArray() {
	            const valid = gen.name("valid");
	            gen.forRange("i", 0, len, (i) => {
	                cxt.subschema({
	                    keyword: "items",
	                    dataProp: i,
	                    dataPropType: subschema.Type.Num,
	                    strictSchema: it.strictSchema,
	                }, valid);
	                if (!it.allErrors)
	                    gen.if(codegen.not(valid), () => gen.break());
	            });
	            cxt.ok(valid);
	        }
	    },
	};
	function fullTupleSchema(len, sch) {
	    return len === sch.minItems && (len === sch.maxItems || sch.additionalItems === false);
	}
	var _default$g = def$c;


	var items = /*#__PURE__*/Object.defineProperty({
		default: _default$g
	}, '__esModule', {value: true});

	const error$b = {
	    message: ({ params: { min, max } }) => max === undefined
	        ? codegen.str `should contain at least ${min} valid item(s)`
	        : codegen.str `should contain at least ${min} and no more than ${max} valid item(s)`,
	    params: ({ params: { min, max } }) => max === undefined ? codegen._ `{minContains: ${min}}` : codegen._ `{minContains: ${min}, maxContains: ${max}}`,
	};
	const def$d = {
	    keyword: "contains",
	    type: "array",
	    schemaType: ["object", "boolean"],
	    before: "uniqueItems",
	    trackErrors: true,
	    error: error$b,
	    code(cxt) {
	        const { gen, schema, parentSchema, data, it } = cxt;
	        let min;
	        let max;
	        const { minContains, maxContains } = parentSchema;
	        if (it.opts.next) {
	            min = minContains === undefined ? 1 : minContains;
	            max = maxContains;
	        }
	        else {
	            min = 1;
	        }
	        const len = gen.const("len", codegen._ `${data}.length`);
	        cxt.setParams({ min, max });
	        if (max === undefined && min === 0) {
	            validate.checkStrictMode(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
	            return;
	        }
	        if (max !== undefined && min > max) {
	            validate.checkStrictMode(it, `"minContains" > "maxContains" is always invalid`);
	            cxt.fail();
	            return;
	        }
	        if (util.alwaysValidSchema(it, schema)) {
	            let cond = codegen._ `${len} >= ${min}`;
	            if (max !== undefined)
	                cond = codegen._ `${cond} && ${len} <= ${max}`;
	            cxt.pass(cond);
	            return;
	        }
	        it.items = true;
	        const valid = gen.name("valid");
	        if (max === undefined && min === 1) {
	            validateItems(valid, () => gen.if(valid, () => gen.break()));
	        }
	        else {
	            gen.let(valid, false);
	            const schValid = gen.name("_valid");
	            const count = gen.let("count", 0);
	            validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
	        }
	        cxt.result(valid, () => cxt.reset());
	        function validateItems(_valid, block) {
	            gen.forRange("i", 0, len, (i) => {
	                cxt.subschema({
	                    keyword: "contains",
	                    dataProp: i,
	                    dataPropType: subschema.Type.Num,
	                    compositeRule: true,
	                }, _valid);
	                block();
	            });
	        }
	        function checkLimits(count) {
	            gen.code(codegen._ `${count}++`);
	            if (max === undefined) {
	                gen.if(codegen._ `${count} >= ${min}`, () => gen.assign(valid, true).break());
	            }
	            else {
	                gen.if(codegen._ `${count} > ${max}`, () => gen.assign(valid, false).break());
	                if (min === 1)
	                    gen.assign(valid, true);
	                else
	                    gen.if(codegen._ `${count} >= ${min}`, () => gen.assign(valid, true));
	            }
	        }
	    },
	};
	var _default$h = def$d;


	var contains = /*#__PURE__*/Object.defineProperty({
		default: _default$h
	}, '__esModule', {value: true});

	var dependencies = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;



	exports.error = {
	    message: ({ params: { property, depsCount, deps } }) => {
	        const property_ies = depsCount === 1 ? "property" : "properties";
	        return codegen.str `should have ${property_ies} ${deps} when property ${property} is present`;
	    },
	    params: ({ params: { property, depsCount, deps, missingProperty } }) => codegen._ `{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`,
	};
	const def = {
	    keyword: "dependencies",
	    type: "object",
	    schemaType: "object",
	    error: exports.error,
	    code(cxt) {
	        const [propDeps, schDeps] = splitDependencies(cxt);
	        validatePropertyDeps(cxt, propDeps);
	        validateSchemaDeps(cxt, schDeps);
	    },
	};
	function splitDependencies({ schema }) {
	    const propertyDeps = {};
	    const schemaDeps = {};
	    for (const key in schema) {
	        if (key === "__proto__")
	            continue;
	        const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
	        deps[key] = schema[key];
	    }
	    return [propertyDeps, schemaDeps];
	}
	function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
	    const { gen, data, it } = cxt;
	    if (Object.keys(propertyDeps).length === 0)
	        return;
	    const missing = gen.let("missing");
	    for (const prop in propertyDeps) {
	        const deps = propertyDeps[prop];
	        if (deps.length === 0)
	            continue;
	        const hasProperty = code$1.propertyInData(data, prop, it.opts.ownProperties);
	        cxt.setParams({
	            property: prop,
	            depsCount: deps.length,
	            deps: deps.join(", "),
	        });
	        if (it.allErrors) {
	            gen.if(hasProperty, () => {
	                for (const depProp of deps) {
	                    code$1.checkReportMissingProp(cxt, depProp);
	                }
	            });
	        }
	        else {
	            gen.if(codegen._ `${hasProperty} && (${code$1.checkMissingProp(cxt, deps, missing)})`);
	            code$1.reportMissingProp(cxt, missing);
	            gen.else();
	        }
	    }
	}
	exports.validatePropertyDeps = validatePropertyDeps;
	function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
	    const { gen, data, keyword, it } = cxt;
	    const valid = gen.name("valid");
	    for (const prop in schemaDeps) {
	        if (util.alwaysValidSchema(it, schemaDeps[prop]))
	            continue;
	        gen.if(code$1.propertyInData(data, prop, it.opts.ownProperties), () => {
	            const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
	            cxt.mergeValidEvaluated(schCxt, valid);
	        }, () => gen.var(valid, true) // TODO var
	        );
	        cxt.ok(valid);
	    }
	}
	exports.validateSchemaDeps = validateSchemaDeps;
	exports.default = def;

	});

	const error$c = {
	    message: ({ params }) => codegen.str `property name '${params.propertyName}' is invalid`,
	    params: ({ params }) => codegen._ `{propertyName: ${params.propertyName}}`,
	};
	const def$e = {
	    keyword: "propertyNames",
	    type: "object",
	    schemaType: ["object", "boolean"],
	    error: error$c,
	    code(cxt) {
	        const { gen, schema, data, it } = cxt;
	        if (util.alwaysValidSchema(it, schema))
	            return;
	        const valid = gen.name("valid");
	        gen.forIn("key", data, (key) => {
	            cxt.setParams({ propertyName: key });
	            cxt.subschema({
	                keyword: "propertyNames",
	                data: key,
	                dataTypes: ["string"],
	                propertyName: key,
	                compositeRule: true,
	                strictSchema: it.strictSchema,
	            }, valid);
	            gen.if(codegen.not(valid), () => {
	                cxt.error(true);
	                if (!it.allErrors)
	                    gen.break();
	            });
	        });
	        cxt.ok(valid);
	    },
	};
	var _default$i = def$e;


	var propertyNames = /*#__PURE__*/Object.defineProperty({
		default: _default$i
	}, '__esModule', {value: true});

	const error$d = {
	    message: "should NOT have additional properties",
	    params: ({ params }) => codegen._ `{additionalProperty: ${params.additionalProperty}}`,
	};
	const def$f = {
	    keyword: "additionalProperties",
	    type: ["object"],
	    schemaType: ["boolean", "object"],
	    allowUndefined: true,
	    trackErrors: true,
	    error: error$d,
	    code(cxt) {
	        const { gen, schema, parentSchema, data, errsCount, it } = cxt;
	        /* istanbul ignore if */
	        if (!errsCount)
	            throw new Error("ajv implementation error");
	        const { allErrors, opts } = it;
	        it.props = true;
	        if (opts.removeAdditional !== "all" && util.alwaysValidSchema(it, schema))
	            return;
	        const props = code$1.allSchemaProperties(parentSchema.properties);
	        const patProps = code$1.allSchemaProperties(parentSchema.patternProperties);
	        checkAdditionalProperties();
	        cxt.ok(codegen._ `${errsCount} === ${names_1.default.errors}`);
	        function checkAdditionalProperties() {
	            gen.forIn("key", data, (key) => {
	                if (!props.length && !patProps.length)
	                    additionalPropertyCode(key);
	                else
	                    gen.if(isAdditional(key), () => additionalPropertyCode(key));
	            });
	        }
	        function isAdditional(key) {
	            let definedProp;
	            if (props.length > 8) {
	                // TODO maybe an option instead of hard-coded 8?
	                const propsSchema = util.schemaRefOrVal(it, parentSchema.properties, "properties");
	                definedProp = codegen._ `${propsSchema}.hasOwnProperty(${key})`;
	            }
	            else if (props.length) {
	                definedProp = codegen.or(...props.map((p) => codegen._ `${key} === ${p}`));
	            }
	            else {
	                definedProp = codegen.nil;
	            }
	            if (patProps.length) {
	                definedProp = codegen.or(definedProp, ...patProps.map((p) => codegen._ `${code$1.usePattern(gen, p)}.test(${key})`));
	            }
	            return codegen._ `!(${definedProp})`;
	        }
	        function deleteAdditional(key) {
	            gen.code(codegen._ `delete ${data}[${key}]`);
	        }
	        function additionalPropertyCode(key) {
	            if (opts.removeAdditional === "all" || (opts.removeAdditional && schema === false)) {
	                deleteAdditional(key);
	                return;
	            }
	            if (schema === false) {
	                cxt.setParams({ additionalProperty: key });
	                cxt.error();
	                if (!allErrors)
	                    gen.break();
	                return;
	            }
	            if (typeof schema == "object" && !util.alwaysValidSchema(it, schema)) {
	                const valid = gen.name("valid");
	                if (opts.removeAdditional === "failing") {
	                    applyAdditionalSchema(key, valid, false);
	                    gen.if(codegen.not(valid), () => {
	                        cxt.reset();
	                        deleteAdditional(key);
	                    });
	                }
	                else {
	                    applyAdditionalSchema(key, valid);
	                    if (!allErrors)
	                        gen.if(codegen.not(valid), () => gen.break());
	                }
	            }
	        }
	        function applyAdditionalSchema(key, valid, errors) {
	            const subschema$1 = {
	                keyword: "additionalProperties",
	                dataProp: key,
	                dataPropType: subschema.Type.Str,
	                strictSchema: it.strictSchema,
	            };
	            if (errors === false) {
	                Object.assign(subschema$1, {
	                    compositeRule: true,
	                    createErrors: false,
	                    allErrors: false,
	                });
	            }
	            cxt.subschema(subschema$1, valid);
	        }
	    },
	};
	var _default$j = def$f;


	var additionalProperties$1 = /*#__PURE__*/Object.defineProperty({
		default: _default$j
	}, '__esModule', {value: true});

	const def$g = {
	    keyword: "properties",
	    type: "object",
	    schemaType: "object",
	    code(cxt) {
	        const { gen, schema, parentSchema, data, it } = cxt;
	        if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === undefined) {
	            additionalProperties$1.default.code(new context.default(it, additionalProperties$1.default, "additionalProperties"));
	        }
	        const allProps = code$1.allSchemaProperties(schema);
	        if (it.opts.unevaluated && allProps.length && it.props !== true) {
	            it.props = util.mergeEvaluated.props(gen, util.toHash(allProps), it.props);
	        }
	        const properties = allProps.filter((p) => !util.alwaysValidSchema(it, schema[p]));
	        if (properties.length === 0)
	            return;
	        const valid = gen.name("valid");
	        for (const prop of properties) {
	            if (hasDefault(prop)) {
	                applyPropertySchema(prop);
	            }
	            else {
	                gen.if(code$1.propertyInData(data, prop, it.opts.ownProperties));
	                applyPropertySchema(prop);
	                if (!it.allErrors)
	                    gen.else().var(valid, true);
	                gen.endIf();
	            }
	            cxt.ok(valid);
	        }
	        function hasDefault(prop) {
	            return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== undefined;
	        }
	        function applyPropertySchema(prop) {
	            cxt.subschema({
	                keyword: "properties",
	                schemaProp: prop,
	                dataProp: prop,
	                strictSchema: it.strictSchema,
	            }, valid);
	        }
	    },
	};
	var _default$k = def$g;


	var properties$1 = /*#__PURE__*/Object.defineProperty({
		default: _default$k
	}, '__esModule', {value: true});

	const def$h = {
	    keyword: "patternProperties",
	    type: "object",
	    schemaType: "object",
	    code(cxt) {
	        const { gen, schema, data, parentSchema, it } = cxt;
	        const { opts } = it;
	        const patterns = code$1.schemaProperties(it, schema);
	        // TODO mark properties matching patterns with always valid schemas as evaluated
	        if (patterns.length === 0)
	            return;
	        const checkProperties = opts.strict && !opts.allowMatchingProperties && parentSchema.properties;
	        const valid = gen.name("valid");
	        if (it.props !== true && !(it.props instanceof codegen.Name)) {
	            it.props = util.evaluatedPropsToName(gen, it.props);
	        }
	        const { props } = it;
	        validatePatternProperties();
	        function validatePatternProperties() {
	            for (const pat of patterns) {
	                if (checkProperties)
	                    checkMatchingProperties(pat);
	                if (it.allErrors) {
	                    validateProperties(pat);
	                }
	                else {
	                    gen.var(valid, true); // TODO var
	                    validateProperties(pat);
	                    gen.if(valid);
	                }
	            }
	        }
	        function checkMatchingProperties(pat) {
	            for (const prop in checkProperties) {
	                if (new RegExp(pat).test(prop)) {
	                    validate.checkStrictMode(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
	                }
	            }
	        }
	        function validateProperties(pat) {
	            gen.forIn("key", data, (key) => {
	                gen.if(codegen._ `${code$1.usePattern(gen, pat)}.test(${key})`, () => {
	                    cxt.subschema({
	                        keyword: "patternProperties",
	                        schemaProp: pat,
	                        dataProp: key,
	                        dataPropType: subschema.Type.Str,
	                        strictSchema: it.strictSchema,
	                    }, valid);
	                    if (it.opts.unevaluated && props !== true) {
	                        gen.assign(codegen._ `${props}[${key}]`, true);
	                    }
	                    else if (!it.allErrors) {
	                        // can short-circuit if `unevaluatedProperties` is not supported (opts.next === false)
	                        // or if all properties were evaluated (props === true)
	                        gen.if(codegen.not(valid), () => gen.break());
	                    }
	                });
	            });
	        }
	    },
	};
	var _default$l = def$h;


	var patternProperties = /*#__PURE__*/Object.defineProperty({
		default: _default$l
	}, '__esModule', {value: true});

	const def$i = {
	    keyword: "not",
	    schemaType: ["object", "boolean"],
	    trackErrors: true,
	    code(cxt) {
	        const { gen, schema, it } = cxt;
	        if (util.alwaysValidSchema(it, schema)) {
	            cxt.fail();
	            return;
	        }
	        const valid = gen.name("valid");
	        cxt.subschema({
	            keyword: "not",
	            compositeRule: true,
	            createErrors: false,
	            allErrors: false,
	        }, valid);
	        cxt.result(valid, () => cxt.error(), () => cxt.reset());
	    },
	    error: {
	        message: "should NOT be valid",
	    },
	};
	var _default$m = def$i;


	var not = /*#__PURE__*/Object.defineProperty({
		default: _default$m
	}, '__esModule', {value: true});

	const def$j = {
	    keyword: "anyOf",
	    schemaType: "array",
	    trackErrors: true,
	    code(cxt) {
	        const { gen, schema, it } = cxt;
	        /* istanbul ignore if */
	        if (!Array.isArray(schema))
	            throw new Error("ajv implementation error");
	        const alwaysValid = schema.some((sch) => util.alwaysValidSchema(it, sch));
	        if (alwaysValid && !it.opts.unevaluated)
	            return;
	        const valid = gen.let("valid", false);
	        const schValid = gen.name("_valid");
	        gen.block(() => schema.forEach((_sch, i) => {
	            const schCxt = cxt.subschema({
	                keyword: "anyOf",
	                schemaProp: i,
	                compositeRule: true,
	            }, schValid);
	            gen.assign(valid, codegen._ `${valid} || ${schValid}`);
	            const merged = cxt.mergeValidEvaluated(schCxt, schValid);
	            // can short-circuit if `unevaluatedProperties/Items` not supported (opts.unevaluated !== true)
	            // or if all properties and items were evaluated (it.props === true && it.items === true)
	            if (!merged)
	                gen.if(codegen.not(valid));
	        }));
	        cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
	    },
	    error: {
	        message: "should match some schema in anyOf",
	    },
	};
	var _default$n = def$j;


	var anyOf = /*#__PURE__*/Object.defineProperty({
		default: _default$n
	}, '__esModule', {value: true});

	const error$e = {
	    message: "should match exactly one schema in oneOf",
	    params: ({ params }) => codegen._ `{passingSchemas: ${params.passing}}`,
	};
	const def$k = {
	    keyword: "oneOf",
	    schemaType: "array",
	    trackErrors: true,
	    error: error$e,
	    code(cxt) {
	        const { gen, schema, it } = cxt;
	        /* istanbul ignore if */
	        if (!Array.isArray(schema))
	            throw new Error("ajv implementation error");
	        const schArr = schema;
	        const valid = gen.let("valid", false);
	        const passing = gen.let("passing", null);
	        const schValid = gen.name("_valid");
	        cxt.setParams({ passing });
	        // TODO possibly fail straight away (with warning or exception) if there are two empty always valid schemas
	        gen.block(validateOneOf);
	        cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
	        function validateOneOf() {
	            schArr.forEach((sch, i) => {
	                let schCxt;
	                if (util.alwaysValidSchema(it, sch)) {
	                    gen.var(schValid, true);
	                }
	                else {
	                    schCxt = cxt.subschema({
	                        keyword: "oneOf",
	                        schemaProp: i,
	                        compositeRule: true,
	                    }, schValid);
	                }
	                if (i > 0) {
	                    gen
	                        .if(codegen._ `${schValid} && ${valid}`)
	                        .assign(valid, false)
	                        .assign(passing, codegen._ `[${passing}, ${i}]`)
	                        .else();
	                }
	                gen.if(schValid, () => {
	                    gen.assign(valid, true);
	                    gen.assign(passing, i);
	                    if (schCxt)
	                        cxt.mergeEvaluated(schCxt, codegen.Name);
	                });
	            });
	        }
	    },
	};
	var _default$o = def$k;


	var oneOf = /*#__PURE__*/Object.defineProperty({
		default: _default$o
	}, '__esModule', {value: true});

	const def$l = {
	    keyword: "allOf",
	    schemaType: "array",
	    code(cxt) {
	        const { gen, schema, it } = cxt;
	        /* istanbul ignore if */
	        if (!Array.isArray(schema))
	            throw new Error("ajv implementation error");
	        const valid = gen.name("valid");
	        schema.forEach((sch, i) => {
	            if (util.alwaysValidSchema(it, sch))
	                return;
	            const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
	            cxt.ok(valid);
	            cxt.mergeEvaluated(schCxt);
	        });
	    },
	};
	var _default$p = def$l;


	var allOf = /*#__PURE__*/Object.defineProperty({
		default: _default$p
	}, '__esModule', {value: true});

	const error$f = {
	    message: ({ params }) => codegen.str `should match "${params.ifClause}" schema`,
	    params: ({ params }) => codegen._ `{failingKeyword: ${params.ifClause}}`,
	};
	const def$m = {
	    keyword: "if",
	    schemaType: ["object", "boolean"],
	    trackErrors: true,
	    error: error$f,
	    code(cxt) {
	        const { gen, parentSchema, it } = cxt;
	        if (parentSchema.then === undefined && parentSchema.else === undefined) {
	            validate.checkStrictMode(it, '"if" without "then" and "else" is ignored');
	        }
	        const hasThen = hasSchema(it, "then");
	        const hasElse = hasSchema(it, "else");
	        if (!hasThen && !hasElse)
	            return;
	        const valid = gen.let("valid", true);
	        const schValid = gen.name("_valid");
	        validateIf();
	        cxt.reset();
	        if (hasThen && hasElse) {
	            const ifClause = gen.let("ifClause");
	            cxt.setParams({ ifClause });
	            gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
	        }
	        else if (hasThen) {
	            gen.if(schValid, validateClause("then"));
	        }
	        else {
	            gen.if(codegen.not(schValid), validateClause("else"));
	        }
	        cxt.pass(valid, () => cxt.error(true));
	        function validateIf() {
	            const schCxt = cxt.subschema({
	                keyword: "if",
	                compositeRule: true,
	                createErrors: false,
	                allErrors: false,
	            }, schValid);
	            cxt.mergeEvaluated(schCxt);
	        }
	        function validateClause(keyword, ifClause) {
	            return () => {
	                const schCxt = cxt.subschema({ keyword }, schValid);
	                gen.assign(valid, schValid);
	                cxt.mergeValidEvaluated(schCxt, valid);
	                if (ifClause)
	                    gen.assign(ifClause, codegen._ `${keyword}`);
	                else
	                    cxt.setParams({ ifClause: keyword });
	            };
	        }
	    },
	};
	function hasSchema(it, keyword) {
	    const schema = it.schema[keyword];
	    return schema !== undefined && !util.alwaysValidSchema(it, schema);
	}
	var _default$q = def$m;


	var _if = /*#__PURE__*/Object.defineProperty({
		default: _default$q
	}, '__esModule', {value: true});

	const def$n = {
	    keyword: ["then", "else"],
	    schemaType: ["object", "boolean"],
	    code({ keyword, parentSchema, it }) {
	        if (parentSchema.if === undefined)
	            validate.checkStrictMode(it, `"${keyword}" without "if" is ignored`);
	    },
	};
	var _default$r = def$n;


	var thenElse = /*#__PURE__*/Object.defineProperty({
		default: _default$r
	}, '__esModule', {value: true});

	const applicator = [
	    // any
	    not.default,
	    anyOf.default,
	    oneOf.default,
	    allOf.default,
	    _if.default,
	    thenElse.default,
	    // array
	    additionalItems.default,
	    items.default,
	    contains.default,
	    // object
	    propertyNames.default,
	    additionalProperties$1.default,
	    dependencies.default,
	    properties$1.default,
	    patternProperties.default,
	];
	var _default$s = applicator;


	var applicator_1 = /*#__PURE__*/Object.defineProperty({
		default: _default$s
	}, '__esModule', {value: true});

	const error$g = {
	    message: ({ schemaCode }) => codegen.str `should match format "${schemaCode}"`,
	    params: ({ schemaCode }) => codegen._ `{format: ${schemaCode}}`,
	};
	const def$o = {
	    keyword: "format",
	    type: ["number", "string"],
	    schemaType: "string",
	    $data: true,
	    error: error$g,
	    code(cxt, ruleType) {
	        const { gen, data, $data, schema, schemaCode, it } = cxt;
	        const { opts, errSchemaPath, schemaEnv, self } = it;
	        if (!opts.validateFormats)
	            return;
	        if ($data)
	            validate$DataFormat();
	        else
	            validateFormat();
	        function validate$DataFormat() {
	            const fmts = gen.scopeValue("formats", {
	                ref: self.formats,
	                code: opts.code.formats,
	            });
	            const fDef = gen.const("fDef", codegen._ `${fmts}[${schemaCode}]`);
	            const fType = gen.let("fType");
	            const format = gen.let("format");
	            // TODO simplify
	            gen.if(codegen._ `typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, codegen._ `${fDef}.type || "string"`).assign(format, codegen._ `${fDef}.validate`), () => gen.assign(fType, codegen._ `"string"`).assign(format, fDef));
	            cxt.fail$data(codegen.or(unknownFmt(), invalidFmt()));
	            function unknownFmt() {
	                if (opts.strict === false)
	                    return codegen.nil;
	                return codegen._ `${schemaCode} && !${format}`;
	            }
	            function invalidFmt() {
	                const callFormat = schemaEnv.$async
	                    ? codegen._ `(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))`
	                    : codegen._ `${format}(${data})`;
	                const validData = codegen._ `(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
	                return codegen._ `${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
	            }
	        }
	        function validateFormat() {
	            const formatDef = self.formats[schema];
	            if (!formatDef) {
	                unknownFormat();
	                return;
	            }
	            if (formatDef === true)
	                return;
	            const [fmtType, format, fmtRef] = getFormat(formatDef);
	            if (fmtType === ruleType)
	                cxt.pass(validCondition());
	            function unknownFormat() {
	                if (opts.strict === false) {
	                    self.logger.warn(unknownMsg());
	                    return;
	                }
	                throw new Error(unknownMsg());
	                function unknownMsg() {
	                    return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
	                }
	            }
	            function getFormat(fmtDef) {
	                const fmt = gen.scopeValue("formats", {
	                    key: schema,
	                    ref: fmtDef,
	                    code: opts.code.formats ? codegen._ `${opts.code.formats}${codegen.getProperty(schema)}` : undefined,
	                });
	                if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
	                    return [fmtDef.type || "string", fmtDef.validate, codegen._ `${fmt}.validate`];
	                }
	                return ["string", fmtDef, fmt];
	            }
	            function validCondition() {
	                if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
	                    if (!schemaEnv.$async)
	                        throw new Error("async format in sync schema");
	                    return codegen._ `await ${fmtRef}(${data})`;
	                }
	                return typeof format == "function" ? codegen._ `${fmtRef}(${data})` : codegen._ `${fmtRef}.test(${data})`;
	            }
	        }
	    },
	};
	var _default$t = def$o;


	var format = /*#__PURE__*/Object.defineProperty({
		default: _default$t
	}, '__esModule', {value: true});

	const format$1 = [format.default];
	var _default$u = format$1;


	var format_2 = /*#__PURE__*/Object.defineProperty({
		default: _default$u
	}, '__esModule', {value: true});

	var metadata = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.contentVocabulary = exports.metadataVocabulary = void 0;
	exports.metadataVocabulary = [
	    "title",
	    "description",
	    "default",
	    "deprecated",
	    "readOnly",
	    "writeOnly",
	    "examples",
	];
	exports.contentVocabulary = [
	    "contentMediaType",
	    "contentEncoding",
	    "contentSchema",
	];

	});

	const draft7Vocabularies = [
	    core_1.default,
	    validation_1.default,
	    applicator_1.default,
	    format_2.default,
	    metadata.metadataVocabulary,
	    metadata.contentVocabulary,
	];
	var _default$v = draft7Vocabularies;


	var draft7 = /*#__PURE__*/Object.defineProperty({
		default: _default$v
	}, '__esModule', {value: true});

	var $schema = "http://json-schema.org/draft-07/schema#";
	var $id$1 = "http://json-schema.org/draft-07/schema#";
	var title = "Core schema meta-schema";
	var definitions = {
		schemaArray: {
			type: "array",
			minItems: 1,
			items: {
				$ref: "#"
			}
		},
		nonNegativeInteger: {
			type: "integer",
			minimum: 0
		},
		nonNegativeIntegerDefault0: {
			allOf: [
				{
					$ref: "#/definitions/nonNegativeInteger"
				},
				{
					"default": 0
				}
			]
		},
		simpleTypes: {
			"enum": [
				"array",
				"boolean",
				"integer",
				"null",
				"number",
				"object",
				"string"
			]
		},
		stringArray: {
			type: "array",
			items: {
				type: "string"
			},
			uniqueItems: true,
			"default": [
			]
		}
	};
	var type$1 = [
		"object",
		"boolean"
	];
	var properties$2 = {
		$id: {
			type: "string",
			format: "uri-reference"
		},
		$schema: {
			type: "string",
			format: "uri"
		},
		$ref: {
			type: "string",
			format: "uri-reference"
		},
		$comment: {
			type: "string"
		},
		title: {
			type: "string"
		},
		description: {
			type: "string"
		},
		"default": true,
		readOnly: {
			type: "boolean",
			"default": false
		},
		examples: {
			type: "array",
			items: true
		},
		multipleOf: {
			type: "number",
			exclusiveMinimum: 0
		},
		maximum: {
			type: "number"
		},
		exclusiveMaximum: {
			type: "number"
		},
		minimum: {
			type: "number"
		},
		exclusiveMinimum: {
			type: "number"
		},
		maxLength: {
			$ref: "#/definitions/nonNegativeInteger"
		},
		minLength: {
			$ref: "#/definitions/nonNegativeIntegerDefault0"
		},
		pattern: {
			type: "string",
			format: "regex"
		},
		additionalItems: {
			$ref: "#"
		},
		items: {
			anyOf: [
				{
					$ref: "#"
				},
				{
					$ref: "#/definitions/schemaArray"
				}
			],
			"default": true
		},
		maxItems: {
			$ref: "#/definitions/nonNegativeInteger"
		},
		minItems: {
			$ref: "#/definitions/nonNegativeIntegerDefault0"
		},
		uniqueItems: {
			type: "boolean",
			"default": false
		},
		contains: {
			$ref: "#"
		},
		maxProperties: {
			$ref: "#/definitions/nonNegativeInteger"
		},
		minProperties: {
			$ref: "#/definitions/nonNegativeIntegerDefault0"
		},
		required: {
			$ref: "#/definitions/stringArray"
		},
		additionalProperties: {
			$ref: "#"
		},
		definitions: {
			type: "object",
			additionalProperties: {
				$ref: "#"
			},
			"default": {
			}
		},
		properties: {
			type: "object",
			additionalProperties: {
				$ref: "#"
			},
			"default": {
			}
		},
		patternProperties: {
			type: "object",
			additionalProperties: {
				$ref: "#"
			},
			propertyNames: {
				format: "regex"
			},
			"default": {
			}
		},
		dependencies: {
			type: "object",
			additionalProperties: {
				anyOf: [
					{
						$ref: "#"
					},
					{
						$ref: "#/definitions/stringArray"
					}
				]
			}
		},
		propertyNames: {
			$ref: "#"
		},
		"const": true,
		"enum": {
			type: "array",
			items: true,
			minItems: 1,
			uniqueItems: true
		},
		type: {
			anyOf: [
				{
					$ref: "#/definitions/simpleTypes"
				},
				{
					type: "array",
					items: {
						$ref: "#/definitions/simpleTypes"
					},
					minItems: 1,
					uniqueItems: true
				}
			]
		},
		format: {
			type: "string"
		},
		contentMediaType: {
			type: "string"
		},
		contentEncoding: {
			type: "string"
		},
		"if": {
			$ref: "#"
		},
		then: {
			$ref: "#"
		},
		"else": {
			$ref: "#"
		},
		allOf: {
			$ref: "#/definitions/schemaArray"
		},
		anyOf: {
			$ref: "#/definitions/schemaArray"
		},
		oneOf: {
			$ref: "#/definitions/schemaArray"
		},
		not: {
			$ref: "#"
		}
	};
	var draft7MetaSchema = {
		$schema: $schema,
		$id: $id$1,
		title: title,
		definitions: definitions,
		type: type$1,
		properties: properties$2,
		"default": true
	};

	var ajv = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;

	exports.KeywordCxt = context.default;

	Object.defineProperty(exports, "_", { enumerable: true, get: function () { return codegen._; } });
	Object.defineProperty(exports, "str", { enumerable: true, get: function () { return codegen.str; } });
	Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return codegen.stringify; } });
	Object.defineProperty(exports, "nil", { enumerable: true, get: function () { return codegen.nil; } });
	Object.defineProperty(exports, "Name", { enumerable: true, get: function () { return codegen.Name; } });
	Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function () { return codegen.CodeGen; } });



	const META_SUPPORT_DATA = ["/properties"];
	const META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
	class Ajv extends core.default {
	    _addVocabularies() {
	        super._addVocabularies();
	        draft7.default.forEach((v) => this.addVocabulary(v));
	    }
	    _addDefaultMetaSchema() {
	        super._addDefaultMetaSchema();
	        const { $data, meta } = this.opts;
	        if (!meta)
	            return;
	        const metaSchema = $data
	            ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA)
	            : draft7MetaSchema;
	        this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
	        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
	    }
	    defaultMeta() {
	        return (this.opts.defaultMeta =
	            super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined));
	    }
	}
	exports.default = Ajv;

	});

	var Ajv = /*@__PURE__*/getDefaultExportFromCjs(ajv);

	/* ############################################################################
	The MIT License (MIT)

	Copyright (c) 2019 Van Schroeder
	Copyright (c) 2019 Webfreshener, LLC

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	############################################################################ */
	const _validators = new WeakMap();
	const _ajvRef = new WeakMap();
	const _idRef = new WeakMap();
	/**
	 *
	 * @param $ajv
	 * @param schema
	 * @param schemaId
	 */
	const addSchema = ($ajv, schema, schemaId) => {
	    if (!schemaId) {
	        schemaId = AjvWrapper.getSchemaID(schema);
	    }

	    // try {
	        if (_idRef.get($ajv).indexOf(schemaId) === -1) {
	            _idRef.get($ajv).splice(_idRef.get($ajv).length, 0, schemaId);

	            $ajv.addSchema(schema, schemaId);
	            return true
	        }
	    // } catch (e) {
	    //    return
	    // }
	};

	const addMetaSchema = ($ajv, schema) => {
	    $ajv.addMetaSchema(schema);
	};

	/**
	 * Wrapper for Ajv JSON-PropertiesModel Validator
	 * @private
	 */
	class AjvWrapper {
	    /**
	     * @constructor
	     * @param schemas
	     * @param ajvOptions
	     */
	    constructor(schemas, ajvOptions = {}) {
	        if (_validators.get(this) === void (0)) {
	            _validators.set(this, {});
	        }

	        // applies user specified options over our default Ajv Options
	        const opts = Object.assign(_ajvOptions, ajvOptions);

	        // makes user defined options object accessible for evaluation
	        Object.defineProperty(this, "options", {
	            get: () => opts,
	            enumerable: true,
	        });

	        // declares default path of root# for validation queries
	        this.path = "root#";

	        // appends trailing "#" to end of "id" string if missing
	        const _procID = (id) => id.match(/#+$/) === null ? `${id}#` : id;

	        // processes schema "id" for JSON-schemas =< v04 and >= v06
	        const _procSchema = (_s) => {
	            const _key = ["$id","id"].find((k) => _s.hasOwnProperty(`${k}`));
	            if (_key) {
	                _s[_key] = _procID(_s[_key]);
	            }
	            return _s;
	        };

	        // evaluates contents of schemas to normalize "id" attributes to have trailing "#"
	        if ((typeof schemas) === "object") {
	            if (schemas.hasOwnProperty("schemas")) {
	                if (Array.isArray(schemas.schemas)) {
	                    schemas.schemas = schemas.schemas.map(_procSchema);
	                } else {
	                    schemas.schemas = _procSchema(schemas.schemas);

	                }
	            } else {
	                if (Array.isArray(schemas)) {
	                    schemas = schemas.map(_procSchema);
	                } else {
	                    schemas = _procSchema(schemas);
	                }
	            }
	        }

	        // initializes Ajv instance for this Doc and stores it to WeakMap
	        _ajvRef.set(this, createAJV(schemas, opts));

	        // accept no further modifications to this object
	        Object.seal(this);
	    }

	    /**
	     * Getter for captive Ajv validator
	     * -- use this for Ajv API Methods
	     * @returns {ajv}
	     */
	    get $ajv() {
	        return _ajvRef.get(this);
	    }

	    /**
	     * Executes validator at PropertiesModel $model `path` against `value`
	     * @param {string} path
	     * @param {any} value
	     */
	    exec(path, value) {
	        // appends id ref to path
	        if (path.indexOf("#") < 0) {
	            path = `${this.path}${path}`;
	        }

	        let _res = false;

	        try {
	            _res = this.$ajv.validate(path, value);
	            if (this.$ajv.errors) {
	                return false; //JSON.stringify(this.$ajv.errors);
	            }
	        } catch (e) {
	            return e.toString();
	        }


	        return _res;
	    }

	    /**
	     *
	     * @param schema
	     * @param schemaId
	     */
	    addSchema(schema, schemaId=false) {
	        addSchema(this, schema, schemaId);
	        return this;
	    }

	    /**
	     * retrieves ID attribute from schema
	     * @param schema
	     * @returns {string}
	     */
	    static getSchemaID(schema) {
	        const id = ["$id", "id"].filter((id) => schema.hasOwnProperty(id));
	        return id.length ? schema[id[0]] : "root#";
	    }
	}

	/**
	 *
	 * @param $ajv
	 * @param _s
	 * @private
	 */
	const _metaTest = ($ajv, _s) => {
	    if (_s.hasOwnProperty("meta")) {
	        if (Array.isArray(_s.meta)) {
	            _s.meta.forEach((meta) => {
	                addMetaSchema($ajv, meta);
	            });
	        }
	    }
	};

	/**
	 *
	 * @param schemas
	 * @param opts
	 * @returns {ajv | ajv.Ajv}
	 */
	const createAJV = (schemas, opts) => {
	    const _ajv = new Ajv(opts);
	    _idRef.set(_ajv, []);
	    if (schemas) {
	        _metaTest(_ajv, schemas);
	        // todo: review performance of addSchema
	        schemas = schemas["schemas"] ? schemas.schemas : schemas;
	        if (Array.isArray(schemas)) {
	            schemas.forEach((schema) => {
	                // _metaTest(_ajv, schema);
	                addSchema(_ajv, schema);
	            });
	        } else {
	            if ((typeof schemas).match(/^(object|boolean)$/)) {
	                _metaTest(_ajv, schemas);
	                addSchema(_ajv, schemas);
	            }
	        }
	    }

	    return _ajv;
	};

	/**
	 * AJV Options Config in it's entirely for reference
	 * only TxPipe specific option changes are enabled
	 * @type {*}
	 * @private
	 */
	const _ajvOptions = {
	    // // validation and reporting options:
	    // $data:            false,
	    // allErrors:        true,
	    allowUnionTypes:     true,
	    // verbose:          true,
	    // $comment:         false, // NEW in Ajv version 6.0
	    // uniqueItems:      true,
	    // unicode:          true,
	    // format:           'fast',
	    // formats:          {},
	    // unknownFormats:   true,
	    // schemas:          {},
	    // logger:           undefined,
	    // // referenced schema options:
	    // schemaId: 'auto',
	    // missingRefs:      true,
	    // loadSchema:       undefined, // function(uri: string): Promise {}
	    // // options to modify validated data:
	    removeAdditional: false,
	    // useDefaults: true,
	    // coerceTypes:      false,
	    // // asynchronous validation options:
	    // transpile:        undefined, // requires ajv-async package
	    // // advanced options:
	    // meta:             true,
	    // validateSchema:   true,
	    // addUsedSchema:    true,
	    // inlineRefs:       true,
	    // passContext:      false,
	    // loopRequired:     Infinity,
	    // ownProperties:    false,
	    // multipleOfPrecision: false,
	    // errorDataPath:    'object', // deprecated
	    // messages:         true,
	    // sourceCode:       false,
	    // processCode:      undefined, // function (str: string): string {}
	    // cache:            new Cache,
	    // serialize:        undefined
	};

	/*! *****************************************************************************
	Copyright (c) Microsoft Corporation.

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
	PERFORMANCE OF THIS SOFTWARE.
	***************************************************************************** */
	/* global Reflect, Promise */

	var extendStatics = function(d, b) {
	    extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return extendStatics(d, b);
	};

	function __extends(d, b) {
	    extendStatics(d, b);
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	}

	var __assign = function() {
	    __assign = Object.assign || function __assign(t) {
	        for (var s, i = 1, n = arguments.length; i < n; i++) {
	            s = arguments[i];
	            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
	        }
	        return t;
	    };
	    return __assign.apply(this, arguments);
	};

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function isFunction(x) {
	    return typeof x === 'function';
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var _enable_super_gross_mode_that_will_cause_bad_things = false;
	var config = {
	    Promise: undefined,
	    set useDeprecatedSynchronousErrorHandling(value) {
	        if (value) {
	            var error = /*@__PURE__*/ new Error();
	            /*@__PURE__*/ console.warn('DEPRECATED! RxJS was set to use deprecated synchronous error handling behavior by code at: \n' + error.stack);
	        }
	        _enable_super_gross_mode_that_will_cause_bad_things = value;
	    },
	    get useDeprecatedSynchronousErrorHandling() {
	        return _enable_super_gross_mode_that_will_cause_bad_things;
	    },
	};

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function hostReportError(err) {
	    setTimeout(function () { throw err; }, 0);
	}

	/** PURE_IMPORTS_START _config,_util_hostReportError PURE_IMPORTS_END */
	var empty = {
	    closed: true,
	    next: function (value) { },
	    error: function (err) {
	        if (config.useDeprecatedSynchronousErrorHandling) {
	            throw err;
	        }
	        else {
	            hostReportError(err);
	        }
	    },
	    complete: function () { }
	};

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var isArray = /*@__PURE__*/ (function () { return Array.isArray || (function (x) { return x && typeof x.length === 'number'; }); })();

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function isObject(x) {
	    return x !== null && typeof x === 'object';
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var UnsubscriptionErrorImpl = /*@__PURE__*/ (function () {
	    function UnsubscriptionErrorImpl(errors) {
	        Error.call(this);
	        this.message = errors ?
	            errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ') : '';
	        this.name = 'UnsubscriptionError';
	        this.errors = errors;
	        return this;
	    }
	    UnsubscriptionErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
	    return UnsubscriptionErrorImpl;
	})();
	var UnsubscriptionError = UnsubscriptionErrorImpl;

	/** PURE_IMPORTS_START _util_isArray,_util_isObject,_util_isFunction,_util_UnsubscriptionError PURE_IMPORTS_END */
	var Subscription = /*@__PURE__*/ (function () {
	    function Subscription(unsubscribe) {
	        this.closed = false;
	        this._parentOrParents = null;
	        this._subscriptions = null;
	        if (unsubscribe) {
	            this._ctorUnsubscribe = true;
	            this._unsubscribe = unsubscribe;
	        }
	    }
	    Subscription.prototype.unsubscribe = function () {
	        var errors;
	        if (this.closed) {
	            return;
	        }
	        var _a = this, _parentOrParents = _a._parentOrParents, _ctorUnsubscribe = _a._ctorUnsubscribe, _unsubscribe = _a._unsubscribe, _subscriptions = _a._subscriptions;
	        this.closed = true;
	        this._parentOrParents = null;
	        this._subscriptions = null;
	        if (_parentOrParents instanceof Subscription) {
	            _parentOrParents.remove(this);
	        }
	        else if (_parentOrParents !== null) {
	            for (var index = 0; index < _parentOrParents.length; ++index) {
	                var parent_1 = _parentOrParents[index];
	                parent_1.remove(this);
	            }
	        }
	        if (isFunction(_unsubscribe)) {
	            if (_ctorUnsubscribe) {
	                this._unsubscribe = undefined;
	            }
	            try {
	                _unsubscribe.call(this);
	            }
	            catch (e) {
	                errors = e instanceof UnsubscriptionError ? flattenUnsubscriptionErrors(e.errors) : [e];
	            }
	        }
	        if (isArray(_subscriptions)) {
	            var index = -1;
	            var len = _subscriptions.length;
	            while (++index < len) {
	                var sub = _subscriptions[index];
	                if (isObject(sub)) {
	                    try {
	                        sub.unsubscribe();
	                    }
	                    catch (e) {
	                        errors = errors || [];
	                        if (e instanceof UnsubscriptionError) {
	                            errors = errors.concat(flattenUnsubscriptionErrors(e.errors));
	                        }
	                        else {
	                            errors.push(e);
	                        }
	                    }
	                }
	            }
	        }
	        if (errors) {
	            throw new UnsubscriptionError(errors);
	        }
	    };
	    Subscription.prototype.add = function (teardown) {
	        var subscription = teardown;
	        if (!teardown) {
	            return Subscription.EMPTY;
	        }
	        switch (typeof teardown) {
	            case 'function':
	                subscription = new Subscription(teardown);
	            case 'object':
	                if (subscription === this || subscription.closed || typeof subscription.unsubscribe !== 'function') {
	                    return subscription;
	                }
	                else if (this.closed) {
	                    subscription.unsubscribe();
	                    return subscription;
	                }
	                else if (!(subscription instanceof Subscription)) {
	                    var tmp = subscription;
	                    subscription = new Subscription();
	                    subscription._subscriptions = [tmp];
	                }
	                break;
	            default: {
	                throw new Error('unrecognized teardown ' + teardown + ' added to Subscription.');
	            }
	        }
	        var _parentOrParents = subscription._parentOrParents;
	        if (_parentOrParents === null) {
	            subscription._parentOrParents = this;
	        }
	        else if (_parentOrParents instanceof Subscription) {
	            if (_parentOrParents === this) {
	                return subscription;
	            }
	            subscription._parentOrParents = [_parentOrParents, this];
	        }
	        else if (_parentOrParents.indexOf(this) === -1) {
	            _parentOrParents.push(this);
	        }
	        else {
	            return subscription;
	        }
	        var subscriptions = this._subscriptions;
	        if (subscriptions === null) {
	            this._subscriptions = [subscription];
	        }
	        else {
	            subscriptions.push(subscription);
	        }
	        return subscription;
	    };
	    Subscription.prototype.remove = function (subscription) {
	        var subscriptions = this._subscriptions;
	        if (subscriptions) {
	            var subscriptionIndex = subscriptions.indexOf(subscription);
	            if (subscriptionIndex !== -1) {
	                subscriptions.splice(subscriptionIndex, 1);
	            }
	        }
	    };
	    Subscription.EMPTY = (function (empty) {
	        empty.closed = true;
	        return empty;
	    }(new Subscription()));
	    return Subscription;
	}());
	function flattenUnsubscriptionErrors(errors) {
	    return errors.reduce(function (errs, err) { return errs.concat((err instanceof UnsubscriptionError) ? err.errors : err); }, []);
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var rxSubscriber = /*@__PURE__*/ (function () {
	    return typeof Symbol === 'function'
	        ? /*@__PURE__*/ Symbol('rxSubscriber')
	        : '@@rxSubscriber_' + /*@__PURE__*/ Math.random();
	})();

	/** PURE_IMPORTS_START tslib,_util_isFunction,_Observer,_Subscription,_internal_symbol_rxSubscriber,_config,_util_hostReportError PURE_IMPORTS_END */
	var Subscriber = /*@__PURE__*/ (function (_super) {
	    __extends(Subscriber, _super);
	    function Subscriber(destinationOrNext, error, complete) {
	        var _this = _super.call(this) || this;
	        _this.syncErrorValue = null;
	        _this.syncErrorThrown = false;
	        _this.syncErrorThrowable = false;
	        _this.isStopped = false;
	        switch (arguments.length) {
	            case 0:
	                _this.destination = empty;
	                break;
	            case 1:
	                if (!destinationOrNext) {
	                    _this.destination = empty;
	                    break;
	                }
	                if (typeof destinationOrNext === 'object') {
	                    if (destinationOrNext instanceof Subscriber) {
	                        _this.syncErrorThrowable = destinationOrNext.syncErrorThrowable;
	                        _this.destination = destinationOrNext;
	                        destinationOrNext.add(_this);
	                    }
	                    else {
	                        _this.syncErrorThrowable = true;
	                        _this.destination = new SafeSubscriber(_this, destinationOrNext);
	                    }
	                    break;
	                }
	            default:
	                _this.syncErrorThrowable = true;
	                _this.destination = new SafeSubscriber(_this, destinationOrNext, error, complete);
	                break;
	        }
	        return _this;
	    }
	    Subscriber.prototype[rxSubscriber] = function () { return this; };
	    Subscriber.create = function (next, error, complete) {
	        var subscriber = new Subscriber(next, error, complete);
	        subscriber.syncErrorThrowable = false;
	        return subscriber;
	    };
	    Subscriber.prototype.next = function (value) {
	        if (!this.isStopped) {
	            this._next(value);
	        }
	    };
	    Subscriber.prototype.error = function (err) {
	        if (!this.isStopped) {
	            this.isStopped = true;
	            this._error(err);
	        }
	    };
	    Subscriber.prototype.complete = function () {
	        if (!this.isStopped) {
	            this.isStopped = true;
	            this._complete();
	        }
	    };
	    Subscriber.prototype.unsubscribe = function () {
	        if (this.closed) {
	            return;
	        }
	        this.isStopped = true;
	        _super.prototype.unsubscribe.call(this);
	    };
	    Subscriber.prototype._next = function (value) {
	        this.destination.next(value);
	    };
	    Subscriber.prototype._error = function (err) {
	        this.destination.error(err);
	        this.unsubscribe();
	    };
	    Subscriber.prototype._complete = function () {
	        this.destination.complete();
	        this.unsubscribe();
	    };
	    Subscriber.prototype._unsubscribeAndRecycle = function () {
	        var _parentOrParents = this._parentOrParents;
	        this._parentOrParents = null;
	        this.unsubscribe();
	        this.closed = false;
	        this.isStopped = false;
	        this._parentOrParents = _parentOrParents;
	        return this;
	    };
	    return Subscriber;
	}(Subscription));
	var SafeSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SafeSubscriber, _super);
	    function SafeSubscriber(_parentSubscriber, observerOrNext, error, complete) {
	        var _this = _super.call(this) || this;
	        _this._parentSubscriber = _parentSubscriber;
	        var next;
	        var context = _this;
	        if (isFunction(observerOrNext)) {
	            next = observerOrNext;
	        }
	        else if (observerOrNext) {
	            next = observerOrNext.next;
	            error = observerOrNext.error;
	            complete = observerOrNext.complete;
	            if (observerOrNext !== empty) {
	                context = Object.create(observerOrNext);
	                if (isFunction(context.unsubscribe)) {
	                    _this.add(context.unsubscribe.bind(context));
	                }
	                context.unsubscribe = _this.unsubscribe.bind(_this);
	            }
	        }
	        _this._context = context;
	        _this._next = next;
	        _this._error = error;
	        _this._complete = complete;
	        return _this;
	    }
	    SafeSubscriber.prototype.next = function (value) {
	        if (!this.isStopped && this._next) {
	            var _parentSubscriber = this._parentSubscriber;
	            if (!config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
	                this.__tryOrUnsub(this._next, value);
	            }
	            else if (this.__tryOrSetError(_parentSubscriber, this._next, value)) {
	                this.unsubscribe();
	            }
	        }
	    };
	    SafeSubscriber.prototype.error = function (err) {
	        if (!this.isStopped) {
	            var _parentSubscriber = this._parentSubscriber;
	            var useDeprecatedSynchronousErrorHandling = config.useDeprecatedSynchronousErrorHandling;
	            if (this._error) {
	                if (!useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
	                    this.__tryOrUnsub(this._error, err);
	                    this.unsubscribe();
	                }
	                else {
	                    this.__tryOrSetError(_parentSubscriber, this._error, err);
	                    this.unsubscribe();
	                }
	            }
	            else if (!_parentSubscriber.syncErrorThrowable) {
	                this.unsubscribe();
	                if (useDeprecatedSynchronousErrorHandling) {
	                    throw err;
	                }
	                hostReportError(err);
	            }
	            else {
	                if (useDeprecatedSynchronousErrorHandling) {
	                    _parentSubscriber.syncErrorValue = err;
	                    _parentSubscriber.syncErrorThrown = true;
	                }
	                else {
	                    hostReportError(err);
	                }
	                this.unsubscribe();
	            }
	        }
	    };
	    SafeSubscriber.prototype.complete = function () {
	        var _this = this;
	        if (!this.isStopped) {
	            var _parentSubscriber = this._parentSubscriber;
	            if (this._complete) {
	                var wrappedComplete = function () { return _this._complete.call(_this._context); };
	                if (!config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
	                    this.__tryOrUnsub(wrappedComplete);
	                    this.unsubscribe();
	                }
	                else {
	                    this.__tryOrSetError(_parentSubscriber, wrappedComplete);
	                    this.unsubscribe();
	                }
	            }
	            else {
	                this.unsubscribe();
	            }
	        }
	    };
	    SafeSubscriber.prototype.__tryOrUnsub = function (fn, value) {
	        try {
	            fn.call(this._context, value);
	        }
	        catch (err) {
	            this.unsubscribe();
	            if (config.useDeprecatedSynchronousErrorHandling) {
	                throw err;
	            }
	            else {
	                hostReportError(err);
	            }
	        }
	    };
	    SafeSubscriber.prototype.__tryOrSetError = function (parent, fn, value) {
	        if (!config.useDeprecatedSynchronousErrorHandling) {
	            throw new Error('bad call');
	        }
	        try {
	            fn.call(this._context, value);
	        }
	        catch (err) {
	            if (config.useDeprecatedSynchronousErrorHandling) {
	                parent.syncErrorValue = err;
	                parent.syncErrorThrown = true;
	                return true;
	            }
	            else {
	                hostReportError(err);
	                return true;
	            }
	        }
	        return false;
	    };
	    SafeSubscriber.prototype._unsubscribe = function () {
	        var _parentSubscriber = this._parentSubscriber;
	        this._context = null;
	        this._parentSubscriber = null;
	        _parentSubscriber.unsubscribe();
	    };
	    return SafeSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _Subscriber PURE_IMPORTS_END */
	function canReportError(observer) {
	    while (observer) {
	        var _a = observer, closed_1 = _a.closed, destination = _a.destination, isStopped = _a.isStopped;
	        if (closed_1 || isStopped) {
	            return false;
	        }
	        else if (destination && destination instanceof Subscriber) {
	            observer = destination;
	        }
	        else {
	            observer = null;
	        }
	    }
	    return true;
	}

	/** PURE_IMPORTS_START _Subscriber,_symbol_rxSubscriber,_Observer PURE_IMPORTS_END */
	function toSubscriber(nextOrObserver, error, complete) {
	    if (nextOrObserver) {
	        if (nextOrObserver instanceof Subscriber) {
	            return nextOrObserver;
	        }
	        if (nextOrObserver[rxSubscriber]) {
	            return nextOrObserver[rxSubscriber]();
	        }
	    }
	    if (!nextOrObserver && !error && !complete) {
	        return new Subscriber(empty);
	    }
	    return new Subscriber(nextOrObserver, error, complete);
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var observable = /*@__PURE__*/ (function () { return typeof Symbol === 'function' && Symbol.observable || '@@observable'; })();

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function identity(x) {
	    return x;
	}

	/** PURE_IMPORTS_START _identity PURE_IMPORTS_END */
	function pipe() {
	    var fns = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        fns[_i] = arguments[_i];
	    }
	    return pipeFromArray(fns);
	}
	function pipeFromArray(fns) {
	    if (fns.length === 0) {
	        return identity;
	    }
	    if (fns.length === 1) {
	        return fns[0];
	    }
	    return function piped(input) {
	        return fns.reduce(function (prev, fn) { return fn(prev); }, input);
	    };
	}

	/** PURE_IMPORTS_START _util_canReportError,_util_toSubscriber,_symbol_observable,_util_pipe,_config PURE_IMPORTS_END */
	var Observable = /*@__PURE__*/ (function () {
	    function Observable(subscribe) {
	        this._isScalar = false;
	        if (subscribe) {
	            this._subscribe = subscribe;
	        }
	    }
	    Observable.prototype.lift = function (operator) {
	        var observable = new Observable();
	        observable.source = this;
	        observable.operator = operator;
	        return observable;
	    };
	    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
	        var operator = this.operator;
	        var sink = toSubscriber(observerOrNext, error, complete);
	        if (operator) {
	            sink.add(operator.call(sink, this.source));
	        }
	        else {
	            sink.add(this.source || (config.useDeprecatedSynchronousErrorHandling && !sink.syncErrorThrowable) ?
	                this._subscribe(sink) :
	                this._trySubscribe(sink));
	        }
	        if (config.useDeprecatedSynchronousErrorHandling) {
	            if (sink.syncErrorThrowable) {
	                sink.syncErrorThrowable = false;
	                if (sink.syncErrorThrown) {
	                    throw sink.syncErrorValue;
	                }
	            }
	        }
	        return sink;
	    };
	    Observable.prototype._trySubscribe = function (sink) {
	        try {
	            return this._subscribe(sink);
	        }
	        catch (err) {
	            if (config.useDeprecatedSynchronousErrorHandling) {
	                sink.syncErrorThrown = true;
	                sink.syncErrorValue = err;
	            }
	            if (canReportError(sink)) {
	                sink.error(err);
	            }
	            else {
	                console.warn(err);
	            }
	        }
	    };
	    Observable.prototype.forEach = function (next, promiseCtor) {
	        var _this = this;
	        promiseCtor = getPromiseCtor(promiseCtor);
	        return new promiseCtor(function (resolve, reject) {
	            var subscription;
	            subscription = _this.subscribe(function (value) {
	                try {
	                    next(value);
	                }
	                catch (err) {
	                    reject(err);
	                    if (subscription) {
	                        subscription.unsubscribe();
	                    }
	                }
	            }, reject, resolve);
	        });
	    };
	    Observable.prototype._subscribe = function (subscriber) {
	        var source = this.source;
	        return source && source.subscribe(subscriber);
	    };
	    Observable.prototype[observable] = function () {
	        return this;
	    };
	    Observable.prototype.pipe = function () {
	        var operations = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            operations[_i] = arguments[_i];
	        }
	        if (operations.length === 0) {
	            return this;
	        }
	        return pipeFromArray(operations)(this);
	    };
	    Observable.prototype.toPromise = function (promiseCtor) {
	        var _this = this;
	        promiseCtor = getPromiseCtor(promiseCtor);
	        return new promiseCtor(function (resolve, reject) {
	            var value;
	            _this.subscribe(function (x) { return value = x; }, function (err) { return reject(err); }, function () { return resolve(value); });
	        });
	    };
	    Observable.create = function (subscribe) {
	        return new Observable(subscribe);
	    };
	    return Observable;
	}());
	function getPromiseCtor(promiseCtor) {
	    if (!promiseCtor) {
	        promiseCtor = config.Promise || Promise;
	    }
	    if (!promiseCtor) {
	        throw new Error('no Promise impl found');
	    }
	    return promiseCtor;
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var ObjectUnsubscribedErrorImpl = /*@__PURE__*/ (function () {
	    function ObjectUnsubscribedErrorImpl() {
	        Error.call(this);
	        this.message = 'object unsubscribed';
	        this.name = 'ObjectUnsubscribedError';
	        return this;
	    }
	    ObjectUnsubscribedErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
	    return ObjectUnsubscribedErrorImpl;
	})();
	var ObjectUnsubscribedError = ObjectUnsubscribedErrorImpl;

	/** PURE_IMPORTS_START tslib,_Subscription PURE_IMPORTS_END */
	var SubjectSubscription = /*@__PURE__*/ (function (_super) {
	    __extends(SubjectSubscription, _super);
	    function SubjectSubscription(subject, subscriber) {
	        var _this = _super.call(this) || this;
	        _this.subject = subject;
	        _this.subscriber = subscriber;
	        _this.closed = false;
	        return _this;
	    }
	    SubjectSubscription.prototype.unsubscribe = function () {
	        if (this.closed) {
	            return;
	        }
	        this.closed = true;
	        var subject = this.subject;
	        var observers = subject.observers;
	        this.subject = null;
	        if (!observers || observers.length === 0 || subject.isStopped || subject.closed) {
	            return;
	        }
	        var subscriberIndex = observers.indexOf(this.subscriber);
	        if (subscriberIndex !== -1) {
	            observers.splice(subscriberIndex, 1);
	        }
	    };
	    return SubjectSubscription;
	}(Subscription));

	/** PURE_IMPORTS_START tslib,_Observable,_Subscriber,_Subscription,_util_ObjectUnsubscribedError,_SubjectSubscription,_internal_symbol_rxSubscriber PURE_IMPORTS_END */
	var SubjectSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SubjectSubscriber, _super);
	    function SubjectSubscriber(destination) {
	        var _this = _super.call(this, destination) || this;
	        _this.destination = destination;
	        return _this;
	    }
	    return SubjectSubscriber;
	}(Subscriber));
	var Subject = /*@__PURE__*/ (function (_super) {
	    __extends(Subject, _super);
	    function Subject() {
	        var _this = _super.call(this) || this;
	        _this.observers = [];
	        _this.closed = false;
	        _this.isStopped = false;
	        _this.hasError = false;
	        _this.thrownError = null;
	        return _this;
	    }
	    Subject.prototype[rxSubscriber] = function () {
	        return new SubjectSubscriber(this);
	    };
	    Subject.prototype.lift = function (operator) {
	        var subject = new AnonymousSubject(this, this);
	        subject.operator = operator;
	        return subject;
	    };
	    Subject.prototype.next = function (value) {
	        if (this.closed) {
	            throw new ObjectUnsubscribedError();
	        }
	        if (!this.isStopped) {
	            var observers = this.observers;
	            var len = observers.length;
	            var copy = observers.slice();
	            for (var i = 0; i < len; i++) {
	                copy[i].next(value);
	            }
	        }
	    };
	    Subject.prototype.error = function (err) {
	        if (this.closed) {
	            throw new ObjectUnsubscribedError();
	        }
	        this.hasError = true;
	        this.thrownError = err;
	        this.isStopped = true;
	        var observers = this.observers;
	        var len = observers.length;
	        var copy = observers.slice();
	        for (var i = 0; i < len; i++) {
	            copy[i].error(err);
	        }
	        this.observers.length = 0;
	    };
	    Subject.prototype.complete = function () {
	        if (this.closed) {
	            throw new ObjectUnsubscribedError();
	        }
	        this.isStopped = true;
	        var observers = this.observers;
	        var len = observers.length;
	        var copy = observers.slice();
	        for (var i = 0; i < len; i++) {
	            copy[i].complete();
	        }
	        this.observers.length = 0;
	    };
	    Subject.prototype.unsubscribe = function () {
	        this.isStopped = true;
	        this.closed = true;
	        this.observers = null;
	    };
	    Subject.prototype._trySubscribe = function (subscriber) {
	        if (this.closed) {
	            throw new ObjectUnsubscribedError();
	        }
	        else {
	            return _super.prototype._trySubscribe.call(this, subscriber);
	        }
	    };
	    Subject.prototype._subscribe = function (subscriber) {
	        if (this.closed) {
	            throw new ObjectUnsubscribedError();
	        }
	        else if (this.hasError) {
	            subscriber.error(this.thrownError);
	            return Subscription.EMPTY;
	        }
	        else if (this.isStopped) {
	            subscriber.complete();
	            return Subscription.EMPTY;
	        }
	        else {
	            this.observers.push(subscriber);
	            return new SubjectSubscription(this, subscriber);
	        }
	    };
	    Subject.prototype.asObservable = function () {
	        var observable = new Observable();
	        observable.source = this;
	        return observable;
	    };
	    Subject.create = function (destination, source) {
	        return new AnonymousSubject(destination, source);
	    };
	    return Subject;
	}(Observable));
	var AnonymousSubject = /*@__PURE__*/ (function (_super) {
	    __extends(AnonymousSubject, _super);
	    function AnonymousSubject(destination, source) {
	        var _this = _super.call(this) || this;
	        _this.destination = destination;
	        _this.source = source;
	        return _this;
	    }
	    AnonymousSubject.prototype.next = function (value) {
	        var destination = this.destination;
	        if (destination && destination.next) {
	            destination.next(value);
	        }
	    };
	    AnonymousSubject.prototype.error = function (err) {
	        var destination = this.destination;
	        if (destination && destination.error) {
	            this.destination.error(err);
	        }
	    };
	    AnonymousSubject.prototype.complete = function () {
	        var destination = this.destination;
	        if (destination && destination.complete) {
	            this.destination.complete();
	        }
	    };
	    AnonymousSubject.prototype._subscribe = function (subscriber) {
	        var source = this.source;
	        if (source) {
	            return this.source.subscribe(subscriber);
	        }
	        else {
	            return Subscription.EMPTY;
	        }
	    };
	    return AnonymousSubject;
	}(Subject));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function refCount() {
	    return function refCountOperatorFunction(source) {
	        return source.lift(new RefCountOperator(source));
	    };
	}
	var RefCountOperator = /*@__PURE__*/ (function () {
	    function RefCountOperator(connectable) {
	        this.connectable = connectable;
	    }
	    RefCountOperator.prototype.call = function (subscriber, source) {
	        var connectable = this.connectable;
	        connectable._refCount++;
	        var refCounter = new RefCountSubscriber(subscriber, connectable);
	        var subscription = source.subscribe(refCounter);
	        if (!refCounter.closed) {
	            refCounter.connection = connectable.connect();
	        }
	        return subscription;
	    };
	    return RefCountOperator;
	}());
	var RefCountSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(RefCountSubscriber, _super);
	    function RefCountSubscriber(destination, connectable) {
	        var _this = _super.call(this, destination) || this;
	        _this.connectable = connectable;
	        return _this;
	    }
	    RefCountSubscriber.prototype._unsubscribe = function () {
	        var connectable = this.connectable;
	        if (!connectable) {
	            this.connection = null;
	            return;
	        }
	        this.connectable = null;
	        var refCount = connectable._refCount;
	        if (refCount <= 0) {
	            this.connection = null;
	            return;
	        }
	        connectable._refCount = refCount - 1;
	        if (refCount > 1) {
	            this.connection = null;
	            return;
	        }
	        var connection = this.connection;
	        var sharedConnection = connectable._connection;
	        this.connection = null;
	        if (sharedConnection && (!connection || sharedConnection === connection)) {
	            sharedConnection.unsubscribe();
	        }
	    };
	    return RefCountSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subject,_Observable,_Subscriber,_Subscription,_operators_refCount PURE_IMPORTS_END */
	var ConnectableObservable = /*@__PURE__*/ (function (_super) {
	    __extends(ConnectableObservable, _super);
	    function ConnectableObservable(source, subjectFactory) {
	        var _this = _super.call(this) || this;
	        _this.source = source;
	        _this.subjectFactory = subjectFactory;
	        _this._refCount = 0;
	        _this._isComplete = false;
	        return _this;
	    }
	    ConnectableObservable.prototype._subscribe = function (subscriber) {
	        return this.getSubject().subscribe(subscriber);
	    };
	    ConnectableObservable.prototype.getSubject = function () {
	        var subject = this._subject;
	        if (!subject || subject.isStopped) {
	            this._subject = this.subjectFactory();
	        }
	        return this._subject;
	    };
	    ConnectableObservable.prototype.connect = function () {
	        var connection = this._connection;
	        if (!connection) {
	            this._isComplete = false;
	            connection = this._connection = new Subscription();
	            connection.add(this.source
	                .subscribe(new ConnectableSubscriber(this.getSubject(), this)));
	            if (connection.closed) {
	                this._connection = null;
	                connection = Subscription.EMPTY;
	            }
	        }
	        return connection;
	    };
	    ConnectableObservable.prototype.refCount = function () {
	        return refCount()(this);
	    };
	    return ConnectableObservable;
	}(Observable));
	var connectableObservableDescriptor = /*@__PURE__*/ (function () {
	    var connectableProto = ConnectableObservable.prototype;
	    return {
	        operator: { value: null },
	        _refCount: { value: 0, writable: true },
	        _subject: { value: null, writable: true },
	        _connection: { value: null, writable: true },
	        _subscribe: { value: connectableProto._subscribe },
	        _isComplete: { value: connectableProto._isComplete, writable: true },
	        getSubject: { value: connectableProto.getSubject },
	        connect: { value: connectableProto.connect },
	        refCount: { value: connectableProto.refCount }
	    };
	})();
	var ConnectableSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(ConnectableSubscriber, _super);
	    function ConnectableSubscriber(destination, connectable) {
	        var _this = _super.call(this, destination) || this;
	        _this.connectable = connectable;
	        return _this;
	    }
	    ConnectableSubscriber.prototype._error = function (err) {
	        this._unsubscribe();
	        _super.prototype._error.call(this, err);
	    };
	    ConnectableSubscriber.prototype._complete = function () {
	        this.connectable._isComplete = true;
	        this._unsubscribe();
	        _super.prototype._complete.call(this);
	    };
	    ConnectableSubscriber.prototype._unsubscribe = function () {
	        var connectable = this.connectable;
	        if (connectable) {
	            this.connectable = null;
	            var connection = connectable._connection;
	            connectable._refCount = 0;
	            connectable._subject = null;
	            connectable._connection = null;
	            if (connection) {
	                connection.unsubscribe();
	            }
	        }
	    };
	    return ConnectableSubscriber;
	}(SubjectSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber,_Subscription,_Observable,_Subject PURE_IMPORTS_END */
	function groupBy(keySelector, elementSelector, durationSelector, subjectSelector) {
	    return function (source) {
	        return source.lift(new GroupByOperator(keySelector, elementSelector, durationSelector, subjectSelector));
	    };
	}
	var GroupByOperator = /*@__PURE__*/ (function () {
	    function GroupByOperator(keySelector, elementSelector, durationSelector, subjectSelector) {
	        this.keySelector = keySelector;
	        this.elementSelector = elementSelector;
	        this.durationSelector = durationSelector;
	        this.subjectSelector = subjectSelector;
	    }
	    GroupByOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new GroupBySubscriber(subscriber, this.keySelector, this.elementSelector, this.durationSelector, this.subjectSelector));
	    };
	    return GroupByOperator;
	}());
	var GroupBySubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(GroupBySubscriber, _super);
	    function GroupBySubscriber(destination, keySelector, elementSelector, durationSelector, subjectSelector) {
	        var _this = _super.call(this, destination) || this;
	        _this.keySelector = keySelector;
	        _this.elementSelector = elementSelector;
	        _this.durationSelector = durationSelector;
	        _this.subjectSelector = subjectSelector;
	        _this.groups = null;
	        _this.attemptedToUnsubscribe = false;
	        _this.count = 0;
	        return _this;
	    }
	    GroupBySubscriber.prototype._next = function (value) {
	        var key;
	        try {
	            key = this.keySelector(value);
	        }
	        catch (err) {
	            this.error(err);
	            return;
	        }
	        this._group(value, key);
	    };
	    GroupBySubscriber.prototype._group = function (value, key) {
	        var groups = this.groups;
	        if (!groups) {
	            groups = this.groups = new Map();
	        }
	        var group = groups.get(key);
	        var element;
	        if (this.elementSelector) {
	            try {
	                element = this.elementSelector(value);
	            }
	            catch (err) {
	                this.error(err);
	            }
	        }
	        else {
	            element = value;
	        }
	        if (!group) {
	            group = (this.subjectSelector ? this.subjectSelector() : new Subject());
	            groups.set(key, group);
	            var groupedObservable = new GroupedObservable(key, group, this);
	            this.destination.next(groupedObservable);
	            if (this.durationSelector) {
	                var duration = void 0;
	                try {
	                    duration = this.durationSelector(new GroupedObservable(key, group));
	                }
	                catch (err) {
	                    this.error(err);
	                    return;
	                }
	                this.add(duration.subscribe(new GroupDurationSubscriber(key, group, this)));
	            }
	        }
	        if (!group.closed) {
	            group.next(element);
	        }
	    };
	    GroupBySubscriber.prototype._error = function (err) {
	        var groups = this.groups;
	        if (groups) {
	            groups.forEach(function (group, key) {
	                group.error(err);
	            });
	            groups.clear();
	        }
	        this.destination.error(err);
	    };
	    GroupBySubscriber.prototype._complete = function () {
	        var groups = this.groups;
	        if (groups) {
	            groups.forEach(function (group, key) {
	                group.complete();
	            });
	            groups.clear();
	        }
	        this.destination.complete();
	    };
	    GroupBySubscriber.prototype.removeGroup = function (key) {
	        this.groups.delete(key);
	    };
	    GroupBySubscriber.prototype.unsubscribe = function () {
	        if (!this.closed) {
	            this.attemptedToUnsubscribe = true;
	            if (this.count === 0) {
	                _super.prototype.unsubscribe.call(this);
	            }
	        }
	    };
	    return GroupBySubscriber;
	}(Subscriber));
	var GroupDurationSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(GroupDurationSubscriber, _super);
	    function GroupDurationSubscriber(key, group, parent) {
	        var _this = _super.call(this, group) || this;
	        _this.key = key;
	        _this.group = group;
	        _this.parent = parent;
	        return _this;
	    }
	    GroupDurationSubscriber.prototype._next = function (value) {
	        this.complete();
	    };
	    GroupDurationSubscriber.prototype._unsubscribe = function () {
	        var _a = this, parent = _a.parent, key = _a.key;
	        this.key = this.parent = null;
	        if (parent) {
	            parent.removeGroup(key);
	        }
	    };
	    return GroupDurationSubscriber;
	}(Subscriber));
	var GroupedObservable = /*@__PURE__*/ (function (_super) {
	    __extends(GroupedObservable, _super);
	    function GroupedObservable(key, groupSubject, refCountSubscription) {
	        var _this = _super.call(this) || this;
	        _this.key = key;
	        _this.groupSubject = groupSubject;
	        _this.refCountSubscription = refCountSubscription;
	        return _this;
	    }
	    GroupedObservable.prototype._subscribe = function (subscriber) {
	        var subscription = new Subscription();
	        var _a = this, refCountSubscription = _a.refCountSubscription, groupSubject = _a.groupSubject;
	        if (refCountSubscription && !refCountSubscription.closed) {
	            subscription.add(new InnerRefCountSubscription(refCountSubscription));
	        }
	        subscription.add(groupSubject.subscribe(subscriber));
	        return subscription;
	    };
	    return GroupedObservable;
	}(Observable));
	var InnerRefCountSubscription = /*@__PURE__*/ (function (_super) {
	    __extends(InnerRefCountSubscription, _super);
	    function InnerRefCountSubscription(parent) {
	        var _this = _super.call(this) || this;
	        _this.parent = parent;
	        parent.count++;
	        return _this;
	    }
	    InnerRefCountSubscription.prototype.unsubscribe = function () {
	        var parent = this.parent;
	        if (!parent.closed && !this.closed) {
	            _super.prototype.unsubscribe.call(this);
	            parent.count -= 1;
	            if (parent.count === 0 && parent.attemptedToUnsubscribe) {
	                parent.unsubscribe();
	            }
	        }
	    };
	    return InnerRefCountSubscription;
	}(Subscription));

	/** PURE_IMPORTS_START tslib,_Subject,_util_ObjectUnsubscribedError PURE_IMPORTS_END */
	var BehaviorSubject = /*@__PURE__*/ (function (_super) {
	    __extends(BehaviorSubject, _super);
	    function BehaviorSubject(_value) {
	        var _this = _super.call(this) || this;
	        _this._value = _value;
	        return _this;
	    }
	    Object.defineProperty(BehaviorSubject.prototype, "value", {
	        get: function () {
	            return this.getValue();
	        },
	        enumerable: true,
	        configurable: true
	    });
	    BehaviorSubject.prototype._subscribe = function (subscriber) {
	        var subscription = _super.prototype._subscribe.call(this, subscriber);
	        if (subscription && !subscription.closed) {
	            subscriber.next(this._value);
	        }
	        return subscription;
	    };
	    BehaviorSubject.prototype.getValue = function () {
	        if (this.hasError) {
	            throw this.thrownError;
	        }
	        else if (this.closed) {
	            throw new ObjectUnsubscribedError();
	        }
	        else {
	            return this._value;
	        }
	    };
	    BehaviorSubject.prototype.next = function (value) {
	        _super.prototype.next.call(this, this._value = value);
	    };
	    return BehaviorSubject;
	}(Subject));

	/** PURE_IMPORTS_START tslib,_Subscription PURE_IMPORTS_END */
	var Action = /*@__PURE__*/ (function (_super) {
	    __extends(Action, _super);
	    function Action(scheduler, work) {
	        return _super.call(this) || this;
	    }
	    Action.prototype.schedule = function (state, delay) {
	        return this;
	    };
	    return Action;
	}(Subscription));

	/** PURE_IMPORTS_START tslib,_Action PURE_IMPORTS_END */
	var AsyncAction = /*@__PURE__*/ (function (_super) {
	    __extends(AsyncAction, _super);
	    function AsyncAction(scheduler, work) {
	        var _this = _super.call(this, scheduler, work) || this;
	        _this.scheduler = scheduler;
	        _this.work = work;
	        _this.pending = false;
	        return _this;
	    }
	    AsyncAction.prototype.schedule = function (state, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if (this.closed) {
	            return this;
	        }
	        this.state = state;
	        var id = this.id;
	        var scheduler = this.scheduler;
	        if (id != null) {
	            this.id = this.recycleAsyncId(scheduler, id, delay);
	        }
	        this.pending = true;
	        this.delay = delay;
	        this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);
	        return this;
	    };
	    AsyncAction.prototype.requestAsyncId = function (scheduler, id, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        return setInterval(scheduler.flush.bind(scheduler, this), delay);
	    };
	    AsyncAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if (delay !== null && this.delay === delay && this.pending === false) {
	            return id;
	        }
	        clearInterval(id);
	        return undefined;
	    };
	    AsyncAction.prototype.execute = function (state, delay) {
	        if (this.closed) {
	            return new Error('executing a cancelled action');
	        }
	        this.pending = false;
	        var error = this._execute(state, delay);
	        if (error) {
	            return error;
	        }
	        else if (this.pending === false && this.id != null) {
	            this.id = this.recycleAsyncId(this.scheduler, this.id, null);
	        }
	    };
	    AsyncAction.prototype._execute = function (state, delay) {
	        var errored = false;
	        var errorValue = undefined;
	        try {
	            this.work(state);
	        }
	        catch (e) {
	            errored = true;
	            errorValue = !!e && e || new Error(e);
	        }
	        if (errored) {
	            this.unsubscribe();
	            return errorValue;
	        }
	    };
	    AsyncAction.prototype._unsubscribe = function () {
	        var id = this.id;
	        var scheduler = this.scheduler;
	        var actions = scheduler.actions;
	        var index = actions.indexOf(this);
	        this.work = null;
	        this.state = null;
	        this.pending = false;
	        this.scheduler = null;
	        if (index !== -1) {
	            actions.splice(index, 1);
	        }
	        if (id != null) {
	            this.id = this.recycleAsyncId(scheduler, id, null);
	        }
	        this.delay = null;
	    };
	    return AsyncAction;
	}(Action));

	/** PURE_IMPORTS_START tslib,_AsyncAction PURE_IMPORTS_END */
	var QueueAction = /*@__PURE__*/ (function (_super) {
	    __extends(QueueAction, _super);
	    function QueueAction(scheduler, work) {
	        var _this = _super.call(this, scheduler, work) || this;
	        _this.scheduler = scheduler;
	        _this.work = work;
	        return _this;
	    }
	    QueueAction.prototype.schedule = function (state, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if (delay > 0) {
	            return _super.prototype.schedule.call(this, state, delay);
	        }
	        this.delay = delay;
	        this.state = state;
	        this.scheduler.flush(this);
	        return this;
	    };
	    QueueAction.prototype.execute = function (state, delay) {
	        return (delay > 0 || this.closed) ?
	            _super.prototype.execute.call(this, state, delay) :
	            this._execute(state, delay);
	    };
	    QueueAction.prototype.requestAsyncId = function (scheduler, id, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
	            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
	        }
	        return scheduler.flush(this);
	    };
	    return QueueAction;
	}(AsyncAction));

	var Scheduler = /*@__PURE__*/ (function () {
	    function Scheduler(SchedulerAction, now) {
	        if (now === void 0) {
	            now = Scheduler.now;
	        }
	        this.SchedulerAction = SchedulerAction;
	        this.now = now;
	    }
	    Scheduler.prototype.schedule = function (work, delay, state) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        return new this.SchedulerAction(this, work).schedule(state, delay);
	    };
	    Scheduler.now = function () { return Date.now(); };
	    return Scheduler;
	}());

	/** PURE_IMPORTS_START tslib,_Scheduler PURE_IMPORTS_END */
	var AsyncScheduler = /*@__PURE__*/ (function (_super) {
	    __extends(AsyncScheduler, _super);
	    function AsyncScheduler(SchedulerAction, now) {
	        if (now === void 0) {
	            now = Scheduler.now;
	        }
	        var _this = _super.call(this, SchedulerAction, function () {
	            if (AsyncScheduler.delegate && AsyncScheduler.delegate !== _this) {
	                return AsyncScheduler.delegate.now();
	            }
	            else {
	                return now();
	            }
	        }) || this;
	        _this.actions = [];
	        _this.active = false;
	        _this.scheduled = undefined;
	        return _this;
	    }
	    AsyncScheduler.prototype.schedule = function (work, delay, state) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if (AsyncScheduler.delegate && AsyncScheduler.delegate !== this) {
	            return AsyncScheduler.delegate.schedule(work, delay, state);
	        }
	        else {
	            return _super.prototype.schedule.call(this, work, delay, state);
	        }
	    };
	    AsyncScheduler.prototype.flush = function (action) {
	        var actions = this.actions;
	        if (this.active) {
	            actions.push(action);
	            return;
	        }
	        var error;
	        this.active = true;
	        do {
	            if (error = action.execute(action.state, action.delay)) {
	                break;
	            }
	        } while (action = actions.shift());
	        this.active = false;
	        if (error) {
	            while (action = actions.shift()) {
	                action.unsubscribe();
	            }
	            throw error;
	        }
	    };
	    return AsyncScheduler;
	}(Scheduler));

	/** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */
	var QueueScheduler = /*@__PURE__*/ (function (_super) {
	    __extends(QueueScheduler, _super);
	    function QueueScheduler() {
	        return _super !== null && _super.apply(this, arguments) || this;
	    }
	    return QueueScheduler;
	}(AsyncScheduler));

	/** PURE_IMPORTS_START _QueueAction,_QueueScheduler PURE_IMPORTS_END */
	var queueScheduler = /*@__PURE__*/ new QueueScheduler(QueueAction);
	var queue = queueScheduler;

	/** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
	var EMPTY = /*@__PURE__*/ new Observable(function (subscriber) { return subscriber.complete(); });
	function empty$1(scheduler) {
	    return scheduler ? emptyScheduled(scheduler) : EMPTY;
	}
	function emptyScheduled(scheduler) {
	    return new Observable(function (subscriber) { return scheduler.schedule(function () { return subscriber.complete(); }); });
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function isScheduler(value) {
	    return value && typeof value.schedule === 'function';
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var subscribeToArray = function (array) {
	    return function (subscriber) {
	        for (var i = 0, len = array.length; i < len && !subscriber.closed; i++) {
	            subscriber.next(array[i]);
	        }
	        subscriber.complete();
	    };
	};

	/** PURE_IMPORTS_START _Observable,_Subscription PURE_IMPORTS_END */
	function scheduleArray(input, scheduler) {
	    return new Observable(function (subscriber) {
	        var sub = new Subscription();
	        var i = 0;
	        sub.add(scheduler.schedule(function () {
	            if (i === input.length) {
	                subscriber.complete();
	                return;
	            }
	            subscriber.next(input[i++]);
	            if (!subscriber.closed) {
	                sub.add(this.schedule());
	            }
	        }));
	        return sub;
	    });
	}

	/** PURE_IMPORTS_START _Observable,_util_subscribeToArray,_scheduled_scheduleArray PURE_IMPORTS_END */
	function fromArray(input, scheduler) {
	    if (!scheduler) {
	        return new Observable(subscribeToArray(input));
	    }
	    else {
	        return scheduleArray(input, scheduler);
	    }
	}

	/** PURE_IMPORTS_START _util_isScheduler,_fromArray,_scheduled_scheduleArray PURE_IMPORTS_END */
	function of() {
	    var args = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        args[_i] = arguments[_i];
	    }
	    var scheduler = args[args.length - 1];
	    if (isScheduler(scheduler)) {
	        args.pop();
	        return scheduleArray(args, scheduler);
	    }
	    else {
	        return fromArray(args);
	    }
	}

	/** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
	function throwError(error, scheduler) {
	    if (!scheduler) {
	        return new Observable(function (subscriber) { return subscriber.error(error); });
	    }
	    else {
	        return new Observable(function (subscriber) { return scheduler.schedule(dispatch, 0, { error: error, subscriber: subscriber }); });
	    }
	}
	function dispatch(_a) {
	    var error = _a.error, subscriber = _a.subscriber;
	    subscriber.error(error);
	}

	/** PURE_IMPORTS_START _observable_empty,_observable_of,_observable_throwError PURE_IMPORTS_END */
	var NotificationKind;
	/*@__PURE__*/ (function (NotificationKind) {
	    NotificationKind["NEXT"] = "N";
	    NotificationKind["ERROR"] = "E";
	    NotificationKind["COMPLETE"] = "C";
	})(NotificationKind || (NotificationKind = {}));
	var Notification = /*@__PURE__*/ (function () {
	    function Notification(kind, value, error) {
	        this.kind = kind;
	        this.value = value;
	        this.error = error;
	        this.hasValue = kind === 'N';
	    }
	    Notification.prototype.observe = function (observer) {
	        switch (this.kind) {
	            case 'N':
	                return observer.next && observer.next(this.value);
	            case 'E':
	                return observer.error && observer.error(this.error);
	            case 'C':
	                return observer.complete && observer.complete();
	        }
	    };
	    Notification.prototype.do = function (next, error, complete) {
	        var kind = this.kind;
	        switch (kind) {
	            case 'N':
	                return next && next(this.value);
	            case 'E':
	                return error && error(this.error);
	            case 'C':
	                return complete && complete();
	        }
	    };
	    Notification.prototype.accept = function (nextOrObserver, error, complete) {
	        if (nextOrObserver && typeof nextOrObserver.next === 'function') {
	            return this.observe(nextOrObserver);
	        }
	        else {
	            return this.do(nextOrObserver, error, complete);
	        }
	    };
	    Notification.prototype.toObservable = function () {
	        var kind = this.kind;
	        switch (kind) {
	            case 'N':
	                return of(this.value);
	            case 'E':
	                return throwError(this.error);
	            case 'C':
	                return empty$1();
	        }
	        throw new Error('unexpected notification kind value');
	    };
	    Notification.createNext = function (value) {
	        if (typeof value !== 'undefined') {
	            return new Notification('N', value);
	        }
	        return Notification.undefinedValueNotification;
	    };
	    Notification.createError = function (err) {
	        return new Notification('E', undefined, err);
	    };
	    Notification.createComplete = function () {
	        return Notification.completeNotification;
	    };
	    Notification.completeNotification = new Notification('C');
	    Notification.undefinedValueNotification = new Notification('N', undefined);
	    return Notification;
	}());

	/** PURE_IMPORTS_START tslib,_Subscriber,_Notification PURE_IMPORTS_END */
	function observeOn(scheduler, delay) {
	    if (delay === void 0) {
	        delay = 0;
	    }
	    return function observeOnOperatorFunction(source) {
	        return source.lift(new ObserveOnOperator(scheduler, delay));
	    };
	}
	var ObserveOnOperator = /*@__PURE__*/ (function () {
	    function ObserveOnOperator(scheduler, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        this.scheduler = scheduler;
	        this.delay = delay;
	    }
	    ObserveOnOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new ObserveOnSubscriber(subscriber, this.scheduler, this.delay));
	    };
	    return ObserveOnOperator;
	}());
	var ObserveOnSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(ObserveOnSubscriber, _super);
	    function ObserveOnSubscriber(destination, scheduler, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        var _this = _super.call(this, destination) || this;
	        _this.scheduler = scheduler;
	        _this.delay = delay;
	        return _this;
	    }
	    ObserveOnSubscriber.dispatch = function (arg) {
	        var notification = arg.notification, destination = arg.destination;
	        notification.observe(destination);
	        this.unsubscribe();
	    };
	    ObserveOnSubscriber.prototype.scheduleMessage = function (notification) {
	        var destination = this.destination;
	        destination.add(this.scheduler.schedule(ObserveOnSubscriber.dispatch, this.delay, new ObserveOnMessage(notification, this.destination)));
	    };
	    ObserveOnSubscriber.prototype._next = function (value) {
	        this.scheduleMessage(Notification.createNext(value));
	    };
	    ObserveOnSubscriber.prototype._error = function (err) {
	        this.scheduleMessage(Notification.createError(err));
	        this.unsubscribe();
	    };
	    ObserveOnSubscriber.prototype._complete = function () {
	        this.scheduleMessage(Notification.createComplete());
	        this.unsubscribe();
	    };
	    return ObserveOnSubscriber;
	}(Subscriber));
	var ObserveOnMessage = /*@__PURE__*/ (function () {
	    function ObserveOnMessage(notification, destination) {
	        this.notification = notification;
	        this.destination = destination;
	    }
	    return ObserveOnMessage;
	}());

	/** PURE_IMPORTS_START tslib,_Subject,_scheduler_queue,_Subscription,_operators_observeOn,_util_ObjectUnsubscribedError,_SubjectSubscription PURE_IMPORTS_END */
	var ReplaySubject = /*@__PURE__*/ (function (_super) {
	    __extends(ReplaySubject, _super);
	    function ReplaySubject(bufferSize, windowTime, scheduler) {
	        if (bufferSize === void 0) {
	            bufferSize = Number.POSITIVE_INFINITY;
	        }
	        if (windowTime === void 0) {
	            windowTime = Number.POSITIVE_INFINITY;
	        }
	        var _this = _super.call(this) || this;
	        _this.scheduler = scheduler;
	        _this._events = [];
	        _this._infiniteTimeWindow = false;
	        _this._bufferSize = bufferSize < 1 ? 1 : bufferSize;
	        _this._windowTime = windowTime < 1 ? 1 : windowTime;
	        if (windowTime === Number.POSITIVE_INFINITY) {
	            _this._infiniteTimeWindow = true;
	            _this.next = _this.nextInfiniteTimeWindow;
	        }
	        else {
	            _this.next = _this.nextTimeWindow;
	        }
	        return _this;
	    }
	    ReplaySubject.prototype.nextInfiniteTimeWindow = function (value) {
	        if (!this.isStopped) {
	            var _events = this._events;
	            _events.push(value);
	            if (_events.length > this._bufferSize) {
	                _events.shift();
	            }
	        }
	        _super.prototype.next.call(this, value);
	    };
	    ReplaySubject.prototype.nextTimeWindow = function (value) {
	        if (!this.isStopped) {
	            this._events.push(new ReplayEvent(this._getNow(), value));
	            this._trimBufferThenGetEvents();
	        }
	        _super.prototype.next.call(this, value);
	    };
	    ReplaySubject.prototype._subscribe = function (subscriber) {
	        var _infiniteTimeWindow = this._infiniteTimeWindow;
	        var _events = _infiniteTimeWindow ? this._events : this._trimBufferThenGetEvents();
	        var scheduler = this.scheduler;
	        var len = _events.length;
	        var subscription;
	        if (this.closed) {
	            throw new ObjectUnsubscribedError();
	        }
	        else if (this.isStopped || this.hasError) {
	            subscription = Subscription.EMPTY;
	        }
	        else {
	            this.observers.push(subscriber);
	            subscription = new SubjectSubscription(this, subscriber);
	        }
	        if (scheduler) {
	            subscriber.add(subscriber = new ObserveOnSubscriber(subscriber, scheduler));
	        }
	        if (_infiniteTimeWindow) {
	            for (var i = 0; i < len && !subscriber.closed; i++) {
	                subscriber.next(_events[i]);
	            }
	        }
	        else {
	            for (var i = 0; i < len && !subscriber.closed; i++) {
	                subscriber.next(_events[i].value);
	            }
	        }
	        if (this.hasError) {
	            subscriber.error(this.thrownError);
	        }
	        else if (this.isStopped) {
	            subscriber.complete();
	        }
	        return subscription;
	    };
	    ReplaySubject.prototype._getNow = function () {
	        return (this.scheduler || queue).now();
	    };
	    ReplaySubject.prototype._trimBufferThenGetEvents = function () {
	        var now = this._getNow();
	        var _bufferSize = this._bufferSize;
	        var _windowTime = this._windowTime;
	        var _events = this._events;
	        var eventsCount = _events.length;
	        var spliceCount = 0;
	        while (spliceCount < eventsCount) {
	            if ((now - _events[spliceCount].time) < _windowTime) {
	                break;
	            }
	            spliceCount++;
	        }
	        if (eventsCount > _bufferSize) {
	            spliceCount = Math.max(spliceCount, eventsCount - _bufferSize);
	        }
	        if (spliceCount > 0) {
	            _events.splice(0, spliceCount);
	        }
	        return _events;
	    };
	    return ReplaySubject;
	}(Subject));
	var ReplayEvent = /*@__PURE__*/ (function () {
	    function ReplayEvent(time, value) {
	        this.time = time;
	        this.value = value;
	    }
	    return ReplayEvent;
	}());

	/** PURE_IMPORTS_START tslib,_Subject,_Subscription PURE_IMPORTS_END */
	var AsyncSubject = /*@__PURE__*/ (function (_super) {
	    __extends(AsyncSubject, _super);
	    function AsyncSubject() {
	        var _this = _super !== null && _super.apply(this, arguments) || this;
	        _this.value = null;
	        _this.hasNext = false;
	        _this.hasCompleted = false;
	        return _this;
	    }
	    AsyncSubject.prototype._subscribe = function (subscriber) {
	        if (this.hasError) {
	            subscriber.error(this.thrownError);
	            return Subscription.EMPTY;
	        }
	        else if (this.hasCompleted && this.hasNext) {
	            subscriber.next(this.value);
	            subscriber.complete();
	            return Subscription.EMPTY;
	        }
	        return _super.prototype._subscribe.call(this, subscriber);
	    };
	    AsyncSubject.prototype.next = function (value) {
	        if (!this.hasCompleted) {
	            this.value = value;
	            this.hasNext = true;
	        }
	    };
	    AsyncSubject.prototype.error = function (error) {
	        if (!this.hasCompleted) {
	            _super.prototype.error.call(this, error);
	        }
	    };
	    AsyncSubject.prototype.complete = function () {
	        this.hasCompleted = true;
	        if (this.hasNext) {
	            _super.prototype.next.call(this, this.value);
	        }
	        _super.prototype.complete.call(this);
	    };
	    return AsyncSubject;
	}(Subject));

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var nextHandle = 1;
	var RESOLVED = /*@__PURE__*/ (function () { return /*@__PURE__*/ Promise.resolve(); })();
	var activeHandles = {};
	function findAndClearHandle(handle) {
	    if (handle in activeHandles) {
	        delete activeHandles[handle];
	        return true;
	    }
	    return false;
	}
	var Immediate = {
	    setImmediate: function (cb) {
	        var handle = nextHandle++;
	        activeHandles[handle] = true;
	        RESOLVED.then(function () { return findAndClearHandle(handle) && cb(); });
	        return handle;
	    },
	    clearImmediate: function (handle) {
	        findAndClearHandle(handle);
	    },
	};

	/** PURE_IMPORTS_START tslib,_util_Immediate,_AsyncAction PURE_IMPORTS_END */
	var AsapAction = /*@__PURE__*/ (function (_super) {
	    __extends(AsapAction, _super);
	    function AsapAction(scheduler, work) {
	        var _this = _super.call(this, scheduler, work) || this;
	        _this.scheduler = scheduler;
	        _this.work = work;
	        return _this;
	    }
	    AsapAction.prototype.requestAsyncId = function (scheduler, id, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if (delay !== null && delay > 0) {
	            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
	        }
	        scheduler.actions.push(this);
	        return scheduler.scheduled || (scheduler.scheduled = Immediate.setImmediate(scheduler.flush.bind(scheduler, null)));
	    };
	    AsapAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
	            return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
	        }
	        if (scheduler.actions.length === 0) {
	            Immediate.clearImmediate(id);
	            scheduler.scheduled = undefined;
	        }
	        return undefined;
	    };
	    return AsapAction;
	}(AsyncAction));

	/** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */
	var AsapScheduler = /*@__PURE__*/ (function (_super) {
	    __extends(AsapScheduler, _super);
	    function AsapScheduler() {
	        return _super !== null && _super.apply(this, arguments) || this;
	    }
	    AsapScheduler.prototype.flush = function (action) {
	        this.active = true;
	        this.scheduled = undefined;
	        var actions = this.actions;
	        var error;
	        var index = -1;
	        var count = actions.length;
	        action = action || actions.shift();
	        do {
	            if (error = action.execute(action.state, action.delay)) {
	                break;
	            }
	        } while (++index < count && (action = actions.shift()));
	        this.active = false;
	        if (error) {
	            while (++index < count && (action = actions.shift())) {
	                action.unsubscribe();
	            }
	            throw error;
	        }
	    };
	    return AsapScheduler;
	}(AsyncScheduler));

	/** PURE_IMPORTS_START _AsapAction,_AsapScheduler PURE_IMPORTS_END */
	var asapScheduler = /*@__PURE__*/ new AsapScheduler(AsapAction);
	var asap = asapScheduler;

	/** PURE_IMPORTS_START _AsyncAction,_AsyncScheduler PURE_IMPORTS_END */
	var asyncScheduler = /*@__PURE__*/ new AsyncScheduler(AsyncAction);
	var async = asyncScheduler;

	/** PURE_IMPORTS_START tslib,_AsyncAction PURE_IMPORTS_END */
	var AnimationFrameAction = /*@__PURE__*/ (function (_super) {
	    __extends(AnimationFrameAction, _super);
	    function AnimationFrameAction(scheduler, work) {
	        var _this = _super.call(this, scheduler, work) || this;
	        _this.scheduler = scheduler;
	        _this.work = work;
	        return _this;
	    }
	    AnimationFrameAction.prototype.requestAsyncId = function (scheduler, id, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if (delay !== null && delay > 0) {
	            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
	        }
	        scheduler.actions.push(this);
	        return scheduler.scheduled || (scheduler.scheduled = requestAnimationFrame(function () { return scheduler.flush(null); }));
	    };
	    AnimationFrameAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
	            return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
	        }
	        if (scheduler.actions.length === 0) {
	            cancelAnimationFrame(id);
	            scheduler.scheduled = undefined;
	        }
	        return undefined;
	    };
	    return AnimationFrameAction;
	}(AsyncAction));

	/** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */
	var AnimationFrameScheduler = /*@__PURE__*/ (function (_super) {
	    __extends(AnimationFrameScheduler, _super);
	    function AnimationFrameScheduler() {
	        return _super !== null && _super.apply(this, arguments) || this;
	    }
	    AnimationFrameScheduler.prototype.flush = function (action) {
	        this.active = true;
	        this.scheduled = undefined;
	        var actions = this.actions;
	        var error;
	        var index = -1;
	        var count = actions.length;
	        action = action || actions.shift();
	        do {
	            if (error = action.execute(action.state, action.delay)) {
	                break;
	            }
	        } while (++index < count && (action = actions.shift()));
	        this.active = false;
	        if (error) {
	            while (++index < count && (action = actions.shift())) {
	                action.unsubscribe();
	            }
	            throw error;
	        }
	    };
	    return AnimationFrameScheduler;
	}(AsyncScheduler));

	/** PURE_IMPORTS_START _AnimationFrameAction,_AnimationFrameScheduler PURE_IMPORTS_END */
	var animationFrameScheduler = /*@__PURE__*/ new AnimationFrameScheduler(AnimationFrameAction);
	var animationFrame = animationFrameScheduler;

	/** PURE_IMPORTS_START tslib,_AsyncAction,_AsyncScheduler PURE_IMPORTS_END */
	var VirtualTimeScheduler = /*@__PURE__*/ (function (_super) {
	    __extends(VirtualTimeScheduler, _super);
	    function VirtualTimeScheduler(SchedulerAction, maxFrames) {
	        if (SchedulerAction === void 0) {
	            SchedulerAction = VirtualAction;
	        }
	        if (maxFrames === void 0) {
	            maxFrames = Number.POSITIVE_INFINITY;
	        }
	        var _this = _super.call(this, SchedulerAction, function () { return _this.frame; }) || this;
	        _this.maxFrames = maxFrames;
	        _this.frame = 0;
	        _this.index = -1;
	        return _this;
	    }
	    VirtualTimeScheduler.prototype.flush = function () {
	        var _a = this, actions = _a.actions, maxFrames = _a.maxFrames;
	        var error, action;
	        while ((action = actions[0]) && action.delay <= maxFrames) {
	            actions.shift();
	            this.frame = action.delay;
	            if (error = action.execute(action.state, action.delay)) {
	                break;
	            }
	        }
	        if (error) {
	            while (action = actions.shift()) {
	                action.unsubscribe();
	            }
	            throw error;
	        }
	    };
	    VirtualTimeScheduler.frameTimeFactor = 10;
	    return VirtualTimeScheduler;
	}(AsyncScheduler));
	var VirtualAction = /*@__PURE__*/ (function (_super) {
	    __extends(VirtualAction, _super);
	    function VirtualAction(scheduler, work, index) {
	        if (index === void 0) {
	            index = scheduler.index += 1;
	        }
	        var _this = _super.call(this, scheduler, work) || this;
	        _this.scheduler = scheduler;
	        _this.work = work;
	        _this.index = index;
	        _this.active = true;
	        _this.index = scheduler.index = index;
	        return _this;
	    }
	    VirtualAction.prototype.schedule = function (state, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if (!this.id) {
	            return _super.prototype.schedule.call(this, state, delay);
	        }
	        this.active = false;
	        var action = new VirtualAction(this.scheduler, this.work);
	        this.add(action);
	        return action.schedule(state, delay);
	    };
	    VirtualAction.prototype.requestAsyncId = function (scheduler, id, delay) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        this.delay = scheduler.frame + delay;
	        var actions = scheduler.actions;
	        actions.push(this);
	        actions.sort(VirtualAction.sortActions);
	        return true;
	    };
	    VirtualAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
	        return undefined;
	    };
	    VirtualAction.prototype._execute = function (state, delay) {
	        if (this.active === true) {
	            return _super.prototype._execute.call(this, state, delay);
	        }
	    };
	    VirtualAction.sortActions = function (a, b) {
	        if (a.delay === b.delay) {
	            if (a.index === b.index) {
	                return 0;
	            }
	            else if (a.index > b.index) {
	                return 1;
	            }
	            else {
	                return -1;
	            }
	        }
	        else if (a.delay > b.delay) {
	            return 1;
	        }
	        else {
	            return -1;
	        }
	    };
	    return VirtualAction;
	}(AsyncAction));

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function noop() { }

	/** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
	function isObservable(obj) {
	    return !!obj && (obj instanceof Observable || (typeof obj.lift === 'function' && typeof obj.subscribe === 'function'));
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var ArgumentOutOfRangeErrorImpl = /*@__PURE__*/ (function () {
	    function ArgumentOutOfRangeErrorImpl() {
	        Error.call(this);
	        this.message = 'argument out of range';
	        this.name = 'ArgumentOutOfRangeError';
	        return this;
	    }
	    ArgumentOutOfRangeErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
	    return ArgumentOutOfRangeErrorImpl;
	})();
	var ArgumentOutOfRangeError = ArgumentOutOfRangeErrorImpl;

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var EmptyErrorImpl = /*@__PURE__*/ (function () {
	    function EmptyErrorImpl() {
	        Error.call(this);
	        this.message = 'no elements in sequence';
	        this.name = 'EmptyError';
	        return this;
	    }
	    EmptyErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
	    return EmptyErrorImpl;
	})();
	var EmptyError = EmptyErrorImpl;

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var TimeoutErrorImpl = /*@__PURE__*/ (function () {
	    function TimeoutErrorImpl() {
	        Error.call(this);
	        this.message = 'Timeout has occurred';
	        this.name = 'TimeoutError';
	        return this;
	    }
	    TimeoutErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
	    return TimeoutErrorImpl;
	})();
	var TimeoutError = TimeoutErrorImpl;

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function map(project, thisArg) {
	    return function mapOperation(source) {
	        if (typeof project !== 'function') {
	            throw new TypeError('argument is not a function. Are you looking for `mapTo()`?');
	        }
	        return source.lift(new MapOperator(project, thisArg));
	    };
	}
	var MapOperator = /*@__PURE__*/ (function () {
	    function MapOperator(project, thisArg) {
	        this.project = project;
	        this.thisArg = thisArg;
	    }
	    MapOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new MapSubscriber(subscriber, this.project, this.thisArg));
	    };
	    return MapOperator;
	}());
	var MapSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(MapSubscriber, _super);
	    function MapSubscriber(destination, project, thisArg) {
	        var _this = _super.call(this, destination) || this;
	        _this.project = project;
	        _this.count = 0;
	        _this.thisArg = thisArg || _this;
	        return _this;
	    }
	    MapSubscriber.prototype._next = function (value) {
	        var result;
	        try {
	            result = this.project.call(this.thisArg, value, this.count++);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        this.destination.next(result);
	    };
	    return MapSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _Observable,_AsyncSubject,_operators_map,_util_canReportError,_util_isArray,_util_isScheduler PURE_IMPORTS_END */
	function bindCallback(callbackFunc, resultSelector, scheduler) {
	    if (resultSelector) {
	        if (isScheduler(resultSelector)) {
	            scheduler = resultSelector;
	        }
	        else {
	            return function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i] = arguments[_i];
	                }
	                return bindCallback(callbackFunc, scheduler).apply(void 0, args).pipe(map(function (args) { return isArray(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
	            };
	        }
	    }
	    return function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i] = arguments[_i];
	        }
	        var context = this;
	        var subject;
	        var params = {
	            context: context,
	            subject: subject,
	            callbackFunc: callbackFunc,
	            scheduler: scheduler,
	        };
	        return new Observable(function (subscriber) {
	            if (!scheduler) {
	                if (!subject) {
	                    subject = new AsyncSubject();
	                    var handler = function () {
	                        var innerArgs = [];
	                        for (var _i = 0; _i < arguments.length; _i++) {
	                            innerArgs[_i] = arguments[_i];
	                        }
	                        subject.next(innerArgs.length <= 1 ? innerArgs[0] : innerArgs);
	                        subject.complete();
	                    };
	                    try {
	                        callbackFunc.apply(context, args.concat([handler]));
	                    }
	                    catch (err) {
	                        if (canReportError(subject)) {
	                            subject.error(err);
	                        }
	                        else {
	                            console.warn(err);
	                        }
	                    }
	                }
	                return subject.subscribe(subscriber);
	            }
	            else {
	                var state = {
	                    args: args, subscriber: subscriber, params: params,
	                };
	                return scheduler.schedule(dispatch$1, 0, state);
	            }
	        });
	    };
	}
	function dispatch$1(state) {
	    var _this = this;
	    var args = state.args, subscriber = state.subscriber, params = state.params;
	    var callbackFunc = params.callbackFunc, context = params.context, scheduler = params.scheduler;
	    var subject = params.subject;
	    if (!subject) {
	        subject = params.subject = new AsyncSubject();
	        var handler = function () {
	            var innerArgs = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                innerArgs[_i] = arguments[_i];
	            }
	            var value = innerArgs.length <= 1 ? innerArgs[0] : innerArgs;
	            _this.add(scheduler.schedule(dispatchNext, 0, { value: value, subject: subject }));
	        };
	        try {
	            callbackFunc.apply(context, args.concat([handler]));
	        }
	        catch (err) {
	            subject.error(err);
	        }
	    }
	    this.add(subject.subscribe(subscriber));
	}
	function dispatchNext(state) {
	    var value = state.value, subject = state.subject;
	    subject.next(value);
	    subject.complete();
	}

	/** PURE_IMPORTS_START _Observable,_AsyncSubject,_operators_map,_util_canReportError,_util_isScheduler,_util_isArray PURE_IMPORTS_END */
	function bindNodeCallback(callbackFunc, resultSelector, scheduler) {
	    if (resultSelector) {
	        if (isScheduler(resultSelector)) {
	            scheduler = resultSelector;
	        }
	        else {
	            return function () {
	                var args = [];
	                for (var _i = 0; _i < arguments.length; _i++) {
	                    args[_i] = arguments[_i];
	                }
	                return bindNodeCallback(callbackFunc, scheduler).apply(void 0, args).pipe(map(function (args) { return isArray(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
	            };
	        }
	    }
	    return function () {
	        var args = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            args[_i] = arguments[_i];
	        }
	        var params = {
	            subject: undefined,
	            args: args,
	            callbackFunc: callbackFunc,
	            scheduler: scheduler,
	            context: this,
	        };
	        return new Observable(function (subscriber) {
	            var context = params.context;
	            var subject = params.subject;
	            if (!scheduler) {
	                if (!subject) {
	                    subject = params.subject = new AsyncSubject();
	                    var handler = function () {
	                        var innerArgs = [];
	                        for (var _i = 0; _i < arguments.length; _i++) {
	                            innerArgs[_i] = arguments[_i];
	                        }
	                        var err = innerArgs.shift();
	                        if (err) {
	                            subject.error(err);
	                            return;
	                        }
	                        subject.next(innerArgs.length <= 1 ? innerArgs[0] : innerArgs);
	                        subject.complete();
	                    };
	                    try {
	                        callbackFunc.apply(context, args.concat([handler]));
	                    }
	                    catch (err) {
	                        if (canReportError(subject)) {
	                            subject.error(err);
	                        }
	                        else {
	                            console.warn(err);
	                        }
	                    }
	                }
	                return subject.subscribe(subscriber);
	            }
	            else {
	                return scheduler.schedule(dispatch$2, 0, { params: params, subscriber: subscriber, context: context });
	            }
	        });
	    };
	}
	function dispatch$2(state) {
	    var _this = this;
	    var params = state.params, subscriber = state.subscriber, context = state.context;
	    var callbackFunc = params.callbackFunc, args = params.args, scheduler = params.scheduler;
	    var subject = params.subject;
	    if (!subject) {
	        subject = params.subject = new AsyncSubject();
	        var handler = function () {
	            var innerArgs = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                innerArgs[_i] = arguments[_i];
	            }
	            var err = innerArgs.shift();
	            if (err) {
	                _this.add(scheduler.schedule(dispatchError, 0, { err: err, subject: subject }));
	            }
	            else {
	                var value = innerArgs.length <= 1 ? innerArgs[0] : innerArgs;
	                _this.add(scheduler.schedule(dispatchNext$1, 0, { value: value, subject: subject }));
	            }
	        };
	        try {
	            callbackFunc.apply(context, args.concat([handler]));
	        }
	        catch (err) {
	            this.add(scheduler.schedule(dispatchError, 0, { err: err, subject: subject }));
	        }
	    }
	    this.add(subject.subscribe(subscriber));
	}
	function dispatchNext$1(arg) {
	    var value = arg.value, subject = arg.subject;
	    subject.next(value);
	    subject.complete();
	}
	function dispatchError(arg) {
	    var err = arg.err, subject = arg.subject;
	    subject.error(err);
	}

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	var OuterSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(OuterSubscriber, _super);
	    function OuterSubscriber() {
	        return _super !== null && _super.apply(this, arguments) || this;
	    }
	    OuterSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
	        this.destination.next(innerValue);
	    };
	    OuterSubscriber.prototype.notifyError = function (error, innerSub) {
	        this.destination.error(error);
	    };
	    OuterSubscriber.prototype.notifyComplete = function (innerSub) {
	        this.destination.complete();
	    };
	    return OuterSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	var InnerSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(InnerSubscriber, _super);
	    function InnerSubscriber(parent, outerValue, outerIndex) {
	        var _this = _super.call(this) || this;
	        _this.parent = parent;
	        _this.outerValue = outerValue;
	        _this.outerIndex = outerIndex;
	        _this.index = 0;
	        return _this;
	    }
	    InnerSubscriber.prototype._next = function (value) {
	        this.parent.notifyNext(this.outerValue, value, this.outerIndex, this.index++, this);
	    };
	    InnerSubscriber.prototype._error = function (error) {
	        this.parent.notifyError(error, this);
	        this.unsubscribe();
	    };
	    InnerSubscriber.prototype._complete = function () {
	        this.parent.notifyComplete(this);
	        this.unsubscribe();
	    };
	    return InnerSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _hostReportError PURE_IMPORTS_END */
	var subscribeToPromise = function (promise) {
	    return function (subscriber) {
	        promise.then(function (value) {
	            if (!subscriber.closed) {
	                subscriber.next(value);
	                subscriber.complete();
	            }
	        }, function (err) { return subscriber.error(err); })
	            .then(null, hostReportError);
	        return subscriber;
	    };
	};

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function getSymbolIterator() {
	    if (typeof Symbol !== 'function' || !Symbol.iterator) {
	        return '@@iterator';
	    }
	    return Symbol.iterator;
	}
	var iterator = /*@__PURE__*/ getSymbolIterator();

	/** PURE_IMPORTS_START _symbol_iterator PURE_IMPORTS_END */
	var subscribeToIterable = function (iterable) {
	    return function (subscriber) {
	        var iterator$1 = iterable[iterator]();
	        do {
	            var item = void 0;
	            try {
	                item = iterator$1.next();
	            }
	            catch (err) {
	                subscriber.error(err);
	                return subscriber;
	            }
	            if (item.done) {
	                subscriber.complete();
	                break;
	            }
	            subscriber.next(item.value);
	            if (subscriber.closed) {
	                break;
	            }
	        } while (true);
	        if (typeof iterator$1.return === 'function') {
	            subscriber.add(function () {
	                if (iterator$1.return) {
	                    iterator$1.return();
	                }
	            });
	        }
	        return subscriber;
	    };
	};

	/** PURE_IMPORTS_START _symbol_observable PURE_IMPORTS_END */
	var subscribeToObservable = function (obj) {
	    return function (subscriber) {
	        var obs = obj[observable]();
	        if (typeof obs.subscribe !== 'function') {
	            throw new TypeError('Provided object does not correctly implement Symbol.observable');
	        }
	        else {
	            return obs.subscribe(subscriber);
	        }
	    };
	};

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var isArrayLike = (function (x) { return x && typeof x.length === 'number' && typeof x !== 'function'; });

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function isPromise(value) {
	    return !!value && typeof value.subscribe !== 'function' && typeof value.then === 'function';
	}

	/** PURE_IMPORTS_START _subscribeToArray,_subscribeToPromise,_subscribeToIterable,_subscribeToObservable,_isArrayLike,_isPromise,_isObject,_symbol_iterator,_symbol_observable PURE_IMPORTS_END */
	var subscribeTo = function (result) {
	    if (!!result && typeof result[observable] === 'function') {
	        return subscribeToObservable(result);
	    }
	    else if (isArrayLike(result)) {
	        return subscribeToArray(result);
	    }
	    else if (isPromise(result)) {
	        return subscribeToPromise(result);
	    }
	    else if (!!result && typeof result[iterator] === 'function') {
	        return subscribeToIterable(result);
	    }
	    else {
	        var value = isObject(result) ? 'an invalid object' : "'" + result + "'";
	        var msg = "You provided " + value + " where a stream was expected."
	            + ' You can provide an Observable, Promise, Array, or Iterable.';
	        throw new TypeError(msg);
	    }
	};

	/** PURE_IMPORTS_START _InnerSubscriber,_subscribeTo,_Observable PURE_IMPORTS_END */
	function subscribeToResult(outerSubscriber, result, outerValue, outerIndex, innerSubscriber) {
	    if (innerSubscriber === void 0) {
	        innerSubscriber = new InnerSubscriber(outerSubscriber, outerValue, outerIndex);
	    }
	    if (innerSubscriber.closed) {
	        return undefined;
	    }
	    if (result instanceof Observable) {
	        return result.subscribe(innerSubscriber);
	    }
	    return subscribeTo(result)(innerSubscriber);
	}

	/** PURE_IMPORTS_START tslib,_util_isScheduler,_util_isArray,_OuterSubscriber,_util_subscribeToResult,_fromArray PURE_IMPORTS_END */
	var NONE = {};
	function combineLatest() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    var resultSelector = undefined;
	    var scheduler = undefined;
	    if (isScheduler(observables[observables.length - 1])) {
	        scheduler = observables.pop();
	    }
	    if (typeof observables[observables.length - 1] === 'function') {
	        resultSelector = observables.pop();
	    }
	    if (observables.length === 1 && isArray(observables[0])) {
	        observables = observables[0];
	    }
	    return fromArray(observables, scheduler).lift(new CombineLatestOperator(resultSelector));
	}
	var CombineLatestOperator = /*@__PURE__*/ (function () {
	    function CombineLatestOperator(resultSelector) {
	        this.resultSelector = resultSelector;
	    }
	    CombineLatestOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new CombineLatestSubscriber(subscriber, this.resultSelector));
	    };
	    return CombineLatestOperator;
	}());
	var CombineLatestSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(CombineLatestSubscriber, _super);
	    function CombineLatestSubscriber(destination, resultSelector) {
	        var _this = _super.call(this, destination) || this;
	        _this.resultSelector = resultSelector;
	        _this.active = 0;
	        _this.values = [];
	        _this.observables = [];
	        return _this;
	    }
	    CombineLatestSubscriber.prototype._next = function (observable) {
	        this.values.push(NONE);
	        this.observables.push(observable);
	    };
	    CombineLatestSubscriber.prototype._complete = function () {
	        var observables = this.observables;
	        var len = observables.length;
	        if (len === 0) {
	            this.destination.complete();
	        }
	        else {
	            this.active = len;
	            this.toRespond = len;
	            for (var i = 0; i < len; i++) {
	                var observable = observables[i];
	                this.add(subscribeToResult(this, observable, undefined, i));
	            }
	        }
	    };
	    CombineLatestSubscriber.prototype.notifyComplete = function (unused) {
	        if ((this.active -= 1) === 0) {
	            this.destination.complete();
	        }
	    };
	    CombineLatestSubscriber.prototype.notifyNext = function (_outerValue, innerValue, outerIndex) {
	        var values = this.values;
	        var oldVal = values[outerIndex];
	        var toRespond = !this.toRespond
	            ? 0
	            : oldVal === NONE ? --this.toRespond : this.toRespond;
	        values[outerIndex] = innerValue;
	        if (toRespond === 0) {
	            if (this.resultSelector) {
	                this._tryResultSelector(values);
	            }
	            else {
	                this.destination.next(values.slice());
	            }
	        }
	    };
	    CombineLatestSubscriber.prototype._tryResultSelector = function (values) {
	        var result;
	        try {
	            result = this.resultSelector.apply(this, values);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        this.destination.next(result);
	    };
	    return CombineLatestSubscriber;
	}(OuterSubscriber));

	/** PURE_IMPORTS_START _Observable,_Subscription,_symbol_observable PURE_IMPORTS_END */
	function scheduleObservable(input, scheduler) {
	    return new Observable(function (subscriber) {
	        var sub = new Subscription();
	        sub.add(scheduler.schedule(function () {
	            var observable$1 = input[observable]();
	            sub.add(observable$1.subscribe({
	                next: function (value) { sub.add(scheduler.schedule(function () { return subscriber.next(value); })); },
	                error: function (err) { sub.add(scheduler.schedule(function () { return subscriber.error(err); })); },
	                complete: function () { sub.add(scheduler.schedule(function () { return subscriber.complete(); })); },
	            }));
	        }));
	        return sub;
	    });
	}

	/** PURE_IMPORTS_START _Observable,_Subscription PURE_IMPORTS_END */
	function schedulePromise(input, scheduler) {
	    return new Observable(function (subscriber) {
	        var sub = new Subscription();
	        sub.add(scheduler.schedule(function () {
	            return input.then(function (value) {
	                sub.add(scheduler.schedule(function () {
	                    subscriber.next(value);
	                    sub.add(scheduler.schedule(function () { return subscriber.complete(); }));
	                }));
	            }, function (err) {
	                sub.add(scheduler.schedule(function () { return subscriber.error(err); }));
	            });
	        }));
	        return sub;
	    });
	}

	/** PURE_IMPORTS_START _Observable,_Subscription,_symbol_iterator PURE_IMPORTS_END */
	function scheduleIterable(input, scheduler) {
	    if (!input) {
	        throw new Error('Iterable cannot be null');
	    }
	    return new Observable(function (subscriber) {
	        var sub = new Subscription();
	        var iterator$1;
	        sub.add(function () {
	            if (iterator$1 && typeof iterator$1.return === 'function') {
	                iterator$1.return();
	            }
	        });
	        sub.add(scheduler.schedule(function () {
	            iterator$1 = input[iterator]();
	            sub.add(scheduler.schedule(function () {
	                if (subscriber.closed) {
	                    return;
	                }
	                var value;
	                var done;
	                try {
	                    var result = iterator$1.next();
	                    value = result.value;
	                    done = result.done;
	                }
	                catch (err) {
	                    subscriber.error(err);
	                    return;
	                }
	                if (done) {
	                    subscriber.complete();
	                }
	                else {
	                    subscriber.next(value);
	                    this.schedule();
	                }
	            }));
	        }));
	        return sub;
	    });
	}

	/** PURE_IMPORTS_START _symbol_observable PURE_IMPORTS_END */
	function isInteropObservable(input) {
	    return input && typeof input[observable] === 'function';
	}

	/** PURE_IMPORTS_START _symbol_iterator PURE_IMPORTS_END */
	function isIterable(input) {
	    return input && typeof input[iterator] === 'function';
	}

	/** PURE_IMPORTS_START _scheduleObservable,_schedulePromise,_scheduleArray,_scheduleIterable,_util_isInteropObservable,_util_isPromise,_util_isArrayLike,_util_isIterable PURE_IMPORTS_END */
	function scheduled(input, scheduler) {
	    if (input != null) {
	        if (isInteropObservable(input)) {
	            return scheduleObservable(input, scheduler);
	        }
	        else if (isPromise(input)) {
	            return schedulePromise(input, scheduler);
	        }
	        else if (isArrayLike(input)) {
	            return scheduleArray(input, scheduler);
	        }
	        else if (isIterable(input) || typeof input === 'string') {
	            return scheduleIterable(input, scheduler);
	        }
	    }
	    throw new TypeError((input !== null && typeof input || input) + ' is not observable');
	}

	/** PURE_IMPORTS_START _Observable,_util_subscribeTo,_scheduled_scheduled PURE_IMPORTS_END */
	function from(input, scheduler) {
	    if (!scheduler) {
	        if (input instanceof Observable) {
	            return input;
	        }
	        return new Observable(subscribeTo(input));
	    }
	    else {
	        return scheduled(input, scheduler);
	    }
	}

	/** PURE_IMPORTS_START tslib,_Subscriber,_Observable,_util_subscribeTo PURE_IMPORTS_END */
	var SimpleInnerSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SimpleInnerSubscriber, _super);
	    function SimpleInnerSubscriber(parent) {
	        var _this = _super.call(this) || this;
	        _this.parent = parent;
	        return _this;
	    }
	    SimpleInnerSubscriber.prototype._next = function (value) {
	        this.parent.notifyNext(value);
	    };
	    SimpleInnerSubscriber.prototype._error = function (error) {
	        this.parent.notifyError(error);
	        this.unsubscribe();
	    };
	    SimpleInnerSubscriber.prototype._complete = function () {
	        this.parent.notifyComplete();
	        this.unsubscribe();
	    };
	    return SimpleInnerSubscriber;
	}(Subscriber));
	var SimpleOuterSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SimpleOuterSubscriber, _super);
	    function SimpleOuterSubscriber() {
	        return _super !== null && _super.apply(this, arguments) || this;
	    }
	    SimpleOuterSubscriber.prototype.notifyNext = function (innerValue) {
	        this.destination.next(innerValue);
	    };
	    SimpleOuterSubscriber.prototype.notifyError = function (err) {
	        this.destination.error(err);
	    };
	    SimpleOuterSubscriber.prototype.notifyComplete = function () {
	        this.destination.complete();
	    };
	    return SimpleOuterSubscriber;
	}(Subscriber));
	function innerSubscribe(result, innerSubscriber) {
	    if (innerSubscriber.closed) {
	        return undefined;
	    }
	    if (result instanceof Observable) {
	        return result.subscribe(innerSubscriber);
	    }
	    return subscribeTo(result)(innerSubscriber);
	}

	/** PURE_IMPORTS_START tslib,_map,_observable_from,_innerSubscribe PURE_IMPORTS_END */
	function mergeMap(project, resultSelector, concurrent) {
	    if (concurrent === void 0) {
	        concurrent = Number.POSITIVE_INFINITY;
	    }
	    if (typeof resultSelector === 'function') {
	        return function (source) { return source.pipe(mergeMap(function (a, i) { return from(project(a, i)).pipe(map(function (b, ii) { return resultSelector(a, b, i, ii); })); }, concurrent)); };
	    }
	    else if (typeof resultSelector === 'number') {
	        concurrent = resultSelector;
	    }
	    return function (source) { return source.lift(new MergeMapOperator(project, concurrent)); };
	}
	var MergeMapOperator = /*@__PURE__*/ (function () {
	    function MergeMapOperator(project, concurrent) {
	        if (concurrent === void 0) {
	            concurrent = Number.POSITIVE_INFINITY;
	        }
	        this.project = project;
	        this.concurrent = concurrent;
	    }
	    MergeMapOperator.prototype.call = function (observer, source) {
	        return source.subscribe(new MergeMapSubscriber(observer, this.project, this.concurrent));
	    };
	    return MergeMapOperator;
	}());
	var MergeMapSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(MergeMapSubscriber, _super);
	    function MergeMapSubscriber(destination, project, concurrent) {
	        if (concurrent === void 0) {
	            concurrent = Number.POSITIVE_INFINITY;
	        }
	        var _this = _super.call(this, destination) || this;
	        _this.project = project;
	        _this.concurrent = concurrent;
	        _this.hasCompleted = false;
	        _this.buffer = [];
	        _this.active = 0;
	        _this.index = 0;
	        return _this;
	    }
	    MergeMapSubscriber.prototype._next = function (value) {
	        if (this.active < this.concurrent) {
	            this._tryNext(value);
	        }
	        else {
	            this.buffer.push(value);
	        }
	    };
	    MergeMapSubscriber.prototype._tryNext = function (value) {
	        var result;
	        var index = this.index++;
	        try {
	            result = this.project(value, index);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        this.active++;
	        this._innerSub(result);
	    };
	    MergeMapSubscriber.prototype._innerSub = function (ish) {
	        var innerSubscriber = new SimpleInnerSubscriber(this);
	        var destination = this.destination;
	        destination.add(innerSubscriber);
	        var innerSubscription = innerSubscribe(ish, innerSubscriber);
	        if (innerSubscription !== innerSubscriber) {
	            destination.add(innerSubscription);
	        }
	    };
	    MergeMapSubscriber.prototype._complete = function () {
	        this.hasCompleted = true;
	        if (this.active === 0 && this.buffer.length === 0) {
	            this.destination.complete();
	        }
	        this.unsubscribe();
	    };
	    MergeMapSubscriber.prototype.notifyNext = function (innerValue) {
	        this.destination.next(innerValue);
	    };
	    MergeMapSubscriber.prototype.notifyComplete = function () {
	        var buffer = this.buffer;
	        this.active--;
	        if (buffer.length > 0) {
	            this._next(buffer.shift());
	        }
	        else if (this.active === 0 && this.hasCompleted) {
	            this.destination.complete();
	        }
	    };
	    return MergeMapSubscriber;
	}(SimpleOuterSubscriber));
	var flatMap = mergeMap;

	/** PURE_IMPORTS_START _mergeMap,_util_identity PURE_IMPORTS_END */
	function mergeAll(concurrent) {
	    if (concurrent === void 0) {
	        concurrent = Number.POSITIVE_INFINITY;
	    }
	    return mergeMap(identity, concurrent);
	}

	/** PURE_IMPORTS_START _mergeAll PURE_IMPORTS_END */
	function concatAll() {
	    return mergeAll(1);
	}

	/** PURE_IMPORTS_START _of,_operators_concatAll PURE_IMPORTS_END */
	function concat() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    return concatAll()(of.apply(void 0, observables));
	}

	/** PURE_IMPORTS_START _Observable,_from,_empty PURE_IMPORTS_END */
	function defer(observableFactory) {
	    return new Observable(function (subscriber) {
	        var input;
	        try {
	            input = observableFactory();
	        }
	        catch (err) {
	            subscriber.error(err);
	            return undefined;
	        }
	        var source = input ? from(input) : empty$1();
	        return source.subscribe(subscriber);
	    });
	}

	/** PURE_IMPORTS_START _Observable,_util_isArray,_operators_map,_util_isObject,_from PURE_IMPORTS_END */
	function forkJoin() {
	    var sources = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        sources[_i] = arguments[_i];
	    }
	    if (sources.length === 1) {
	        var first_1 = sources[0];
	        if (isArray(first_1)) {
	            return forkJoinInternal(first_1, null);
	        }
	        if (isObject(first_1) && Object.getPrototypeOf(first_1) === Object.prototype) {
	            var keys = Object.keys(first_1);
	            return forkJoinInternal(keys.map(function (key) { return first_1[key]; }), keys);
	        }
	    }
	    if (typeof sources[sources.length - 1] === 'function') {
	        var resultSelector_1 = sources.pop();
	        sources = (sources.length === 1 && isArray(sources[0])) ? sources[0] : sources;
	        return forkJoinInternal(sources, null).pipe(map(function (args) { return resultSelector_1.apply(void 0, args); }));
	    }
	    return forkJoinInternal(sources, null);
	}
	function forkJoinInternal(sources, keys) {
	    return new Observable(function (subscriber) {
	        var len = sources.length;
	        if (len === 0) {
	            subscriber.complete();
	            return;
	        }
	        var values = new Array(len);
	        var completed = 0;
	        var emitted = 0;
	        var _loop_1 = function (i) {
	            var source = from(sources[i]);
	            var hasValue = false;
	            subscriber.add(source.subscribe({
	                next: function (value) {
	                    if (!hasValue) {
	                        hasValue = true;
	                        emitted++;
	                    }
	                    values[i] = value;
	                },
	                error: function (err) { return subscriber.error(err); },
	                complete: function () {
	                    completed++;
	                    if (completed === len || !hasValue) {
	                        if (emitted === len) {
	                            subscriber.next(keys ?
	                                keys.reduce(function (result, key, i) { return (result[key] = values[i], result); }, {}) :
	                                values);
	                        }
	                        subscriber.complete();
	                    }
	                }
	            }));
	        };
	        for (var i = 0; i < len; i++) {
	            _loop_1(i);
	        }
	    });
	}

	/** PURE_IMPORTS_START _Observable,_util_isArray,_util_isFunction,_operators_map PURE_IMPORTS_END */
	function fromEvent(target, eventName, options, resultSelector) {
	    if (isFunction(options)) {
	        resultSelector = options;
	        options = undefined;
	    }
	    if (resultSelector) {
	        return fromEvent(target, eventName, options).pipe(map(function (args) { return isArray(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
	    }
	    return new Observable(function (subscriber) {
	        function handler(e) {
	            if (arguments.length > 1) {
	                subscriber.next(Array.prototype.slice.call(arguments));
	            }
	            else {
	                subscriber.next(e);
	            }
	        }
	        setupSubscription(target, eventName, handler, subscriber, options);
	    });
	}
	function setupSubscription(sourceObj, eventName, handler, subscriber, options) {
	    var unsubscribe;
	    if (isEventTarget(sourceObj)) {
	        var source_1 = sourceObj;
	        sourceObj.addEventListener(eventName, handler, options);
	        unsubscribe = function () { return source_1.removeEventListener(eventName, handler, options); };
	    }
	    else if (isJQueryStyleEventEmitter(sourceObj)) {
	        var source_2 = sourceObj;
	        sourceObj.on(eventName, handler);
	        unsubscribe = function () { return source_2.off(eventName, handler); };
	    }
	    else if (isNodeStyleEventEmitter(sourceObj)) {
	        var source_3 = sourceObj;
	        sourceObj.addListener(eventName, handler);
	        unsubscribe = function () { return source_3.removeListener(eventName, handler); };
	    }
	    else if (sourceObj && sourceObj.length) {
	        for (var i = 0, len = sourceObj.length; i < len; i++) {
	            setupSubscription(sourceObj[i], eventName, handler, subscriber, options);
	        }
	    }
	    else {
	        throw new TypeError('Invalid event target');
	    }
	    subscriber.add(unsubscribe);
	}
	function isNodeStyleEventEmitter(sourceObj) {
	    return sourceObj && typeof sourceObj.addListener === 'function' && typeof sourceObj.removeListener === 'function';
	}
	function isJQueryStyleEventEmitter(sourceObj) {
	    return sourceObj && typeof sourceObj.on === 'function' && typeof sourceObj.off === 'function';
	}
	function isEventTarget(sourceObj) {
	    return sourceObj && typeof sourceObj.addEventListener === 'function' && typeof sourceObj.removeEventListener === 'function';
	}

	/** PURE_IMPORTS_START _Observable,_util_isArray,_util_isFunction,_operators_map PURE_IMPORTS_END */
	function fromEventPattern(addHandler, removeHandler, resultSelector) {
	    if (resultSelector) {
	        return fromEventPattern(addHandler, removeHandler).pipe(map(function (args) { return isArray(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
	    }
	    return new Observable(function (subscriber) {
	        var handler = function () {
	            var e = [];
	            for (var _i = 0; _i < arguments.length; _i++) {
	                e[_i] = arguments[_i];
	            }
	            return subscriber.next(e.length === 1 ? e[0] : e);
	        };
	        var retValue;
	        try {
	            retValue = addHandler(handler);
	        }
	        catch (err) {
	            subscriber.error(err);
	            return undefined;
	        }
	        if (!isFunction(removeHandler)) {
	            return undefined;
	        }
	        return function () { return removeHandler(handler, retValue); };
	    });
	}

	/** PURE_IMPORTS_START _Observable,_util_identity,_util_isScheduler PURE_IMPORTS_END */
	function generate(initialStateOrOptions, condition, iterate, resultSelectorOrObservable, scheduler) {
	    var resultSelector;
	    var initialState;
	    if (arguments.length == 1) {
	        var options = initialStateOrOptions;
	        initialState = options.initialState;
	        condition = options.condition;
	        iterate = options.iterate;
	        resultSelector = options.resultSelector || identity;
	        scheduler = options.scheduler;
	    }
	    else if (resultSelectorOrObservable === undefined || isScheduler(resultSelectorOrObservable)) {
	        initialState = initialStateOrOptions;
	        resultSelector = identity;
	        scheduler = resultSelectorOrObservable;
	    }
	    else {
	        initialState = initialStateOrOptions;
	        resultSelector = resultSelectorOrObservable;
	    }
	    return new Observable(function (subscriber) {
	        var state = initialState;
	        if (scheduler) {
	            return scheduler.schedule(dispatch$3, 0, {
	                subscriber: subscriber,
	                iterate: iterate,
	                condition: condition,
	                resultSelector: resultSelector,
	                state: state
	            });
	        }
	        do {
	            if (condition) {
	                var conditionResult = void 0;
	                try {
	                    conditionResult = condition(state);
	                }
	                catch (err) {
	                    subscriber.error(err);
	                    return undefined;
	                }
	                if (!conditionResult) {
	                    subscriber.complete();
	                    break;
	                }
	            }
	            var value = void 0;
	            try {
	                value = resultSelector(state);
	            }
	            catch (err) {
	                subscriber.error(err);
	                return undefined;
	            }
	            subscriber.next(value);
	            if (subscriber.closed) {
	                break;
	            }
	            try {
	                state = iterate(state);
	            }
	            catch (err) {
	                subscriber.error(err);
	                return undefined;
	            }
	        } while (true);
	        return undefined;
	    });
	}
	function dispatch$3(state) {
	    var subscriber = state.subscriber, condition = state.condition;
	    if (subscriber.closed) {
	        return undefined;
	    }
	    if (state.needIterate) {
	        try {
	            state.state = state.iterate(state.state);
	        }
	        catch (err) {
	            subscriber.error(err);
	            return undefined;
	        }
	    }
	    else {
	        state.needIterate = true;
	    }
	    if (condition) {
	        var conditionResult = void 0;
	        try {
	            conditionResult = condition(state.state);
	        }
	        catch (err) {
	            subscriber.error(err);
	            return undefined;
	        }
	        if (!conditionResult) {
	            subscriber.complete();
	            return undefined;
	        }
	        if (subscriber.closed) {
	            return undefined;
	        }
	    }
	    var value;
	    try {
	        value = state.resultSelector(state.state);
	    }
	    catch (err) {
	        subscriber.error(err);
	        return undefined;
	    }
	    if (subscriber.closed) {
	        return undefined;
	    }
	    subscriber.next(value);
	    if (subscriber.closed) {
	        return undefined;
	    }
	    return this.schedule(state);
	}

	/** PURE_IMPORTS_START _defer,_empty PURE_IMPORTS_END */
	function iif(condition, trueResult, falseResult) {
	    if (trueResult === void 0) {
	        trueResult = EMPTY;
	    }
	    if (falseResult === void 0) {
	        falseResult = EMPTY;
	    }
	    return defer(function () { return condition() ? trueResult : falseResult; });
	}

	/** PURE_IMPORTS_START _isArray PURE_IMPORTS_END */
	function isNumeric(val) {
	    return !isArray(val) && (val - parseFloat(val) + 1) >= 0;
	}

	/** PURE_IMPORTS_START _Observable,_scheduler_async,_util_isNumeric PURE_IMPORTS_END */
	function interval(period, scheduler) {
	    if (period === void 0) {
	        period = 0;
	    }
	    if (scheduler === void 0) {
	        scheduler = async;
	    }
	    if (!isNumeric(period) || period < 0) {
	        period = 0;
	    }
	    if (!scheduler || typeof scheduler.schedule !== 'function') {
	        scheduler = async;
	    }
	    return new Observable(function (subscriber) {
	        subscriber.add(scheduler.schedule(dispatch$4, period, { subscriber: subscriber, counter: 0, period: period }));
	        return subscriber;
	    });
	}
	function dispatch$4(state) {
	    var subscriber = state.subscriber, counter = state.counter, period = state.period;
	    subscriber.next(counter);
	    this.schedule({ subscriber: subscriber, counter: counter + 1, period: period }, period);
	}

	/** PURE_IMPORTS_START _Observable,_util_isScheduler,_operators_mergeAll,_fromArray PURE_IMPORTS_END */
	function merge() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    var concurrent = Number.POSITIVE_INFINITY;
	    var scheduler = null;
	    var last = observables[observables.length - 1];
	    if (isScheduler(last)) {
	        scheduler = observables.pop();
	        if (observables.length > 1 && typeof observables[observables.length - 1] === 'number') {
	            concurrent = observables.pop();
	        }
	    }
	    else if (typeof last === 'number') {
	        concurrent = observables.pop();
	    }
	    if (scheduler === null && observables.length === 1 && observables[0] instanceof Observable) {
	        return observables[0];
	    }
	    return mergeAll(concurrent)(fromArray(observables, scheduler));
	}

	/** PURE_IMPORTS_START _Observable,_util_noop PURE_IMPORTS_END */
	var NEVER = /*@__PURE__*/ new Observable(noop);
	function never() {
	    return NEVER;
	}

	/** PURE_IMPORTS_START _Observable,_from,_util_isArray,_empty PURE_IMPORTS_END */
	function onErrorResumeNext() {
	    var sources = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        sources[_i] = arguments[_i];
	    }
	    if (sources.length === 0) {
	        return EMPTY;
	    }
	    var first = sources[0], remainder = sources.slice(1);
	    if (sources.length === 1 && isArray(first)) {
	        return onErrorResumeNext.apply(void 0, first);
	    }
	    return new Observable(function (subscriber) {
	        var subNext = function () { return subscriber.add(onErrorResumeNext.apply(void 0, remainder).subscribe(subscriber)); };
	        return from(first).subscribe({
	            next: function (value) { subscriber.next(value); },
	            error: subNext,
	            complete: subNext,
	        });
	    });
	}

	/** PURE_IMPORTS_START _Observable,_Subscription PURE_IMPORTS_END */
	function pairs(obj, scheduler) {
	    if (!scheduler) {
	        return new Observable(function (subscriber) {
	            var keys = Object.keys(obj);
	            for (var i = 0; i < keys.length && !subscriber.closed; i++) {
	                var key = keys[i];
	                if (obj.hasOwnProperty(key)) {
	                    subscriber.next([key, obj[key]]);
	                }
	            }
	            subscriber.complete();
	        });
	    }
	    else {
	        return new Observable(function (subscriber) {
	            var keys = Object.keys(obj);
	            var subscription = new Subscription();
	            subscription.add(scheduler.schedule(dispatch$5, 0, { keys: keys, index: 0, subscriber: subscriber, subscription: subscription, obj: obj }));
	            return subscription;
	        });
	    }
	}
	function dispatch$5(state) {
	    var keys = state.keys, index = state.index, subscriber = state.subscriber, subscription = state.subscription, obj = state.obj;
	    if (!subscriber.closed) {
	        if (index < keys.length) {
	            var key = keys[index];
	            subscriber.next([key, obj[key]]);
	            subscription.add(this.schedule({ keys: keys, index: index + 1, subscriber: subscriber, subscription: subscription, obj: obj }));
	        }
	        else {
	            subscriber.complete();
	        }
	    }
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function not$1(pred, thisArg) {
	    function notPred() {
	        return !(notPred.pred.apply(notPred.thisArg, arguments));
	    }
	    notPred.pred = pred;
	    notPred.thisArg = thisArg;
	    return notPred;
	}

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function filter(predicate, thisArg) {
	    return function filterOperatorFunction(source) {
	        return source.lift(new FilterOperator(predicate, thisArg));
	    };
	}
	var FilterOperator = /*@__PURE__*/ (function () {
	    function FilterOperator(predicate, thisArg) {
	        this.predicate = predicate;
	        this.thisArg = thisArg;
	    }
	    FilterOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new FilterSubscriber(subscriber, this.predicate, this.thisArg));
	    };
	    return FilterOperator;
	}());
	var FilterSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(FilterSubscriber, _super);
	    function FilterSubscriber(destination, predicate, thisArg) {
	        var _this = _super.call(this, destination) || this;
	        _this.predicate = predicate;
	        _this.thisArg = thisArg;
	        _this.count = 0;
	        return _this;
	    }
	    FilterSubscriber.prototype._next = function (value) {
	        var result;
	        try {
	            result = this.predicate.call(this.thisArg, value, this.count++);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        if (result) {
	            this.destination.next(value);
	        }
	    };
	    return FilterSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _util_not,_util_subscribeTo,_operators_filter,_Observable PURE_IMPORTS_END */
	function partition(source, predicate, thisArg) {
	    return [
	        filter(predicate, thisArg)(new Observable(subscribeTo(source))),
	        filter(not$1(predicate, thisArg))(new Observable(subscribeTo(source)))
	    ];
	}

	/** PURE_IMPORTS_START tslib,_util_isArray,_fromArray,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
	function race() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    if (observables.length === 1) {
	        if (isArray(observables[0])) {
	            observables = observables[0];
	        }
	        else {
	            return observables[0];
	        }
	    }
	    return fromArray(observables, undefined).lift(new RaceOperator());
	}
	var RaceOperator = /*@__PURE__*/ (function () {
	    function RaceOperator() {
	    }
	    RaceOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new RaceSubscriber(subscriber));
	    };
	    return RaceOperator;
	}());
	var RaceSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(RaceSubscriber, _super);
	    function RaceSubscriber(destination) {
	        var _this = _super.call(this, destination) || this;
	        _this.hasFirst = false;
	        _this.observables = [];
	        _this.subscriptions = [];
	        return _this;
	    }
	    RaceSubscriber.prototype._next = function (observable) {
	        this.observables.push(observable);
	    };
	    RaceSubscriber.prototype._complete = function () {
	        var observables = this.observables;
	        var len = observables.length;
	        if (len === 0) {
	            this.destination.complete();
	        }
	        else {
	            for (var i = 0; i < len && !this.hasFirst; i++) {
	                var observable = observables[i];
	                var subscription = subscribeToResult(this, observable, undefined, i);
	                if (this.subscriptions) {
	                    this.subscriptions.push(subscription);
	                }
	                this.add(subscription);
	            }
	            this.observables = null;
	        }
	    };
	    RaceSubscriber.prototype.notifyNext = function (_outerValue, innerValue, outerIndex) {
	        if (!this.hasFirst) {
	            this.hasFirst = true;
	            for (var i = 0; i < this.subscriptions.length; i++) {
	                if (i !== outerIndex) {
	                    var subscription = this.subscriptions[i];
	                    subscription.unsubscribe();
	                    this.remove(subscription);
	                }
	            }
	            this.subscriptions = null;
	        }
	        this.destination.next(innerValue);
	    };
	    return RaceSubscriber;
	}(OuterSubscriber));

	/** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
	function range(start, count, scheduler) {
	    if (start === void 0) {
	        start = 0;
	    }
	    return new Observable(function (subscriber) {
	        if (count === undefined) {
	            count = start;
	            start = 0;
	        }
	        var index = 0;
	        var current = start;
	        if (scheduler) {
	            return scheduler.schedule(dispatch$6, 0, {
	                index: index, count: count, start: start, subscriber: subscriber
	            });
	        }
	        else {
	            do {
	                if (index++ >= count) {
	                    subscriber.complete();
	                    break;
	                }
	                subscriber.next(current++);
	                if (subscriber.closed) {
	                    break;
	                }
	            } while (true);
	        }
	        return undefined;
	    });
	}
	function dispatch$6(state) {
	    var start = state.start, index = state.index, count = state.count, subscriber = state.subscriber;
	    if (index >= count) {
	        subscriber.complete();
	        return;
	    }
	    subscriber.next(start);
	    if (subscriber.closed) {
	        return;
	    }
	    state.index = index + 1;
	    state.start = start + 1;
	    this.schedule(state);
	}

	/** PURE_IMPORTS_START _Observable,_scheduler_async,_util_isNumeric,_util_isScheduler PURE_IMPORTS_END */
	function timer(dueTime, periodOrScheduler, scheduler) {
	    if (dueTime === void 0) {
	        dueTime = 0;
	    }
	    var period = -1;
	    if (isNumeric(periodOrScheduler)) {
	        period = Number(periodOrScheduler) < 1 && 1 || Number(periodOrScheduler);
	    }
	    else if (isScheduler(periodOrScheduler)) {
	        scheduler = periodOrScheduler;
	    }
	    if (!isScheduler(scheduler)) {
	        scheduler = async;
	    }
	    return new Observable(function (subscriber) {
	        var due = isNumeric(dueTime)
	            ? dueTime
	            : (+dueTime - scheduler.now());
	        return scheduler.schedule(dispatch$7, due, {
	            index: 0, period: period, subscriber: subscriber
	        });
	    });
	}
	function dispatch$7(state) {
	    var index = state.index, period = state.period, subscriber = state.subscriber;
	    subscriber.next(index);
	    if (subscriber.closed) {
	        return;
	    }
	    else if (period === -1) {
	        return subscriber.complete();
	    }
	    state.index = index + 1;
	    this.schedule(state, period);
	}

	/** PURE_IMPORTS_START _Observable,_from,_empty PURE_IMPORTS_END */
	function using(resourceFactory, observableFactory) {
	    return new Observable(function (subscriber) {
	        var resource;
	        try {
	            resource = resourceFactory();
	        }
	        catch (err) {
	            subscriber.error(err);
	            return undefined;
	        }
	        var result;
	        try {
	            result = observableFactory(resource);
	        }
	        catch (err) {
	            subscriber.error(err);
	            return undefined;
	        }
	        var source = result ? from(result) : EMPTY;
	        var subscription = source.subscribe(subscriber);
	        return function () {
	            subscription.unsubscribe();
	            if (resource) {
	                resource.unsubscribe();
	            }
	        };
	    });
	}

	/** PURE_IMPORTS_START tslib,_fromArray,_util_isArray,_Subscriber,_.._internal_symbol_iterator,_innerSubscribe PURE_IMPORTS_END */
	function zip() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    var resultSelector = observables[observables.length - 1];
	    if (typeof resultSelector === 'function') {
	        observables.pop();
	    }
	    return fromArray(observables, undefined).lift(new ZipOperator(resultSelector));
	}
	var ZipOperator = /*@__PURE__*/ (function () {
	    function ZipOperator(resultSelector) {
	        this.resultSelector = resultSelector;
	    }
	    ZipOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new ZipSubscriber(subscriber, this.resultSelector));
	    };
	    return ZipOperator;
	}());
	var ZipSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(ZipSubscriber, _super);
	    function ZipSubscriber(destination, resultSelector, values) {
	        var _this = _super.call(this, destination) || this;
	        _this.resultSelector = resultSelector;
	        _this.iterators = [];
	        _this.active = 0;
	        _this.resultSelector = (typeof resultSelector === 'function') ? resultSelector : undefined;
	        return _this;
	    }
	    ZipSubscriber.prototype._next = function (value) {
	        var iterators = this.iterators;
	        if (isArray(value)) {
	            iterators.push(new StaticArrayIterator(value));
	        }
	        else if (typeof value[iterator] === 'function') {
	            iterators.push(new StaticIterator(value[iterator]()));
	        }
	        else {
	            iterators.push(new ZipBufferIterator(this.destination, this, value));
	        }
	    };
	    ZipSubscriber.prototype._complete = function () {
	        var iterators = this.iterators;
	        var len = iterators.length;
	        this.unsubscribe();
	        if (len === 0) {
	            this.destination.complete();
	            return;
	        }
	        this.active = len;
	        for (var i = 0; i < len; i++) {
	            var iterator = iterators[i];
	            if (iterator.stillUnsubscribed) {
	                var destination = this.destination;
	                destination.add(iterator.subscribe());
	            }
	            else {
	                this.active--;
	            }
	        }
	    };
	    ZipSubscriber.prototype.notifyInactive = function () {
	        this.active--;
	        if (this.active === 0) {
	            this.destination.complete();
	        }
	    };
	    ZipSubscriber.prototype.checkIterators = function () {
	        var iterators = this.iterators;
	        var len = iterators.length;
	        var destination = this.destination;
	        for (var i = 0; i < len; i++) {
	            var iterator = iterators[i];
	            if (typeof iterator.hasValue === 'function' && !iterator.hasValue()) {
	                return;
	            }
	        }
	        var shouldComplete = false;
	        var args = [];
	        for (var i = 0; i < len; i++) {
	            var iterator = iterators[i];
	            var result = iterator.next();
	            if (iterator.hasCompleted()) {
	                shouldComplete = true;
	            }
	            if (result.done) {
	                destination.complete();
	                return;
	            }
	            args.push(result.value);
	        }
	        if (this.resultSelector) {
	            this._tryresultSelector(args);
	        }
	        else {
	            destination.next(args);
	        }
	        if (shouldComplete) {
	            destination.complete();
	        }
	    };
	    ZipSubscriber.prototype._tryresultSelector = function (args) {
	        var result;
	        try {
	            result = this.resultSelector.apply(this, args);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        this.destination.next(result);
	    };
	    return ZipSubscriber;
	}(Subscriber));
	var StaticIterator = /*@__PURE__*/ (function () {
	    function StaticIterator(iterator) {
	        this.iterator = iterator;
	        this.nextResult = iterator.next();
	    }
	    StaticIterator.prototype.hasValue = function () {
	        return true;
	    };
	    StaticIterator.prototype.next = function () {
	        var result = this.nextResult;
	        this.nextResult = this.iterator.next();
	        return result;
	    };
	    StaticIterator.prototype.hasCompleted = function () {
	        var nextResult = this.nextResult;
	        return Boolean(nextResult && nextResult.done);
	    };
	    return StaticIterator;
	}());
	var StaticArrayIterator = /*@__PURE__*/ (function () {
	    function StaticArrayIterator(array) {
	        this.array = array;
	        this.index = 0;
	        this.length = 0;
	        this.length = array.length;
	    }
	    StaticArrayIterator.prototype[iterator] = function () {
	        return this;
	    };
	    StaticArrayIterator.prototype.next = function (value) {
	        var i = this.index++;
	        var array = this.array;
	        return i < this.length ? { value: array[i], done: false } : { value: null, done: true };
	    };
	    StaticArrayIterator.prototype.hasValue = function () {
	        return this.array.length > this.index;
	    };
	    StaticArrayIterator.prototype.hasCompleted = function () {
	        return this.array.length === this.index;
	    };
	    return StaticArrayIterator;
	}());
	var ZipBufferIterator = /*@__PURE__*/ (function (_super) {
	    __extends(ZipBufferIterator, _super);
	    function ZipBufferIterator(destination, parent, observable) {
	        var _this = _super.call(this, destination) || this;
	        _this.parent = parent;
	        _this.observable = observable;
	        _this.stillUnsubscribed = true;
	        _this.buffer = [];
	        _this.isComplete = false;
	        return _this;
	    }
	    ZipBufferIterator.prototype[iterator] = function () {
	        return this;
	    };
	    ZipBufferIterator.prototype.next = function () {
	        var buffer = this.buffer;
	        if (buffer.length === 0 && this.isComplete) {
	            return { value: null, done: true };
	        }
	        else {
	            return { value: buffer.shift(), done: false };
	        }
	    };
	    ZipBufferIterator.prototype.hasValue = function () {
	        return this.buffer.length > 0;
	    };
	    ZipBufferIterator.prototype.hasCompleted = function () {
	        return this.buffer.length === 0 && this.isComplete;
	    };
	    ZipBufferIterator.prototype.notifyComplete = function () {
	        if (this.buffer.length > 0) {
	            this.isComplete = true;
	            this.parent.notifyInactive();
	        }
	        else {
	            this.destination.complete();
	        }
	    };
	    ZipBufferIterator.prototype.notifyNext = function (innerValue) {
	        this.buffer.push(innerValue);
	        this.parent.checkIterators();
	    };
	    ZipBufferIterator.prototype.subscribe = function () {
	        return innerSubscribe(this.observable, new SimpleInnerSubscriber(this));
	    };
	    return ZipBufferIterator;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */

	var _esm5 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		Observable: Observable,
		ConnectableObservable: ConnectableObservable,
		GroupedObservable: GroupedObservable,
		observable: observable,
		Subject: Subject,
		BehaviorSubject: BehaviorSubject,
		ReplaySubject: ReplaySubject,
		AsyncSubject: AsyncSubject,
		asap: asap,
		asapScheduler: asapScheduler,
		async: async,
		asyncScheduler: asyncScheduler,
		queue: queue,
		queueScheduler: queueScheduler,
		animationFrame: animationFrame,
		animationFrameScheduler: animationFrameScheduler,
		VirtualTimeScheduler: VirtualTimeScheduler,
		VirtualAction: VirtualAction,
		Scheduler: Scheduler,
		Subscription: Subscription,
		Subscriber: Subscriber,
		Notification: Notification,
		get NotificationKind () { return NotificationKind; },
		pipe: pipe,
		noop: noop,
		identity: identity,
		isObservable: isObservable,
		ArgumentOutOfRangeError: ArgumentOutOfRangeError,
		EmptyError: EmptyError,
		ObjectUnsubscribedError: ObjectUnsubscribedError,
		UnsubscriptionError: UnsubscriptionError,
		TimeoutError: TimeoutError,
		bindCallback: bindCallback,
		bindNodeCallback: bindNodeCallback,
		combineLatest: combineLatest,
		concat: concat,
		defer: defer,
		empty: empty$1,
		forkJoin: forkJoin,
		from: from,
		fromEvent: fromEvent,
		fromEventPattern: fromEventPattern,
		generate: generate,
		iif: iif,
		interval: interval,
		merge: merge,
		never: never,
		of: of,
		onErrorResumeNext: onErrorResumeNext,
		pairs: pairs,
		partition: partition,
		race: race,
		range: range,
		throwError: throwError,
		timer: timer,
		using: using,
		zip: zip,
		scheduled: scheduled,
		EMPTY: EMPTY,
		NEVER: NEVER,
		config: config
	});

	/** PURE_IMPORTS_START _Observable,_util_subscribeToPromise,_scheduled_schedulePromise PURE_IMPORTS_END */
	function fromPromise(input, scheduler) {
	    if (!scheduler) {
	        return new Observable(subscribeToPromise(input));
	    }
	    else {
	        return schedulePromise(input, scheduler);
	    }
	}

	/** PURE_IMPORTS_START _Observable,_util_subscribeToIterable,_scheduled_scheduleIterable PURE_IMPORTS_END */
	function fromIterable(input, scheduler) {
	    if (!input) {
	        throw new Error('Iterable cannot be null');
	    }
	    if (!scheduler) {
	        return new Observable(subscribeToIterable(input));
	    }
	    else {
	        return scheduleIterable(input, scheduler);
	    }
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var __window = typeof window !== 'undefined' && window;
	var __self = typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined' &&
	    self instanceof WorkerGlobalScope && self;
	var __global = typeof global !== 'undefined' && global;
	var _root = __window || __global || __self;

	/** PURE_IMPORTS_START tslib,_.._util_root,_.._Observable,_.._Subscriber,_.._operators_map PURE_IMPORTS_END */
	function getCORSRequest() {
	    if (_root.XMLHttpRequest) {
	        return new _root.XMLHttpRequest();
	    }
	    else if (!!_root.XDomainRequest) {
	        return new _root.XDomainRequest();
	    }
	    else {
	        throw new Error('CORS is not supported by your browser');
	    }
	}
	function getXMLHttpRequest() {
	    if (_root.XMLHttpRequest) {
	        return new _root.XMLHttpRequest();
	    }
	    else {
	        var progId = void 0;
	        try {
	            var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
	            for (var i = 0; i < 3; i++) {
	                try {
	                    progId = progIds[i];
	                    if (new _root.ActiveXObject(progId)) {
	                        break;
	                    }
	                }
	                catch (e) {
	                }
	            }
	            return new _root.ActiveXObject(progId);
	        }
	        catch (e) {
	            throw new Error('XMLHttpRequest is not supported by your browser');
	        }
	    }
	}
	function ajaxGet(url, headers) {
	    if (headers === void 0) {
	        headers = null;
	    }
	    return new AjaxObservable({ method: 'GET', url: url, headers: headers });
	}
	function ajaxPost(url, body, headers) {
	    return new AjaxObservable({ method: 'POST', url: url, body: body, headers: headers });
	}
	function ajaxDelete(url, headers) {
	    return new AjaxObservable({ method: 'DELETE', url: url, headers: headers });
	}
	function ajaxPut(url, body, headers) {
	    return new AjaxObservable({ method: 'PUT', url: url, body: body, headers: headers });
	}
	function ajaxPatch(url, body, headers) {
	    return new AjaxObservable({ method: 'PATCH', url: url, body: body, headers: headers });
	}
	var mapResponse = /*@__PURE__*/ map(function (x, index) { return x.response; });
	function ajaxGetJSON(url, headers) {
	    return mapResponse(new AjaxObservable({
	        method: 'GET',
	        url: url,
	        responseType: 'json',
	        headers: headers
	    }));
	}
	var AjaxObservable = /*@__PURE__*/ (function (_super) {
	    __extends(AjaxObservable, _super);
	    function AjaxObservable(urlOrRequest) {
	        var _this = _super.call(this) || this;
	        var request = {
	            async: true,
	            createXHR: function () {
	                return this.crossDomain ? getCORSRequest() : getXMLHttpRequest();
	            },
	            crossDomain: true,
	            withCredentials: false,
	            headers: {},
	            method: 'GET',
	            responseType: 'json',
	            timeout: 0
	        };
	        if (typeof urlOrRequest === 'string') {
	            request.url = urlOrRequest;
	        }
	        else {
	            for (var prop in urlOrRequest) {
	                if (urlOrRequest.hasOwnProperty(prop)) {
	                    request[prop] = urlOrRequest[prop];
	                }
	            }
	        }
	        _this.request = request;
	        return _this;
	    }
	    AjaxObservable.prototype._subscribe = function (subscriber) {
	        return new AjaxSubscriber(subscriber, this.request);
	    };
	    AjaxObservable.create = (function () {
	        var create = function (urlOrRequest) {
	            return new AjaxObservable(urlOrRequest);
	        };
	        create.get = ajaxGet;
	        create.post = ajaxPost;
	        create.delete = ajaxDelete;
	        create.put = ajaxPut;
	        create.patch = ajaxPatch;
	        create.getJSON = ajaxGetJSON;
	        return create;
	    })();
	    return AjaxObservable;
	}(Observable));
	var AjaxSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(AjaxSubscriber, _super);
	    function AjaxSubscriber(destination, request) {
	        var _this = _super.call(this, destination) || this;
	        _this.request = request;
	        _this.done = false;
	        var headers = request.headers = request.headers || {};
	        if (!request.crossDomain && !_this.getHeader(headers, 'X-Requested-With')) {
	            headers['X-Requested-With'] = 'XMLHttpRequest';
	        }
	        var contentTypeHeader = _this.getHeader(headers, 'Content-Type');
	        if (!contentTypeHeader && !(_root.FormData && request.body instanceof _root.FormData) && typeof request.body !== 'undefined') {
	            headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
	        }
	        request.body = _this.serializeBody(request.body, _this.getHeader(request.headers, 'Content-Type'));
	        _this.send();
	        return _this;
	    }
	    AjaxSubscriber.prototype.next = function (e) {
	        this.done = true;
	        var _a = this, xhr = _a.xhr, request = _a.request, destination = _a.destination;
	        var result;
	        try {
	            result = new AjaxResponse(e, xhr, request);
	        }
	        catch (err) {
	            return destination.error(err);
	        }
	        destination.next(result);
	    };
	    AjaxSubscriber.prototype.send = function () {
	        var _a = this, request = _a.request, _b = _a.request, user = _b.user, method = _b.method, url = _b.url, async = _b.async, password = _b.password, headers = _b.headers, body = _b.body;
	        try {
	            var xhr = this.xhr = request.createXHR();
	            this.setupEvents(xhr, request);
	            if (user) {
	                xhr.open(method, url, async, user, password);
	            }
	            else {
	                xhr.open(method, url, async);
	            }
	            if (async) {
	                xhr.timeout = request.timeout;
	                xhr.responseType = request.responseType;
	            }
	            if ('withCredentials' in xhr) {
	                xhr.withCredentials = !!request.withCredentials;
	            }
	            this.setHeaders(xhr, headers);
	            if (body) {
	                xhr.send(body);
	            }
	            else {
	                xhr.send();
	            }
	        }
	        catch (err) {
	            this.error(err);
	        }
	    };
	    AjaxSubscriber.prototype.serializeBody = function (body, contentType) {
	        if (!body || typeof body === 'string') {
	            return body;
	        }
	        else if (_root.FormData && body instanceof _root.FormData) {
	            return body;
	        }
	        if (contentType) {
	            var splitIndex = contentType.indexOf(';');
	            if (splitIndex !== -1) {
	                contentType = contentType.substring(0, splitIndex);
	            }
	        }
	        switch (contentType) {
	            case 'application/x-www-form-urlencoded':
	                return Object.keys(body).map(function (key) { return encodeURIComponent(key) + "=" + encodeURIComponent(body[key]); }).join('&');
	            case 'application/json':
	                return JSON.stringify(body);
	            default:
	                return body;
	        }
	    };
	    AjaxSubscriber.prototype.setHeaders = function (xhr, headers) {
	        for (var key in headers) {
	            if (headers.hasOwnProperty(key)) {
	                xhr.setRequestHeader(key, headers[key]);
	            }
	        }
	    };
	    AjaxSubscriber.prototype.getHeader = function (headers, headerName) {
	        for (var key in headers) {
	            if (key.toLowerCase() === headerName.toLowerCase()) {
	                return headers[key];
	            }
	        }
	        return undefined;
	    };
	    AjaxSubscriber.prototype.setupEvents = function (xhr, request) {
	        var progressSubscriber = request.progressSubscriber;
	        function xhrTimeout(e) {
	            var _a = xhrTimeout, subscriber = _a.subscriber, progressSubscriber = _a.progressSubscriber, request = _a.request;
	            if (progressSubscriber) {
	                progressSubscriber.error(e);
	            }
	            var error;
	            try {
	                error = new AjaxTimeoutError(this, request);
	            }
	            catch (err) {
	                error = err;
	            }
	            subscriber.error(error);
	        }
	        xhr.ontimeout = xhrTimeout;
	        xhrTimeout.request = request;
	        xhrTimeout.subscriber = this;
	        xhrTimeout.progressSubscriber = progressSubscriber;
	        if (xhr.upload && 'withCredentials' in xhr) {
	            if (progressSubscriber) {
	                var xhrProgress_1;
	                xhrProgress_1 = function (e) {
	                    var progressSubscriber = xhrProgress_1.progressSubscriber;
	                    progressSubscriber.next(e);
	                };
	                if (_root.XDomainRequest) {
	                    xhr.onprogress = xhrProgress_1;
	                }
	                else {
	                    xhr.upload.onprogress = xhrProgress_1;
	                }
	                xhrProgress_1.progressSubscriber = progressSubscriber;
	            }
	            var xhrError_1;
	            xhrError_1 = function (e) {
	                var _a = xhrError_1, progressSubscriber = _a.progressSubscriber, subscriber = _a.subscriber, request = _a.request;
	                if (progressSubscriber) {
	                    progressSubscriber.error(e);
	                }
	                var error;
	                try {
	                    error = new AjaxError('ajax error', this, request);
	                }
	                catch (err) {
	                    error = err;
	                }
	                subscriber.error(error);
	            };
	            xhr.onerror = xhrError_1;
	            xhrError_1.request = request;
	            xhrError_1.subscriber = this;
	            xhrError_1.progressSubscriber = progressSubscriber;
	        }
	        function xhrReadyStateChange(e) {
	            return;
	        }
	        xhr.onreadystatechange = xhrReadyStateChange;
	        xhrReadyStateChange.subscriber = this;
	        xhrReadyStateChange.progressSubscriber = progressSubscriber;
	        xhrReadyStateChange.request = request;
	        function xhrLoad(e) {
	            var _a = xhrLoad, subscriber = _a.subscriber, progressSubscriber = _a.progressSubscriber, request = _a.request;
	            if (this.readyState === 4) {
	                var status_1 = this.status === 1223 ? 204 : this.status;
	                var response = (this.responseType === 'text' ? (this.response || this.responseText) : this.response);
	                if (status_1 === 0) {
	                    status_1 = response ? 200 : 0;
	                }
	                if (status_1 < 400) {
	                    if (progressSubscriber) {
	                        progressSubscriber.complete();
	                    }
	                    subscriber.next(e);
	                    subscriber.complete();
	                }
	                else {
	                    if (progressSubscriber) {
	                        progressSubscriber.error(e);
	                    }
	                    var error = void 0;
	                    try {
	                        error = new AjaxError('ajax error ' + status_1, this, request);
	                    }
	                    catch (err) {
	                        error = err;
	                    }
	                    subscriber.error(error);
	                }
	            }
	        }
	        xhr.onload = xhrLoad;
	        xhrLoad.subscriber = this;
	        xhrLoad.progressSubscriber = progressSubscriber;
	        xhrLoad.request = request;
	    };
	    AjaxSubscriber.prototype.unsubscribe = function () {
	        var _a = this, done = _a.done, xhr = _a.xhr;
	        if (!done && xhr && xhr.readyState !== 4 && typeof xhr.abort === 'function') {
	            xhr.abort();
	        }
	        _super.prototype.unsubscribe.call(this);
	    };
	    return AjaxSubscriber;
	}(Subscriber));
	var AjaxResponse = /*@__PURE__*/ (function () {
	    function AjaxResponse(originalEvent, xhr, request) {
	        this.originalEvent = originalEvent;
	        this.xhr = xhr;
	        this.request = request;
	        this.status = xhr.status;
	        this.responseType = xhr.responseType || request.responseType;
	        this.response = parseXhrResponse(this.responseType, xhr);
	    }
	    return AjaxResponse;
	}());
	var AjaxErrorImpl = /*@__PURE__*/ (function () {
	    function AjaxErrorImpl(message, xhr, request) {
	        Error.call(this);
	        this.message = message;
	        this.name = 'AjaxError';
	        this.xhr = xhr;
	        this.request = request;
	        this.status = xhr.status;
	        this.responseType = xhr.responseType || request.responseType;
	        this.response = parseXhrResponse(this.responseType, xhr);
	        return this;
	    }
	    AjaxErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
	    return AjaxErrorImpl;
	})();
	var AjaxError = AjaxErrorImpl;
	function parseJson(xhr) {
	    if ('response' in xhr) {
	        return xhr.responseType ? xhr.response : JSON.parse(xhr.response || xhr.responseText || 'null');
	    }
	    else {
	        return JSON.parse(xhr.responseText || 'null');
	    }
	}
	function parseXhrResponse(responseType, xhr) {
	    switch (responseType) {
	        case 'json':
	            return parseJson(xhr);
	        case 'xml':
	            return xhr.responseXML;
	        case 'text':
	        default:
	            return ('response' in xhr) ? xhr.response : xhr.responseText;
	    }
	}
	function AjaxTimeoutErrorImpl(xhr, request) {
	    AjaxError.call(this, 'ajax timeout', xhr, request);
	    this.name = 'AjaxTimeoutError';
	    return this;
	}
	var AjaxTimeoutError = AjaxTimeoutErrorImpl;

	/** PURE_IMPORTS_START _AjaxObservable PURE_IMPORTS_END */
	var ajax = /*@__PURE__*/ (function () { return AjaxObservable.create; })();

	/** PURE_IMPORTS_START tslib,_.._Subject,_.._Subscriber,_.._Observable,_.._Subscription,_.._ReplaySubject PURE_IMPORTS_END */
	var DEFAULT_WEBSOCKET_CONFIG = {
	    url: '',
	    deserializer: function (e) { return JSON.parse(e.data); },
	    serializer: function (value) { return JSON.stringify(value); },
	};
	var WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT = 'WebSocketSubject.error must be called with an object with an error code, and an optional reason: { code: number, reason: string }';
	var WebSocketSubject = /*@__PURE__*/ (function (_super) {
	    __extends(WebSocketSubject, _super);
	    function WebSocketSubject(urlConfigOrSource, destination) {
	        var _this = _super.call(this) || this;
	        if (urlConfigOrSource instanceof Observable) {
	            _this.destination = destination;
	            _this.source = urlConfigOrSource;
	        }
	        else {
	            var config = _this._config = __assign({}, DEFAULT_WEBSOCKET_CONFIG);
	            _this._output = new Subject();
	            if (typeof urlConfigOrSource === 'string') {
	                config.url = urlConfigOrSource;
	            }
	            else {
	                for (var key in urlConfigOrSource) {
	                    if (urlConfigOrSource.hasOwnProperty(key)) {
	                        config[key] = urlConfigOrSource[key];
	                    }
	                }
	            }
	            if (!config.WebSocketCtor && WebSocket) {
	                config.WebSocketCtor = WebSocket;
	            }
	            else if (!config.WebSocketCtor) {
	                throw new Error('no WebSocket constructor can be found');
	            }
	            _this.destination = new ReplaySubject();
	        }
	        return _this;
	    }
	    WebSocketSubject.prototype.lift = function (operator) {
	        var sock = new WebSocketSubject(this._config, this.destination);
	        sock.operator = operator;
	        sock.source = this;
	        return sock;
	    };
	    WebSocketSubject.prototype._resetState = function () {
	        this._socket = null;
	        if (!this.source) {
	            this.destination = new ReplaySubject();
	        }
	        this._output = new Subject();
	    };
	    WebSocketSubject.prototype.multiplex = function (subMsg, unsubMsg, messageFilter) {
	        var self = this;
	        return new Observable(function (observer) {
	            try {
	                self.next(subMsg());
	            }
	            catch (err) {
	                observer.error(err);
	            }
	            var subscription = self.subscribe(function (x) {
	                try {
	                    if (messageFilter(x)) {
	                        observer.next(x);
	                    }
	                }
	                catch (err) {
	                    observer.error(err);
	                }
	            }, function (err) { return observer.error(err); }, function () { return observer.complete(); });
	            return function () {
	                try {
	                    self.next(unsubMsg());
	                }
	                catch (err) {
	                    observer.error(err);
	                }
	                subscription.unsubscribe();
	            };
	        });
	    };
	    WebSocketSubject.prototype._connectSocket = function () {
	        var _this = this;
	        var _a = this._config, WebSocketCtor = _a.WebSocketCtor, protocol = _a.protocol, url = _a.url, binaryType = _a.binaryType;
	        var observer = this._output;
	        var socket = null;
	        try {
	            socket = protocol ?
	                new WebSocketCtor(url, protocol) :
	                new WebSocketCtor(url);
	            this._socket = socket;
	            if (binaryType) {
	                this._socket.binaryType = binaryType;
	            }
	        }
	        catch (e) {
	            observer.error(e);
	            return;
	        }
	        var subscription = new Subscription(function () {
	            _this._socket = null;
	            if (socket && socket.readyState === 1) {
	                socket.close();
	            }
	        });
	        socket.onopen = function (e) {
	            var _socket = _this._socket;
	            if (!_socket) {
	                socket.close();
	                _this._resetState();
	                return;
	            }
	            var openObserver = _this._config.openObserver;
	            if (openObserver) {
	                openObserver.next(e);
	            }
	            var queue = _this.destination;
	            _this.destination = Subscriber.create(function (x) {
	                if (socket.readyState === 1) {
	                    try {
	                        var serializer = _this._config.serializer;
	                        socket.send(serializer(x));
	                    }
	                    catch (e) {
	                        _this.destination.error(e);
	                    }
	                }
	            }, function (e) {
	                var closingObserver = _this._config.closingObserver;
	                if (closingObserver) {
	                    closingObserver.next(undefined);
	                }
	                if (e && e.code) {
	                    socket.close(e.code, e.reason);
	                }
	                else {
	                    observer.error(new TypeError(WEBSOCKETSUBJECT_INVALID_ERROR_OBJECT));
	                }
	                _this._resetState();
	            }, function () {
	                var closingObserver = _this._config.closingObserver;
	                if (closingObserver) {
	                    closingObserver.next(undefined);
	                }
	                socket.close();
	                _this._resetState();
	            });
	            if (queue && queue instanceof ReplaySubject) {
	                subscription.add(queue.subscribe(_this.destination));
	            }
	        };
	        socket.onerror = function (e) {
	            _this._resetState();
	            observer.error(e);
	        };
	        socket.onclose = function (e) {
	            _this._resetState();
	            var closeObserver = _this._config.closeObserver;
	            if (closeObserver) {
	                closeObserver.next(e);
	            }
	            if (e.wasClean) {
	                observer.complete();
	            }
	            else {
	                observer.error(e);
	            }
	        };
	        socket.onmessage = function (e) {
	            try {
	                var deserializer = _this._config.deserializer;
	                observer.next(deserializer(e));
	            }
	            catch (err) {
	                observer.error(err);
	            }
	        };
	    };
	    WebSocketSubject.prototype._subscribe = function (subscriber) {
	        var _this = this;
	        var source = this.source;
	        if (source) {
	            return source.subscribe(subscriber);
	        }
	        if (!this._socket) {
	            this._connectSocket();
	        }
	        this._output.subscribe(subscriber);
	        subscriber.add(function () {
	            var _socket = _this._socket;
	            if (_this._output.observers.length === 0) {
	                if (_socket && _socket.readyState === 1) {
	                    _socket.close();
	                }
	                _this._resetState();
	            }
	        });
	        return subscriber;
	    };
	    WebSocketSubject.prototype.unsubscribe = function () {
	        var _socket = this._socket;
	        if (_socket && _socket.readyState === 1) {
	            _socket.close();
	        }
	        this._resetState();
	        _super.prototype.unsubscribe.call(this);
	    };
	    return WebSocketSubject;
	}(AnonymousSubject));

	/** PURE_IMPORTS_START _WebSocketSubject PURE_IMPORTS_END */
	function webSocket(urlConfigOrSource) {
	    return new WebSocketSubject(urlConfigOrSource);
	}

	/** PURE_IMPORTS_START tslib,_Observable,_scheduler_asap,_util_isNumeric PURE_IMPORTS_END */
	var SubscribeOnObservable = /*@__PURE__*/ (function (_super) {
	    __extends(SubscribeOnObservable, _super);
	    function SubscribeOnObservable(source, delayTime, scheduler) {
	        if (delayTime === void 0) {
	            delayTime = 0;
	        }
	        if (scheduler === void 0) {
	            scheduler = asap;
	        }
	        var _this = _super.call(this) || this;
	        _this.source = source;
	        _this.delayTime = delayTime;
	        _this.scheduler = scheduler;
	        if (!isNumeric(delayTime) || delayTime < 0) {
	            _this.delayTime = 0;
	        }
	        if (!scheduler || typeof scheduler.schedule !== 'function') {
	            _this.scheduler = asap;
	        }
	        return _this;
	    }
	    SubscribeOnObservable.create = function (source, delay, scheduler) {
	        if (delay === void 0) {
	            delay = 0;
	        }
	        if (scheduler === void 0) {
	            scheduler = asap;
	        }
	        return new SubscribeOnObservable(source, delay, scheduler);
	    };
	    SubscribeOnObservable.dispatch = function (arg) {
	        var source = arg.source, subscriber = arg.subscriber;
	        return this.add(source.subscribe(subscriber));
	    };
	    SubscribeOnObservable.prototype._subscribe = function (subscriber) {
	        var delay = this.delayTime;
	        var source = this.source;
	        var scheduler = this.scheduler;
	        return scheduler.schedule(SubscribeOnObservable.dispatch, delay, {
	            source: source, subscriber: subscriber
	        });
	    };
	    return SubscribeOnObservable;
	}(Observable));

	/** PURE_IMPORTS_START _scheduler_async,_map PURE_IMPORTS_END */
	function timestamp(scheduler) {
	    if (scheduler === void 0) {
	        scheduler = async;
	    }
	    return map(function (value) { return new Timestamp(value, scheduler.now()); });
	}
	var Timestamp = /*@__PURE__*/ (function () {
	    function Timestamp(value, timestamp) {
	        this.value = value;
	        this.timestamp = timestamp;
	    }
	    return Timestamp;
	}());

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function scan(accumulator, seed) {
	    var hasSeed = false;
	    if (arguments.length >= 2) {
	        hasSeed = true;
	    }
	    return function scanOperatorFunction(source) {
	        return source.lift(new ScanOperator(accumulator, seed, hasSeed));
	    };
	}
	var ScanOperator = /*@__PURE__*/ (function () {
	    function ScanOperator(accumulator, seed, hasSeed) {
	        if (hasSeed === void 0) {
	            hasSeed = false;
	        }
	        this.accumulator = accumulator;
	        this.seed = seed;
	        this.hasSeed = hasSeed;
	    }
	    ScanOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new ScanSubscriber(subscriber, this.accumulator, this.seed, this.hasSeed));
	    };
	    return ScanOperator;
	}());
	var ScanSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(ScanSubscriber, _super);
	    function ScanSubscriber(destination, accumulator, _seed, hasSeed) {
	        var _this = _super.call(this, destination) || this;
	        _this.accumulator = accumulator;
	        _this._seed = _seed;
	        _this.hasSeed = hasSeed;
	        _this.index = 0;
	        return _this;
	    }
	    Object.defineProperty(ScanSubscriber.prototype, "seed", {
	        get: function () {
	            return this._seed;
	        },
	        set: function (value) {
	            this.hasSeed = true;
	            this._seed = value;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ScanSubscriber.prototype._next = function (value) {
	        if (!this.hasSeed) {
	            this.seed = value;
	            this.destination.next(value);
	        }
	        else {
	            return this._tryNext(value);
	        }
	    };
	    ScanSubscriber.prototype._tryNext = function (value) {
	        var index = this.index++;
	        var result;
	        try {
	            result = this.accumulator(this.seed, value, index);
	        }
	        catch (err) {
	            this.destination.error(err);
	        }
	        this.seed = result;
	        this.destination.next(result);
	    };
	    return ScanSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _scheduler_async,_scan,_observable_defer,_map PURE_IMPORTS_END */
	function timeInterval(scheduler) {
	    if (scheduler === void 0) {
	        scheduler = async;
	    }
	    return function (source) {
	        return defer(function () {
	            return source.pipe(scan(function (_a, value) {
	                var current = _a.current;
	                return ({ value: value, current: scheduler.now(), last: current });
	            }, { current: scheduler.now(), value: undefined, last: undefined }), map(function (_a) {
	                var current = _a.current, last = _a.last, value = _a.value;
	                return new TimeInterval(value, current - last);
	            }));
	        });
	    };
	}
	var TimeInterval = /*@__PURE__*/ (function () {
	    function TimeInterval(value, interval) {
	        this.value = value;
	        this.interval = interval;
	    }
	    return TimeInterval;
	}());

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	var defaultThrottleConfig = {
	    leading: true,
	    trailing: false
	};
	function throttle(durationSelector, config) {
	    if (config === void 0) {
	        config = defaultThrottleConfig;
	    }
	    return function (source) { return source.lift(new ThrottleOperator(durationSelector, !!config.leading, !!config.trailing)); };
	}
	var ThrottleOperator = /*@__PURE__*/ (function () {
	    function ThrottleOperator(durationSelector, leading, trailing) {
	        this.durationSelector = durationSelector;
	        this.leading = leading;
	        this.trailing = trailing;
	    }
	    ThrottleOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new ThrottleSubscriber(subscriber, this.durationSelector, this.leading, this.trailing));
	    };
	    return ThrottleOperator;
	}());
	var ThrottleSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(ThrottleSubscriber, _super);
	    function ThrottleSubscriber(destination, durationSelector, _leading, _trailing) {
	        var _this = _super.call(this, destination) || this;
	        _this.destination = destination;
	        _this.durationSelector = durationSelector;
	        _this._leading = _leading;
	        _this._trailing = _trailing;
	        _this._hasValue = false;
	        return _this;
	    }
	    ThrottleSubscriber.prototype._next = function (value) {
	        this._hasValue = true;
	        this._sendValue = value;
	        if (!this._throttled) {
	            if (this._leading) {
	                this.send();
	            }
	            else {
	                this.throttle(value);
	            }
	        }
	    };
	    ThrottleSubscriber.prototype.send = function () {
	        var _a = this, _hasValue = _a._hasValue, _sendValue = _a._sendValue;
	        if (_hasValue) {
	            this.destination.next(_sendValue);
	            this.throttle(_sendValue);
	        }
	        this._hasValue = false;
	        this._sendValue = undefined;
	    };
	    ThrottleSubscriber.prototype.throttle = function (value) {
	        var duration = this.tryDurationSelector(value);
	        if (!!duration) {
	            this.add(this._throttled = innerSubscribe(duration, new SimpleInnerSubscriber(this)));
	        }
	    };
	    ThrottleSubscriber.prototype.tryDurationSelector = function (value) {
	        try {
	            return this.durationSelector(value);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return null;
	        }
	    };
	    ThrottleSubscriber.prototype.throttlingDone = function () {
	        var _a = this, _throttled = _a._throttled, _trailing = _a._trailing;
	        if (_throttled) {
	            _throttled.unsubscribe();
	        }
	        this._throttled = undefined;
	        if (_trailing) {
	            this.send();
	        }
	    };
	    ThrottleSubscriber.prototype.notifyNext = function () {
	        this.throttlingDone();
	    };
	    ThrottleSubscriber.prototype.notifyComplete = function () {
	        this.throttlingDone();
	    };
	    return ThrottleSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function applyMixins(derivedCtor, baseCtors) {
	    for (var i = 0, len = baseCtors.length; i < len; i++) {
	        var baseCtor = baseCtors[i];
	        var propertyKeys = Object.getOwnPropertyNames(baseCtor.prototype);
	        for (var j = 0, len2 = propertyKeys.length; j < len2; j++) {
	            var name_1 = propertyKeys[j];
	            derivedCtor.prototype[name_1] = baseCtor.prototype[name_1];
	        }
	    }
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	var errorObject = { e: {} };

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */
	function isDate(value) {
	    return value instanceof Date && !isNaN(+value);
	}

	/** PURE_IMPORTS_START _errorObject PURE_IMPORTS_END */
	var tryCatchTarget;
	function tryCatcher() {
	    errorObject.e = undefined;
	    try {
	        return tryCatchTarget.apply(this, arguments);
	    }
	    catch (e) {
	        errorObject.e = e;
	        return errorObject;
	    }
	    finally {
	        tryCatchTarget = undefined;
	    }
	}
	function tryCatch(fn) {
	    tryCatchTarget = fn;
	    return tryCatcher;
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */

	var internalCompatibility = /*#__PURE__*/Object.freeze({
		__proto__: null,
		config: config,
		InnerSubscriber: InnerSubscriber,
		OuterSubscriber: OuterSubscriber,
		Scheduler: Scheduler,
		AnonymousSubject: AnonymousSubject,
		SubjectSubscription: SubjectSubscription,
		Subscriber: Subscriber,
		fromPromise: fromPromise,
		fromIterable: fromIterable,
		ajax: ajax,
		webSocket: webSocket,
		ajaxGet: ajaxGet,
		ajaxPost: ajaxPost,
		ajaxDelete: ajaxDelete,
		ajaxPut: ajaxPut,
		ajaxPatch: ajaxPatch,
		ajaxGetJSON: ajaxGetJSON,
		AjaxObservable: AjaxObservable,
		AjaxSubscriber: AjaxSubscriber,
		AjaxResponse: AjaxResponse,
		AjaxError: AjaxError,
		AjaxTimeoutError: AjaxTimeoutError,
		WebSocketSubject: WebSocketSubject,
		CombineLatestOperator: CombineLatestOperator,
		dispatch: dispatch$6,
		SubscribeOnObservable: SubscribeOnObservable,
		Timestamp: Timestamp,
		TimeInterval: TimeInterval,
		GroupedObservable: GroupedObservable,
		defaultThrottleConfig: defaultThrottleConfig,
		rxSubscriber: rxSubscriber,
		iterator: iterator,
		observable: observable,
		ArgumentOutOfRangeError: ArgumentOutOfRangeError,
		EmptyError: EmptyError,
		Immediate: Immediate,
		ObjectUnsubscribedError: ObjectUnsubscribedError,
		TimeoutError: TimeoutError,
		UnsubscriptionError: UnsubscriptionError,
		applyMixins: applyMixins,
		errorObject: errorObject,
		hostReportError: hostReportError,
		identity: identity,
		isArray: isArray,
		isArrayLike: isArrayLike,
		isDate: isDate,
		isFunction: isFunction,
		isIterable: isIterable,
		isNumeric: isNumeric,
		isObject: isObject,
		isObservable: isInteropObservable,
		isPromise: isPromise,
		isScheduler: isScheduler,
		noop: noop,
		not: not$1,
		pipe: pipe,
		root: _root,
		subscribeTo: subscribeTo,
		subscribeToArray: subscribeToArray,
		subscribeToIterable: subscribeToIterable,
		subscribeToObservable: subscribeToObservable,
		subscribeToPromise: subscribeToPromise,
		subscribeToResult: subscribeToResult,
		toSubscriber: toSubscriber,
		tryCatch: tryCatch
	});

	var rxjs_1 = /*@__PURE__*/getAugmentedNamespace(_esm5);

	rxjs_1.Observable.bindCallback = rxjs_1.bindCallback;

	rxjs_1.Observable.bindNodeCallback = rxjs_1.bindNodeCallback;

	rxjs_1.Observable.combineLatest = rxjs_1.combineLatest;

	rxjs_1.Observable.concat = rxjs_1.concat;

	rxjs_1.Observable.defer = rxjs_1.defer;

	rxjs_1.Observable.empty = rxjs_1.empty;

	rxjs_1.Observable.forkJoin = rxjs_1.forkJoin;

	rxjs_1.Observable.from = rxjs_1.from;

	rxjs_1.Observable.fromEvent = rxjs_1.fromEvent;

	rxjs_1.Observable.fromEventPattern = rxjs_1.fromEventPattern;

	rxjs_1.Observable.fromPromise = rxjs_1.from;

	rxjs_1.Observable.generate = rxjs_1.generate;

	rxjs_1.Observable.if = rxjs_1.iif;

	rxjs_1.Observable.interval = rxjs_1.interval;

	rxjs_1.Observable.merge = rxjs_1.merge;

	rxjs_1.Observable.race = rxjs_1.race;

	function staticNever() {
	    return rxjs_1.NEVER;
	}
	rxjs_1.Observable.never = staticNever;

	rxjs_1.Observable.of = rxjs_1.of;

	rxjs_1.Observable.onErrorResumeNext = rxjs_1.onErrorResumeNext;

	rxjs_1.Observable.pairs = rxjs_1.pairs;

	rxjs_1.Observable.range = rxjs_1.range;

	rxjs_1.Observable.using = rxjs_1.using;

	rxjs_1.Observable.throw = rxjs_1.throwError;
	rxjs_1.Observable.throwError = rxjs_1.throwError;

	rxjs_1.Observable.timer = rxjs_1.timer;

	rxjs_1.Observable.zip = rxjs_1.zip;

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */

	var ajax$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		ajax: ajax,
		AjaxResponse: AjaxResponse,
		AjaxError: AjaxError,
		AjaxTimeoutError: AjaxTimeoutError
	});

	var ajax_1 = /*@__PURE__*/getAugmentedNamespace(ajax$1);

	rxjs_1.Observable.ajax = ajax_1.ajax;

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */

	var webSocket$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		webSocket: webSocket,
		WebSocketSubject: WebSocketSubject
	});

	var webSocket_1 = /*@__PURE__*/getAugmentedNamespace(webSocket$1);

	rxjs_1.Observable.webSocket = webSocket_1.webSocket;

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function audit(durationSelector) {
	    return function auditOperatorFunction(source) {
	        return source.lift(new AuditOperator(durationSelector));
	    };
	}
	var AuditOperator = /*@__PURE__*/ (function () {
	    function AuditOperator(durationSelector) {
	        this.durationSelector = durationSelector;
	    }
	    AuditOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new AuditSubscriber(subscriber, this.durationSelector));
	    };
	    return AuditOperator;
	}());
	var AuditSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(AuditSubscriber, _super);
	    function AuditSubscriber(destination, durationSelector) {
	        var _this = _super.call(this, destination) || this;
	        _this.durationSelector = durationSelector;
	        _this.hasValue = false;
	        return _this;
	    }
	    AuditSubscriber.prototype._next = function (value) {
	        this.value = value;
	        this.hasValue = true;
	        if (!this.throttled) {
	            var duration = void 0;
	            try {
	                var durationSelector = this.durationSelector;
	                duration = durationSelector(value);
	            }
	            catch (err) {
	                return this.destination.error(err);
	            }
	            var innerSubscription = innerSubscribe(duration, new SimpleInnerSubscriber(this));
	            if (!innerSubscription || innerSubscription.closed) {
	                this.clearThrottle();
	            }
	            else {
	                this.add(this.throttled = innerSubscription);
	            }
	        }
	    };
	    AuditSubscriber.prototype.clearThrottle = function () {
	        var _a = this, value = _a.value, hasValue = _a.hasValue, throttled = _a.throttled;
	        if (throttled) {
	            this.remove(throttled);
	            this.throttled = undefined;
	            throttled.unsubscribe();
	        }
	        if (hasValue) {
	            this.value = undefined;
	            this.hasValue = false;
	            this.destination.next(value);
	        }
	    };
	    AuditSubscriber.prototype.notifyNext = function () {
	        this.clearThrottle();
	    };
	    AuditSubscriber.prototype.notifyComplete = function () {
	        this.clearThrottle();
	    };
	    return AuditSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START _scheduler_async,_audit,_observable_timer PURE_IMPORTS_END */
	function auditTime(duration, scheduler) {
	    if (scheduler === void 0) {
	        scheduler = async;
	    }
	    return audit(function () { return timer(duration, scheduler); });
	}

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function buffer(closingNotifier) {
	    return function bufferOperatorFunction(source) {
	        return source.lift(new BufferOperator(closingNotifier));
	    };
	}
	var BufferOperator = /*@__PURE__*/ (function () {
	    function BufferOperator(closingNotifier) {
	        this.closingNotifier = closingNotifier;
	    }
	    BufferOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new BufferSubscriber(subscriber, this.closingNotifier));
	    };
	    return BufferOperator;
	}());
	var BufferSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(BufferSubscriber, _super);
	    function BufferSubscriber(destination, closingNotifier) {
	        var _this = _super.call(this, destination) || this;
	        _this.buffer = [];
	        _this.add(innerSubscribe(closingNotifier, new SimpleInnerSubscriber(_this)));
	        return _this;
	    }
	    BufferSubscriber.prototype._next = function (value) {
	        this.buffer.push(value);
	    };
	    BufferSubscriber.prototype.notifyNext = function () {
	        var buffer = this.buffer;
	        this.buffer = [];
	        this.destination.next(buffer);
	    };
	    return BufferSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function bufferCount(bufferSize, startBufferEvery) {
	    if (startBufferEvery === void 0) {
	        startBufferEvery = null;
	    }
	    return function bufferCountOperatorFunction(source) {
	        return source.lift(new BufferCountOperator(bufferSize, startBufferEvery));
	    };
	}
	var BufferCountOperator = /*@__PURE__*/ (function () {
	    function BufferCountOperator(bufferSize, startBufferEvery) {
	        this.bufferSize = bufferSize;
	        this.startBufferEvery = startBufferEvery;
	        if (!startBufferEvery || bufferSize === startBufferEvery) {
	            this.subscriberClass = BufferCountSubscriber;
	        }
	        else {
	            this.subscriberClass = BufferSkipCountSubscriber;
	        }
	    }
	    BufferCountOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new this.subscriberClass(subscriber, this.bufferSize, this.startBufferEvery));
	    };
	    return BufferCountOperator;
	}());
	var BufferCountSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(BufferCountSubscriber, _super);
	    function BufferCountSubscriber(destination, bufferSize) {
	        var _this = _super.call(this, destination) || this;
	        _this.bufferSize = bufferSize;
	        _this.buffer = [];
	        return _this;
	    }
	    BufferCountSubscriber.prototype._next = function (value) {
	        var buffer = this.buffer;
	        buffer.push(value);
	        if (buffer.length == this.bufferSize) {
	            this.destination.next(buffer);
	            this.buffer = [];
	        }
	    };
	    BufferCountSubscriber.prototype._complete = function () {
	        var buffer = this.buffer;
	        if (buffer.length > 0) {
	            this.destination.next(buffer);
	        }
	        _super.prototype._complete.call(this);
	    };
	    return BufferCountSubscriber;
	}(Subscriber));
	var BufferSkipCountSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(BufferSkipCountSubscriber, _super);
	    function BufferSkipCountSubscriber(destination, bufferSize, startBufferEvery) {
	        var _this = _super.call(this, destination) || this;
	        _this.bufferSize = bufferSize;
	        _this.startBufferEvery = startBufferEvery;
	        _this.buffers = [];
	        _this.count = 0;
	        return _this;
	    }
	    BufferSkipCountSubscriber.prototype._next = function (value) {
	        var _a = this, bufferSize = _a.bufferSize, startBufferEvery = _a.startBufferEvery, buffers = _a.buffers, count = _a.count;
	        this.count++;
	        if (count % startBufferEvery === 0) {
	            buffers.push([]);
	        }
	        for (var i = buffers.length; i--;) {
	            var buffer = buffers[i];
	            buffer.push(value);
	            if (buffer.length === bufferSize) {
	                buffers.splice(i, 1);
	                this.destination.next(buffer);
	            }
	        }
	    };
	    BufferSkipCountSubscriber.prototype._complete = function () {
	        var _a = this, buffers = _a.buffers, destination = _a.destination;
	        while (buffers.length > 0) {
	            var buffer = buffers.shift();
	            if (buffer.length > 0) {
	                destination.next(buffer);
	            }
	        }
	        _super.prototype._complete.call(this);
	    };
	    return BufferSkipCountSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_scheduler_async,_Subscriber,_util_isScheduler PURE_IMPORTS_END */
	function bufferTime(bufferTimeSpan) {
	    var length = arguments.length;
	    var scheduler = async;
	    if (isScheduler(arguments[arguments.length - 1])) {
	        scheduler = arguments[arguments.length - 1];
	        length--;
	    }
	    var bufferCreationInterval = null;
	    if (length >= 2) {
	        bufferCreationInterval = arguments[1];
	    }
	    var maxBufferSize = Number.POSITIVE_INFINITY;
	    if (length >= 3) {
	        maxBufferSize = arguments[2];
	    }
	    return function bufferTimeOperatorFunction(source) {
	        return source.lift(new BufferTimeOperator(bufferTimeSpan, bufferCreationInterval, maxBufferSize, scheduler));
	    };
	}
	var BufferTimeOperator = /*@__PURE__*/ (function () {
	    function BufferTimeOperator(bufferTimeSpan, bufferCreationInterval, maxBufferSize, scheduler) {
	        this.bufferTimeSpan = bufferTimeSpan;
	        this.bufferCreationInterval = bufferCreationInterval;
	        this.maxBufferSize = maxBufferSize;
	        this.scheduler = scheduler;
	    }
	    BufferTimeOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new BufferTimeSubscriber(subscriber, this.bufferTimeSpan, this.bufferCreationInterval, this.maxBufferSize, this.scheduler));
	    };
	    return BufferTimeOperator;
	}());
	var Context = /*@__PURE__*/ (function () {
	    function Context() {
	        this.buffer = [];
	    }
	    return Context;
	}());
	var BufferTimeSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(BufferTimeSubscriber, _super);
	    function BufferTimeSubscriber(destination, bufferTimeSpan, bufferCreationInterval, maxBufferSize, scheduler) {
	        var _this = _super.call(this, destination) || this;
	        _this.bufferTimeSpan = bufferTimeSpan;
	        _this.bufferCreationInterval = bufferCreationInterval;
	        _this.maxBufferSize = maxBufferSize;
	        _this.scheduler = scheduler;
	        _this.contexts = [];
	        var context = _this.openContext();
	        _this.timespanOnly = bufferCreationInterval == null || bufferCreationInterval < 0;
	        if (_this.timespanOnly) {
	            var timeSpanOnlyState = { subscriber: _this, context: context, bufferTimeSpan: bufferTimeSpan };
	            _this.add(context.closeAction = scheduler.schedule(dispatchBufferTimeSpanOnly, bufferTimeSpan, timeSpanOnlyState));
	        }
	        else {
	            var closeState = { subscriber: _this, context: context };
	            var creationState = { bufferTimeSpan: bufferTimeSpan, bufferCreationInterval: bufferCreationInterval, subscriber: _this, scheduler: scheduler };
	            _this.add(context.closeAction = scheduler.schedule(dispatchBufferClose, bufferTimeSpan, closeState));
	            _this.add(scheduler.schedule(dispatchBufferCreation, bufferCreationInterval, creationState));
	        }
	        return _this;
	    }
	    BufferTimeSubscriber.prototype._next = function (value) {
	        var contexts = this.contexts;
	        var len = contexts.length;
	        var filledBufferContext;
	        for (var i = 0; i < len; i++) {
	            var context_1 = contexts[i];
	            var buffer = context_1.buffer;
	            buffer.push(value);
	            if (buffer.length == this.maxBufferSize) {
	                filledBufferContext = context_1;
	            }
	        }
	        if (filledBufferContext) {
	            this.onBufferFull(filledBufferContext);
	        }
	    };
	    BufferTimeSubscriber.prototype._error = function (err) {
	        this.contexts.length = 0;
	        _super.prototype._error.call(this, err);
	    };
	    BufferTimeSubscriber.prototype._complete = function () {
	        var _a = this, contexts = _a.contexts, destination = _a.destination;
	        while (contexts.length > 0) {
	            var context_2 = contexts.shift();
	            destination.next(context_2.buffer);
	        }
	        _super.prototype._complete.call(this);
	    };
	    BufferTimeSubscriber.prototype._unsubscribe = function () {
	        this.contexts = null;
	    };
	    BufferTimeSubscriber.prototype.onBufferFull = function (context) {
	        this.closeContext(context);
	        var closeAction = context.closeAction;
	        closeAction.unsubscribe();
	        this.remove(closeAction);
	        if (!this.closed && this.timespanOnly) {
	            context = this.openContext();
	            var bufferTimeSpan = this.bufferTimeSpan;
	            var timeSpanOnlyState = { subscriber: this, context: context, bufferTimeSpan: bufferTimeSpan };
	            this.add(context.closeAction = this.scheduler.schedule(dispatchBufferTimeSpanOnly, bufferTimeSpan, timeSpanOnlyState));
	        }
	    };
	    BufferTimeSubscriber.prototype.openContext = function () {
	        var context = new Context();
	        this.contexts.push(context);
	        return context;
	    };
	    BufferTimeSubscriber.prototype.closeContext = function (context) {
	        this.destination.next(context.buffer);
	        var contexts = this.contexts;
	        var spliceIndex = contexts ? contexts.indexOf(context) : -1;
	        if (spliceIndex >= 0) {
	            contexts.splice(contexts.indexOf(context), 1);
	        }
	    };
	    return BufferTimeSubscriber;
	}(Subscriber));
	function dispatchBufferTimeSpanOnly(state) {
	    var subscriber = state.subscriber;
	    var prevContext = state.context;
	    if (prevContext) {
	        subscriber.closeContext(prevContext);
	    }
	    if (!subscriber.closed) {
	        state.context = subscriber.openContext();
	        state.context.closeAction = this.schedule(state, state.bufferTimeSpan);
	    }
	}
	function dispatchBufferCreation(state) {
	    var bufferCreationInterval = state.bufferCreationInterval, bufferTimeSpan = state.bufferTimeSpan, subscriber = state.subscriber, scheduler = state.scheduler;
	    var context = subscriber.openContext();
	    var action = this;
	    if (!subscriber.closed) {
	        subscriber.add(context.closeAction = scheduler.schedule(dispatchBufferClose, bufferTimeSpan, { subscriber: subscriber, context: context }));
	        action.schedule(state, bufferCreationInterval);
	    }
	}
	function dispatchBufferClose(arg) {
	    var subscriber = arg.subscriber, context = arg.context;
	    subscriber.closeContext(context);
	}

	/** PURE_IMPORTS_START tslib,_Subscription,_util_subscribeToResult,_OuterSubscriber PURE_IMPORTS_END */
	function bufferToggle(openings, closingSelector) {
	    return function bufferToggleOperatorFunction(source) {
	        return source.lift(new BufferToggleOperator(openings, closingSelector));
	    };
	}
	var BufferToggleOperator = /*@__PURE__*/ (function () {
	    function BufferToggleOperator(openings, closingSelector) {
	        this.openings = openings;
	        this.closingSelector = closingSelector;
	    }
	    BufferToggleOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new BufferToggleSubscriber(subscriber, this.openings, this.closingSelector));
	    };
	    return BufferToggleOperator;
	}());
	var BufferToggleSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(BufferToggleSubscriber, _super);
	    function BufferToggleSubscriber(destination, openings, closingSelector) {
	        var _this = _super.call(this, destination) || this;
	        _this.closingSelector = closingSelector;
	        _this.contexts = [];
	        _this.add(subscribeToResult(_this, openings));
	        return _this;
	    }
	    BufferToggleSubscriber.prototype._next = function (value) {
	        var contexts = this.contexts;
	        var len = contexts.length;
	        for (var i = 0; i < len; i++) {
	            contexts[i].buffer.push(value);
	        }
	    };
	    BufferToggleSubscriber.prototype._error = function (err) {
	        var contexts = this.contexts;
	        while (contexts.length > 0) {
	            var context_1 = contexts.shift();
	            context_1.subscription.unsubscribe();
	            context_1.buffer = null;
	            context_1.subscription = null;
	        }
	        this.contexts = null;
	        _super.prototype._error.call(this, err);
	    };
	    BufferToggleSubscriber.prototype._complete = function () {
	        var contexts = this.contexts;
	        while (contexts.length > 0) {
	            var context_2 = contexts.shift();
	            this.destination.next(context_2.buffer);
	            context_2.subscription.unsubscribe();
	            context_2.buffer = null;
	            context_2.subscription = null;
	        }
	        this.contexts = null;
	        _super.prototype._complete.call(this);
	    };
	    BufferToggleSubscriber.prototype.notifyNext = function (outerValue, innerValue) {
	        outerValue ? this.closeBuffer(outerValue) : this.openBuffer(innerValue);
	    };
	    BufferToggleSubscriber.prototype.notifyComplete = function (innerSub) {
	        this.closeBuffer(innerSub.context);
	    };
	    BufferToggleSubscriber.prototype.openBuffer = function (value) {
	        try {
	            var closingSelector = this.closingSelector;
	            var closingNotifier = closingSelector.call(this, value);
	            if (closingNotifier) {
	                this.trySubscribe(closingNotifier);
	            }
	        }
	        catch (err) {
	            this._error(err);
	        }
	    };
	    BufferToggleSubscriber.prototype.closeBuffer = function (context) {
	        var contexts = this.contexts;
	        if (contexts && context) {
	            var buffer = context.buffer, subscription = context.subscription;
	            this.destination.next(buffer);
	            contexts.splice(contexts.indexOf(context), 1);
	            this.remove(subscription);
	            subscription.unsubscribe();
	        }
	    };
	    BufferToggleSubscriber.prototype.trySubscribe = function (closingNotifier) {
	        var contexts = this.contexts;
	        var buffer = [];
	        var subscription = new Subscription();
	        var context = { buffer: buffer, subscription: subscription };
	        contexts.push(context);
	        var innerSubscription = subscribeToResult(this, closingNotifier, context);
	        if (!innerSubscription || innerSubscription.closed) {
	            this.closeBuffer(context);
	        }
	        else {
	            innerSubscription.context = context;
	            this.add(innerSubscription);
	            subscription.add(innerSubscription);
	        }
	    };
	    return BufferToggleSubscriber;
	}(OuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscription,_innerSubscribe PURE_IMPORTS_END */
	function bufferWhen(closingSelector) {
	    return function (source) {
	        return source.lift(new BufferWhenOperator(closingSelector));
	    };
	}
	var BufferWhenOperator = /*@__PURE__*/ (function () {
	    function BufferWhenOperator(closingSelector) {
	        this.closingSelector = closingSelector;
	    }
	    BufferWhenOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new BufferWhenSubscriber(subscriber, this.closingSelector));
	    };
	    return BufferWhenOperator;
	}());
	var BufferWhenSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(BufferWhenSubscriber, _super);
	    function BufferWhenSubscriber(destination, closingSelector) {
	        var _this = _super.call(this, destination) || this;
	        _this.closingSelector = closingSelector;
	        _this.subscribing = false;
	        _this.openBuffer();
	        return _this;
	    }
	    BufferWhenSubscriber.prototype._next = function (value) {
	        this.buffer.push(value);
	    };
	    BufferWhenSubscriber.prototype._complete = function () {
	        var buffer = this.buffer;
	        if (buffer) {
	            this.destination.next(buffer);
	        }
	        _super.prototype._complete.call(this);
	    };
	    BufferWhenSubscriber.prototype._unsubscribe = function () {
	        this.buffer = undefined;
	        this.subscribing = false;
	    };
	    BufferWhenSubscriber.prototype.notifyNext = function () {
	        this.openBuffer();
	    };
	    BufferWhenSubscriber.prototype.notifyComplete = function () {
	        if (this.subscribing) {
	            this.complete();
	        }
	        else {
	            this.openBuffer();
	        }
	    };
	    BufferWhenSubscriber.prototype.openBuffer = function () {
	        var closingSubscription = this.closingSubscription;
	        if (closingSubscription) {
	            this.remove(closingSubscription);
	            closingSubscription.unsubscribe();
	        }
	        var buffer = this.buffer;
	        if (this.buffer) {
	            this.destination.next(buffer);
	        }
	        this.buffer = [];
	        var closingNotifier;
	        try {
	            var closingSelector = this.closingSelector;
	            closingNotifier = closingSelector();
	        }
	        catch (err) {
	            return this.error(err);
	        }
	        closingSubscription = new Subscription();
	        this.closingSubscription = closingSubscription;
	        this.add(closingSubscription);
	        this.subscribing = true;
	        closingSubscription.add(innerSubscribe(closingNotifier, new SimpleInnerSubscriber(this)));
	        this.subscribing = false;
	    };
	    return BufferWhenSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function catchError(selector) {
	    return function catchErrorOperatorFunction(source) {
	        var operator = new CatchOperator(selector);
	        var caught = source.lift(operator);
	        return (operator.caught = caught);
	    };
	}
	var CatchOperator = /*@__PURE__*/ (function () {
	    function CatchOperator(selector) {
	        this.selector = selector;
	    }
	    CatchOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new CatchSubscriber(subscriber, this.selector, this.caught));
	    };
	    return CatchOperator;
	}());
	var CatchSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(CatchSubscriber, _super);
	    function CatchSubscriber(destination, selector, caught) {
	        var _this = _super.call(this, destination) || this;
	        _this.selector = selector;
	        _this.caught = caught;
	        return _this;
	    }
	    CatchSubscriber.prototype.error = function (err) {
	        if (!this.isStopped) {
	            var result = void 0;
	            try {
	                result = this.selector(err, this.caught);
	            }
	            catch (err2) {
	                _super.prototype.error.call(this, err2);
	                return;
	            }
	            this._unsubscribeAndRecycle();
	            var innerSubscriber = new SimpleInnerSubscriber(this);
	            this.add(innerSubscriber);
	            var innerSubscription = innerSubscribe(result, innerSubscriber);
	            if (innerSubscription !== innerSubscriber) {
	                this.add(innerSubscription);
	            }
	        }
	    };
	    return CatchSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START _observable_combineLatest PURE_IMPORTS_END */
	function combineAll(project) {
	    return function (source) { return source.lift(new CombineLatestOperator(project)); };
	}

	/** PURE_IMPORTS_START _util_isArray,_observable_combineLatest,_observable_from PURE_IMPORTS_END */
	function combineLatest$1() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    var project = null;
	    if (typeof observables[observables.length - 1] === 'function') {
	        project = observables.pop();
	    }
	    if (observables.length === 1 && isArray(observables[0])) {
	        observables = observables[0].slice();
	    }
	    return function (source) { return source.lift.call(from([source].concat(observables)), new CombineLatestOperator(project)); };
	}

	/** PURE_IMPORTS_START _observable_concat PURE_IMPORTS_END */
	function concat$1() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    return function (source) { return source.lift.call(concat.apply(void 0, [source].concat(observables))); };
	}

	/** PURE_IMPORTS_START _mergeMap PURE_IMPORTS_END */
	function concatMap(project, resultSelector) {
	    return mergeMap(project, resultSelector, 1);
	}

	/** PURE_IMPORTS_START _concatMap PURE_IMPORTS_END */
	function concatMapTo(innerObservable, resultSelector) {
	    return concatMap(function () { return innerObservable; }, resultSelector);
	}

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function count(predicate) {
	    return function (source) { return source.lift(new CountOperator(predicate, source)); };
	}
	var CountOperator = /*@__PURE__*/ (function () {
	    function CountOperator(predicate, source) {
	        this.predicate = predicate;
	        this.source = source;
	    }
	    CountOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new CountSubscriber(subscriber, this.predicate, this.source));
	    };
	    return CountOperator;
	}());
	var CountSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(CountSubscriber, _super);
	    function CountSubscriber(destination, predicate, source) {
	        var _this = _super.call(this, destination) || this;
	        _this.predicate = predicate;
	        _this.source = source;
	        _this.count = 0;
	        _this.index = 0;
	        return _this;
	    }
	    CountSubscriber.prototype._next = function (value) {
	        if (this.predicate) {
	            this._tryPredicate(value);
	        }
	        else {
	            this.count++;
	        }
	    };
	    CountSubscriber.prototype._tryPredicate = function (value) {
	        var result;
	        try {
	            result = this.predicate(value, this.index++, this.source);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        if (result) {
	            this.count++;
	        }
	    };
	    CountSubscriber.prototype._complete = function () {
	        this.destination.next(this.count);
	        this.destination.complete();
	    };
	    return CountSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function debounce(durationSelector) {
	    return function (source) { return source.lift(new DebounceOperator(durationSelector)); };
	}
	var DebounceOperator = /*@__PURE__*/ (function () {
	    function DebounceOperator(durationSelector) {
	        this.durationSelector = durationSelector;
	    }
	    DebounceOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new DebounceSubscriber(subscriber, this.durationSelector));
	    };
	    return DebounceOperator;
	}());
	var DebounceSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(DebounceSubscriber, _super);
	    function DebounceSubscriber(destination, durationSelector) {
	        var _this = _super.call(this, destination) || this;
	        _this.durationSelector = durationSelector;
	        _this.hasValue = false;
	        return _this;
	    }
	    DebounceSubscriber.prototype._next = function (value) {
	        try {
	            var result = this.durationSelector.call(this, value);
	            if (result) {
	                this._tryNext(value, result);
	            }
	        }
	        catch (err) {
	            this.destination.error(err);
	        }
	    };
	    DebounceSubscriber.prototype._complete = function () {
	        this.emitValue();
	        this.destination.complete();
	    };
	    DebounceSubscriber.prototype._tryNext = function (value, duration) {
	        var subscription = this.durationSubscription;
	        this.value = value;
	        this.hasValue = true;
	        if (subscription) {
	            subscription.unsubscribe();
	            this.remove(subscription);
	        }
	        subscription = innerSubscribe(duration, new SimpleInnerSubscriber(this));
	        if (subscription && !subscription.closed) {
	            this.add(this.durationSubscription = subscription);
	        }
	    };
	    DebounceSubscriber.prototype.notifyNext = function () {
	        this.emitValue();
	    };
	    DebounceSubscriber.prototype.notifyComplete = function () {
	        this.emitValue();
	    };
	    DebounceSubscriber.prototype.emitValue = function () {
	        if (this.hasValue) {
	            var value = this.value;
	            var subscription = this.durationSubscription;
	            if (subscription) {
	                this.durationSubscription = undefined;
	                subscription.unsubscribe();
	                this.remove(subscription);
	            }
	            this.value = undefined;
	            this.hasValue = false;
	            _super.prototype._next.call(this, value);
	        }
	    };
	    return DebounceSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber,_scheduler_async PURE_IMPORTS_END */
	function debounceTime(dueTime, scheduler) {
	    if (scheduler === void 0) {
	        scheduler = async;
	    }
	    return function (source) { return source.lift(new DebounceTimeOperator(dueTime, scheduler)); };
	}
	var DebounceTimeOperator = /*@__PURE__*/ (function () {
	    function DebounceTimeOperator(dueTime, scheduler) {
	        this.dueTime = dueTime;
	        this.scheduler = scheduler;
	    }
	    DebounceTimeOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new DebounceTimeSubscriber(subscriber, this.dueTime, this.scheduler));
	    };
	    return DebounceTimeOperator;
	}());
	var DebounceTimeSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(DebounceTimeSubscriber, _super);
	    function DebounceTimeSubscriber(destination, dueTime, scheduler) {
	        var _this = _super.call(this, destination) || this;
	        _this.dueTime = dueTime;
	        _this.scheduler = scheduler;
	        _this.debouncedSubscription = null;
	        _this.lastValue = null;
	        _this.hasValue = false;
	        return _this;
	    }
	    DebounceTimeSubscriber.prototype._next = function (value) {
	        this.clearDebounce();
	        this.lastValue = value;
	        this.hasValue = true;
	        this.add(this.debouncedSubscription = this.scheduler.schedule(dispatchNext$2, this.dueTime, this));
	    };
	    DebounceTimeSubscriber.prototype._complete = function () {
	        this.debouncedNext();
	        this.destination.complete();
	    };
	    DebounceTimeSubscriber.prototype.debouncedNext = function () {
	        this.clearDebounce();
	        if (this.hasValue) {
	            var lastValue = this.lastValue;
	            this.lastValue = null;
	            this.hasValue = false;
	            this.destination.next(lastValue);
	        }
	    };
	    DebounceTimeSubscriber.prototype.clearDebounce = function () {
	        var debouncedSubscription = this.debouncedSubscription;
	        if (debouncedSubscription !== null) {
	            this.remove(debouncedSubscription);
	            debouncedSubscription.unsubscribe();
	            this.debouncedSubscription = null;
	        }
	    };
	    return DebounceTimeSubscriber;
	}(Subscriber));
	function dispatchNext$2(subscriber) {
	    subscriber.debouncedNext();
	}

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function defaultIfEmpty(defaultValue) {
	    if (defaultValue === void 0) {
	        defaultValue = null;
	    }
	    return function (source) { return source.lift(new DefaultIfEmptyOperator(defaultValue)); };
	}
	var DefaultIfEmptyOperator = /*@__PURE__*/ (function () {
	    function DefaultIfEmptyOperator(defaultValue) {
	        this.defaultValue = defaultValue;
	    }
	    DefaultIfEmptyOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new DefaultIfEmptySubscriber(subscriber, this.defaultValue));
	    };
	    return DefaultIfEmptyOperator;
	}());
	var DefaultIfEmptySubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(DefaultIfEmptySubscriber, _super);
	    function DefaultIfEmptySubscriber(destination, defaultValue) {
	        var _this = _super.call(this, destination) || this;
	        _this.defaultValue = defaultValue;
	        _this.isEmpty = true;
	        return _this;
	    }
	    DefaultIfEmptySubscriber.prototype._next = function (value) {
	        this.isEmpty = false;
	        this.destination.next(value);
	    };
	    DefaultIfEmptySubscriber.prototype._complete = function () {
	        if (this.isEmpty) {
	            this.destination.next(this.defaultValue);
	        }
	        this.destination.complete();
	    };
	    return DefaultIfEmptySubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_scheduler_async,_util_isDate,_Subscriber,_Notification PURE_IMPORTS_END */
	function delay(delay, scheduler) {
	    if (scheduler === void 0) {
	        scheduler = async;
	    }
	    var absoluteDelay = isDate(delay);
	    var delayFor = absoluteDelay ? (+delay - scheduler.now()) : Math.abs(delay);
	    return function (source) { return source.lift(new DelayOperator(delayFor, scheduler)); };
	}
	var DelayOperator = /*@__PURE__*/ (function () {
	    function DelayOperator(delay, scheduler) {
	        this.delay = delay;
	        this.scheduler = scheduler;
	    }
	    DelayOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new DelaySubscriber(subscriber, this.delay, this.scheduler));
	    };
	    return DelayOperator;
	}());
	var DelaySubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(DelaySubscriber, _super);
	    function DelaySubscriber(destination, delay, scheduler) {
	        var _this = _super.call(this, destination) || this;
	        _this.delay = delay;
	        _this.scheduler = scheduler;
	        _this.queue = [];
	        _this.active = false;
	        _this.errored = false;
	        return _this;
	    }
	    DelaySubscriber.dispatch = function (state) {
	        var source = state.source;
	        var queue = source.queue;
	        var scheduler = state.scheduler;
	        var destination = state.destination;
	        while (queue.length > 0 && (queue[0].time - scheduler.now()) <= 0) {
	            queue.shift().notification.observe(destination);
	        }
	        if (queue.length > 0) {
	            var delay_1 = Math.max(0, queue[0].time - scheduler.now());
	            this.schedule(state, delay_1);
	        }
	        else {
	            this.unsubscribe();
	            source.active = false;
	        }
	    };
	    DelaySubscriber.prototype._schedule = function (scheduler) {
	        this.active = true;
	        var destination = this.destination;
	        destination.add(scheduler.schedule(DelaySubscriber.dispatch, this.delay, {
	            source: this, destination: this.destination, scheduler: scheduler
	        }));
	    };
	    DelaySubscriber.prototype.scheduleNotification = function (notification) {
	        if (this.errored === true) {
	            return;
	        }
	        var scheduler = this.scheduler;
	        var message = new DelayMessage(scheduler.now() + this.delay, notification);
	        this.queue.push(message);
	        if (this.active === false) {
	            this._schedule(scheduler);
	        }
	    };
	    DelaySubscriber.prototype._next = function (value) {
	        this.scheduleNotification(Notification.createNext(value));
	    };
	    DelaySubscriber.prototype._error = function (err) {
	        this.errored = true;
	        this.queue = [];
	        this.destination.error(err);
	        this.unsubscribe();
	    };
	    DelaySubscriber.prototype._complete = function () {
	        this.scheduleNotification(Notification.createComplete());
	        this.unsubscribe();
	    };
	    return DelaySubscriber;
	}(Subscriber));
	var DelayMessage = /*@__PURE__*/ (function () {
	    function DelayMessage(time, notification) {
	        this.time = time;
	        this.notification = notification;
	    }
	    return DelayMessage;
	}());

	/** PURE_IMPORTS_START tslib,_Subscriber,_Observable,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
	function delayWhen(delayDurationSelector, subscriptionDelay) {
	    if (subscriptionDelay) {
	        return function (source) {
	            return new SubscriptionDelayObservable(source, subscriptionDelay)
	                .lift(new DelayWhenOperator(delayDurationSelector));
	        };
	    }
	    return function (source) { return source.lift(new DelayWhenOperator(delayDurationSelector)); };
	}
	var DelayWhenOperator = /*@__PURE__*/ (function () {
	    function DelayWhenOperator(delayDurationSelector) {
	        this.delayDurationSelector = delayDurationSelector;
	    }
	    DelayWhenOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new DelayWhenSubscriber(subscriber, this.delayDurationSelector));
	    };
	    return DelayWhenOperator;
	}());
	var DelayWhenSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(DelayWhenSubscriber, _super);
	    function DelayWhenSubscriber(destination, delayDurationSelector) {
	        var _this = _super.call(this, destination) || this;
	        _this.delayDurationSelector = delayDurationSelector;
	        _this.completed = false;
	        _this.delayNotifierSubscriptions = [];
	        _this.index = 0;
	        return _this;
	    }
	    DelayWhenSubscriber.prototype.notifyNext = function (outerValue, _innerValue, _outerIndex, _innerIndex, innerSub) {
	        this.destination.next(outerValue);
	        this.removeSubscription(innerSub);
	        this.tryComplete();
	    };
	    DelayWhenSubscriber.prototype.notifyError = function (error, innerSub) {
	        this._error(error);
	    };
	    DelayWhenSubscriber.prototype.notifyComplete = function (innerSub) {
	        var value = this.removeSubscription(innerSub);
	        if (value) {
	            this.destination.next(value);
	        }
	        this.tryComplete();
	    };
	    DelayWhenSubscriber.prototype._next = function (value) {
	        var index = this.index++;
	        try {
	            var delayNotifier = this.delayDurationSelector(value, index);
	            if (delayNotifier) {
	                this.tryDelay(delayNotifier, value);
	            }
	        }
	        catch (err) {
	            this.destination.error(err);
	        }
	    };
	    DelayWhenSubscriber.prototype._complete = function () {
	        this.completed = true;
	        this.tryComplete();
	        this.unsubscribe();
	    };
	    DelayWhenSubscriber.prototype.removeSubscription = function (subscription) {
	        subscription.unsubscribe();
	        var subscriptionIdx = this.delayNotifierSubscriptions.indexOf(subscription);
	        if (subscriptionIdx !== -1) {
	            this.delayNotifierSubscriptions.splice(subscriptionIdx, 1);
	        }
	        return subscription.outerValue;
	    };
	    DelayWhenSubscriber.prototype.tryDelay = function (delayNotifier, value) {
	        var notifierSubscription = subscribeToResult(this, delayNotifier, value);
	        if (notifierSubscription && !notifierSubscription.closed) {
	            var destination = this.destination;
	            destination.add(notifierSubscription);
	            this.delayNotifierSubscriptions.push(notifierSubscription);
	        }
	    };
	    DelayWhenSubscriber.prototype.tryComplete = function () {
	        if (this.completed && this.delayNotifierSubscriptions.length === 0) {
	            this.destination.complete();
	        }
	    };
	    return DelayWhenSubscriber;
	}(OuterSubscriber));
	var SubscriptionDelayObservable = /*@__PURE__*/ (function (_super) {
	    __extends(SubscriptionDelayObservable, _super);
	    function SubscriptionDelayObservable(source, subscriptionDelay) {
	        var _this = _super.call(this) || this;
	        _this.source = source;
	        _this.subscriptionDelay = subscriptionDelay;
	        return _this;
	    }
	    SubscriptionDelayObservable.prototype._subscribe = function (subscriber) {
	        this.subscriptionDelay.subscribe(new SubscriptionDelaySubscriber(subscriber, this.source));
	    };
	    return SubscriptionDelayObservable;
	}(Observable));
	var SubscriptionDelaySubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SubscriptionDelaySubscriber, _super);
	    function SubscriptionDelaySubscriber(parent, source) {
	        var _this = _super.call(this) || this;
	        _this.parent = parent;
	        _this.source = source;
	        _this.sourceSubscribed = false;
	        return _this;
	    }
	    SubscriptionDelaySubscriber.prototype._next = function (unused) {
	        this.subscribeToSource();
	    };
	    SubscriptionDelaySubscriber.prototype._error = function (err) {
	        this.unsubscribe();
	        this.parent.error(err);
	    };
	    SubscriptionDelaySubscriber.prototype._complete = function () {
	        this.unsubscribe();
	        this.subscribeToSource();
	    };
	    SubscriptionDelaySubscriber.prototype.subscribeToSource = function () {
	        if (!this.sourceSubscribed) {
	            this.sourceSubscribed = true;
	            this.unsubscribe();
	            this.source.subscribe(this.parent);
	        }
	    };
	    return SubscriptionDelaySubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function dematerialize() {
	    return function dematerializeOperatorFunction(source) {
	        return source.lift(new DeMaterializeOperator());
	    };
	}
	var DeMaterializeOperator = /*@__PURE__*/ (function () {
	    function DeMaterializeOperator() {
	    }
	    DeMaterializeOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new DeMaterializeSubscriber(subscriber));
	    };
	    return DeMaterializeOperator;
	}());
	var DeMaterializeSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(DeMaterializeSubscriber, _super);
	    function DeMaterializeSubscriber(destination) {
	        return _super.call(this, destination) || this;
	    }
	    DeMaterializeSubscriber.prototype._next = function (value) {
	        value.observe(this.destination);
	    };
	    return DeMaterializeSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function distinct(keySelector, flushes) {
	    return function (source) { return source.lift(new DistinctOperator(keySelector, flushes)); };
	}
	var DistinctOperator = /*@__PURE__*/ (function () {
	    function DistinctOperator(keySelector, flushes) {
	        this.keySelector = keySelector;
	        this.flushes = flushes;
	    }
	    DistinctOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new DistinctSubscriber(subscriber, this.keySelector, this.flushes));
	    };
	    return DistinctOperator;
	}());
	var DistinctSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(DistinctSubscriber, _super);
	    function DistinctSubscriber(destination, keySelector, flushes) {
	        var _this = _super.call(this, destination) || this;
	        _this.keySelector = keySelector;
	        _this.values = new Set();
	        if (flushes) {
	            _this.add(innerSubscribe(flushes, new SimpleInnerSubscriber(_this)));
	        }
	        return _this;
	    }
	    DistinctSubscriber.prototype.notifyNext = function () {
	        this.values.clear();
	    };
	    DistinctSubscriber.prototype.notifyError = function (error) {
	        this._error(error);
	    };
	    DistinctSubscriber.prototype._next = function (value) {
	        if (this.keySelector) {
	            this._useKeySelector(value);
	        }
	        else {
	            this._finalizeNext(value, value);
	        }
	    };
	    DistinctSubscriber.prototype._useKeySelector = function (value) {
	        var key;
	        var destination = this.destination;
	        try {
	            key = this.keySelector(value);
	        }
	        catch (err) {
	            destination.error(err);
	            return;
	        }
	        this._finalizeNext(key, value);
	    };
	    DistinctSubscriber.prototype._finalizeNext = function (key, value) {
	        var values = this.values;
	        if (!values.has(key)) {
	            values.add(key);
	            this.destination.next(value);
	        }
	    };
	    return DistinctSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function distinctUntilChanged(compare, keySelector) {
	    return function (source) { return source.lift(new DistinctUntilChangedOperator(compare, keySelector)); };
	}
	var DistinctUntilChangedOperator = /*@__PURE__*/ (function () {
	    function DistinctUntilChangedOperator(compare, keySelector) {
	        this.compare = compare;
	        this.keySelector = keySelector;
	    }
	    DistinctUntilChangedOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new DistinctUntilChangedSubscriber(subscriber, this.compare, this.keySelector));
	    };
	    return DistinctUntilChangedOperator;
	}());
	var DistinctUntilChangedSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(DistinctUntilChangedSubscriber, _super);
	    function DistinctUntilChangedSubscriber(destination, compare, keySelector) {
	        var _this = _super.call(this, destination) || this;
	        _this.keySelector = keySelector;
	        _this.hasKey = false;
	        if (typeof compare === 'function') {
	            _this.compare = compare;
	        }
	        return _this;
	    }
	    DistinctUntilChangedSubscriber.prototype.compare = function (x, y) {
	        return x === y;
	    };
	    DistinctUntilChangedSubscriber.prototype._next = function (value) {
	        var key;
	        try {
	            var keySelector = this.keySelector;
	            key = keySelector ? keySelector(value) : value;
	        }
	        catch (err) {
	            return this.destination.error(err);
	        }
	        var result = false;
	        if (this.hasKey) {
	            try {
	                var compare = this.compare;
	                result = compare(this.key, key);
	            }
	            catch (err) {
	                return this.destination.error(err);
	            }
	        }
	        else {
	            this.hasKey = true;
	        }
	        if (!result) {
	            this.key = key;
	            this.destination.next(value);
	        }
	    };
	    return DistinctUntilChangedSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _distinctUntilChanged PURE_IMPORTS_END */
	function distinctUntilKeyChanged(key, compare) {
	    return distinctUntilChanged(function (x, y) { return compare ? compare(x[key], y[key]) : x[key] === y[key]; });
	}

	/** PURE_IMPORTS_START tslib,_util_EmptyError,_Subscriber PURE_IMPORTS_END */
	function throwIfEmpty(errorFactory) {
	    if (errorFactory === void 0) {
	        errorFactory = defaultErrorFactory;
	    }
	    return function (source) {
	        return source.lift(new ThrowIfEmptyOperator(errorFactory));
	    };
	}
	var ThrowIfEmptyOperator = /*@__PURE__*/ (function () {
	    function ThrowIfEmptyOperator(errorFactory) {
	        this.errorFactory = errorFactory;
	    }
	    ThrowIfEmptyOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new ThrowIfEmptySubscriber(subscriber, this.errorFactory));
	    };
	    return ThrowIfEmptyOperator;
	}());
	var ThrowIfEmptySubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(ThrowIfEmptySubscriber, _super);
	    function ThrowIfEmptySubscriber(destination, errorFactory) {
	        var _this = _super.call(this, destination) || this;
	        _this.errorFactory = errorFactory;
	        _this.hasValue = false;
	        return _this;
	    }
	    ThrowIfEmptySubscriber.prototype._next = function (value) {
	        this.hasValue = true;
	        this.destination.next(value);
	    };
	    ThrowIfEmptySubscriber.prototype._complete = function () {
	        if (!this.hasValue) {
	            var err = void 0;
	            try {
	                err = this.errorFactory();
	            }
	            catch (e) {
	                err = e;
	            }
	            this.destination.error(err);
	        }
	        else {
	            return this.destination.complete();
	        }
	    };
	    return ThrowIfEmptySubscriber;
	}(Subscriber));
	function defaultErrorFactory() {
	    return new EmptyError();
	}

	/** PURE_IMPORTS_START tslib,_Subscriber,_util_ArgumentOutOfRangeError,_observable_empty PURE_IMPORTS_END */
	function take(count) {
	    return function (source) {
	        if (count === 0) {
	            return empty$1();
	        }
	        else {
	            return source.lift(new TakeOperator(count));
	        }
	    };
	}
	var TakeOperator = /*@__PURE__*/ (function () {
	    function TakeOperator(total) {
	        this.total = total;
	        if (this.total < 0) {
	            throw new ArgumentOutOfRangeError;
	        }
	    }
	    TakeOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new TakeSubscriber(subscriber, this.total));
	    };
	    return TakeOperator;
	}());
	var TakeSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(TakeSubscriber, _super);
	    function TakeSubscriber(destination, total) {
	        var _this = _super.call(this, destination) || this;
	        _this.total = total;
	        _this.count = 0;
	        return _this;
	    }
	    TakeSubscriber.prototype._next = function (value) {
	        var total = this.total;
	        var count = ++this.count;
	        if (count <= total) {
	            this.destination.next(value);
	            if (count === total) {
	                this.destination.complete();
	                this.unsubscribe();
	            }
	        }
	    };
	    return TakeSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _util_ArgumentOutOfRangeError,_filter,_throwIfEmpty,_defaultIfEmpty,_take PURE_IMPORTS_END */
	function elementAt(index, defaultValue) {
	    if (index < 0) {
	        throw new ArgumentOutOfRangeError();
	    }
	    var hasDefaultValue = arguments.length >= 2;
	    return function (source) {
	        return source.pipe(filter(function (v, i) { return i === index; }), take(1), hasDefaultValue
	            ? defaultIfEmpty(defaultValue)
	            : throwIfEmpty(function () { return new ArgumentOutOfRangeError(); }));
	    };
	}

	/** PURE_IMPORTS_START _observable_concat,_observable_of PURE_IMPORTS_END */
	function endWith() {
	    var array = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        array[_i] = arguments[_i];
	    }
	    return function (source) { return concat(source, of.apply(void 0, array)); };
	}

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function every(predicate, thisArg) {
	    return function (source) { return source.lift(new EveryOperator(predicate, thisArg, source)); };
	}
	var EveryOperator = /*@__PURE__*/ (function () {
	    function EveryOperator(predicate, thisArg, source) {
	        this.predicate = predicate;
	        this.thisArg = thisArg;
	        this.source = source;
	    }
	    EveryOperator.prototype.call = function (observer, source) {
	        return source.subscribe(new EverySubscriber(observer, this.predicate, this.thisArg, this.source));
	    };
	    return EveryOperator;
	}());
	var EverySubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(EverySubscriber, _super);
	    function EverySubscriber(destination, predicate, thisArg, source) {
	        var _this = _super.call(this, destination) || this;
	        _this.predicate = predicate;
	        _this.thisArg = thisArg;
	        _this.source = source;
	        _this.index = 0;
	        _this.thisArg = thisArg || _this;
	        return _this;
	    }
	    EverySubscriber.prototype.notifyComplete = function (everyValueMatch) {
	        this.destination.next(everyValueMatch);
	        this.destination.complete();
	    };
	    EverySubscriber.prototype._next = function (value) {
	        var result = false;
	        try {
	            result = this.predicate.call(this.thisArg, value, this.index++, this.source);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        if (!result) {
	            this.notifyComplete(false);
	        }
	    };
	    EverySubscriber.prototype._complete = function () {
	        this.notifyComplete(true);
	    };
	    return EverySubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function exhaust() {
	    return function (source) { return source.lift(new SwitchFirstOperator()); };
	}
	var SwitchFirstOperator = /*@__PURE__*/ (function () {
	    function SwitchFirstOperator() {
	    }
	    SwitchFirstOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new SwitchFirstSubscriber(subscriber));
	    };
	    return SwitchFirstOperator;
	}());
	var SwitchFirstSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SwitchFirstSubscriber, _super);
	    function SwitchFirstSubscriber(destination) {
	        var _this = _super.call(this, destination) || this;
	        _this.hasCompleted = false;
	        _this.hasSubscription = false;
	        return _this;
	    }
	    SwitchFirstSubscriber.prototype._next = function (value) {
	        if (!this.hasSubscription) {
	            this.hasSubscription = true;
	            this.add(innerSubscribe(value, new SimpleInnerSubscriber(this)));
	        }
	    };
	    SwitchFirstSubscriber.prototype._complete = function () {
	        this.hasCompleted = true;
	        if (!this.hasSubscription) {
	            this.destination.complete();
	        }
	    };
	    SwitchFirstSubscriber.prototype.notifyComplete = function () {
	        this.hasSubscription = false;
	        if (this.hasCompleted) {
	            this.destination.complete();
	        }
	    };
	    return SwitchFirstSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_map,_observable_from,_innerSubscribe PURE_IMPORTS_END */
	function exhaustMap(project, resultSelector) {
	    if (resultSelector) {
	        return function (source) { return source.pipe(exhaustMap(function (a, i) { return from(project(a, i)).pipe(map(function (b, ii) { return resultSelector(a, b, i, ii); })); })); };
	    }
	    return function (source) {
	        return source.lift(new ExhaustMapOperator(project));
	    };
	}
	var ExhaustMapOperator = /*@__PURE__*/ (function () {
	    function ExhaustMapOperator(project) {
	        this.project = project;
	    }
	    ExhaustMapOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new ExhaustMapSubscriber(subscriber, this.project));
	    };
	    return ExhaustMapOperator;
	}());
	var ExhaustMapSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(ExhaustMapSubscriber, _super);
	    function ExhaustMapSubscriber(destination, project) {
	        var _this = _super.call(this, destination) || this;
	        _this.project = project;
	        _this.hasSubscription = false;
	        _this.hasCompleted = false;
	        _this.index = 0;
	        return _this;
	    }
	    ExhaustMapSubscriber.prototype._next = function (value) {
	        if (!this.hasSubscription) {
	            this.tryNext(value);
	        }
	    };
	    ExhaustMapSubscriber.prototype.tryNext = function (value) {
	        var result;
	        var index = this.index++;
	        try {
	            result = this.project(value, index);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        this.hasSubscription = true;
	        this._innerSub(result);
	    };
	    ExhaustMapSubscriber.prototype._innerSub = function (result) {
	        var innerSubscriber = new SimpleInnerSubscriber(this);
	        var destination = this.destination;
	        destination.add(innerSubscriber);
	        var innerSubscription = innerSubscribe(result, innerSubscriber);
	        if (innerSubscription !== innerSubscriber) {
	            destination.add(innerSubscription);
	        }
	    };
	    ExhaustMapSubscriber.prototype._complete = function () {
	        this.hasCompleted = true;
	        if (!this.hasSubscription) {
	            this.destination.complete();
	        }
	        this.unsubscribe();
	    };
	    ExhaustMapSubscriber.prototype.notifyNext = function (innerValue) {
	        this.destination.next(innerValue);
	    };
	    ExhaustMapSubscriber.prototype.notifyError = function (err) {
	        this.destination.error(err);
	    };
	    ExhaustMapSubscriber.prototype.notifyComplete = function () {
	        this.hasSubscription = false;
	        if (this.hasCompleted) {
	            this.destination.complete();
	        }
	    };
	    return ExhaustMapSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function expand(project, concurrent, scheduler) {
	    if (concurrent === void 0) {
	        concurrent = Number.POSITIVE_INFINITY;
	    }
	    concurrent = (concurrent || 0) < 1 ? Number.POSITIVE_INFINITY : concurrent;
	    return function (source) { return source.lift(new ExpandOperator(project, concurrent, scheduler)); };
	}
	var ExpandOperator = /*@__PURE__*/ (function () {
	    function ExpandOperator(project, concurrent, scheduler) {
	        this.project = project;
	        this.concurrent = concurrent;
	        this.scheduler = scheduler;
	    }
	    ExpandOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new ExpandSubscriber(subscriber, this.project, this.concurrent, this.scheduler));
	    };
	    return ExpandOperator;
	}());
	var ExpandSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(ExpandSubscriber, _super);
	    function ExpandSubscriber(destination, project, concurrent, scheduler) {
	        var _this = _super.call(this, destination) || this;
	        _this.project = project;
	        _this.concurrent = concurrent;
	        _this.scheduler = scheduler;
	        _this.index = 0;
	        _this.active = 0;
	        _this.hasCompleted = false;
	        if (concurrent < Number.POSITIVE_INFINITY) {
	            _this.buffer = [];
	        }
	        return _this;
	    }
	    ExpandSubscriber.dispatch = function (arg) {
	        var subscriber = arg.subscriber, result = arg.result, value = arg.value, index = arg.index;
	        subscriber.subscribeToProjection(result, value, index);
	    };
	    ExpandSubscriber.prototype._next = function (value) {
	        var destination = this.destination;
	        if (destination.closed) {
	            this._complete();
	            return;
	        }
	        var index = this.index++;
	        if (this.active < this.concurrent) {
	            destination.next(value);
	            try {
	                var project = this.project;
	                var result = project(value, index);
	                if (!this.scheduler) {
	                    this.subscribeToProjection(result, value, index);
	                }
	                else {
	                    var state = { subscriber: this, result: result, value: value, index: index };
	                    var destination_1 = this.destination;
	                    destination_1.add(this.scheduler.schedule(ExpandSubscriber.dispatch, 0, state));
	                }
	            }
	            catch (e) {
	                destination.error(e);
	            }
	        }
	        else {
	            this.buffer.push(value);
	        }
	    };
	    ExpandSubscriber.prototype.subscribeToProjection = function (result, value, index) {
	        this.active++;
	        var destination = this.destination;
	        destination.add(innerSubscribe(result, new SimpleInnerSubscriber(this)));
	    };
	    ExpandSubscriber.prototype._complete = function () {
	        this.hasCompleted = true;
	        if (this.hasCompleted && this.active === 0) {
	            this.destination.complete();
	        }
	        this.unsubscribe();
	    };
	    ExpandSubscriber.prototype.notifyNext = function (innerValue) {
	        this._next(innerValue);
	    };
	    ExpandSubscriber.prototype.notifyComplete = function () {
	        var buffer = this.buffer;
	        this.active--;
	        if (buffer && buffer.length > 0) {
	            this._next(buffer.shift());
	        }
	        if (this.hasCompleted && this.active === 0) {
	            this.destination.complete();
	        }
	    };
	    return ExpandSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber,_Subscription PURE_IMPORTS_END */
	function finalize(callback) {
	    return function (source) { return source.lift(new FinallyOperator(callback)); };
	}
	var FinallyOperator = /*@__PURE__*/ (function () {
	    function FinallyOperator(callback) {
	        this.callback = callback;
	    }
	    FinallyOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new FinallySubscriber(subscriber, this.callback));
	    };
	    return FinallyOperator;
	}());
	var FinallySubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(FinallySubscriber, _super);
	    function FinallySubscriber(destination, callback) {
	        var _this = _super.call(this, destination) || this;
	        _this.add(new Subscription(callback));
	        return _this;
	    }
	    return FinallySubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function find(predicate, thisArg) {
	    if (typeof predicate !== 'function') {
	        throw new TypeError('predicate is not a function');
	    }
	    return function (source) { return source.lift(new FindValueOperator(predicate, source, false, thisArg)); };
	}
	var FindValueOperator = /*@__PURE__*/ (function () {
	    function FindValueOperator(predicate, source, yieldIndex, thisArg) {
	        this.predicate = predicate;
	        this.source = source;
	        this.yieldIndex = yieldIndex;
	        this.thisArg = thisArg;
	    }
	    FindValueOperator.prototype.call = function (observer, source) {
	        return source.subscribe(new FindValueSubscriber(observer, this.predicate, this.source, this.yieldIndex, this.thisArg));
	    };
	    return FindValueOperator;
	}());
	var FindValueSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(FindValueSubscriber, _super);
	    function FindValueSubscriber(destination, predicate, source, yieldIndex, thisArg) {
	        var _this = _super.call(this, destination) || this;
	        _this.predicate = predicate;
	        _this.source = source;
	        _this.yieldIndex = yieldIndex;
	        _this.thisArg = thisArg;
	        _this.index = 0;
	        return _this;
	    }
	    FindValueSubscriber.prototype.notifyComplete = function (value) {
	        var destination = this.destination;
	        destination.next(value);
	        destination.complete();
	        this.unsubscribe();
	    };
	    FindValueSubscriber.prototype._next = function (value) {
	        var _a = this, predicate = _a.predicate, thisArg = _a.thisArg;
	        var index = this.index++;
	        try {
	            var result = predicate.call(thisArg || this, value, index, this.source);
	            if (result) {
	                this.notifyComplete(this.yieldIndex ? index : value);
	            }
	        }
	        catch (err) {
	            this.destination.error(err);
	        }
	    };
	    FindValueSubscriber.prototype._complete = function () {
	        this.notifyComplete(this.yieldIndex ? -1 : undefined);
	    };
	    return FindValueSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _operators_find PURE_IMPORTS_END */
	function findIndex(predicate, thisArg) {
	    return function (source) { return source.lift(new FindValueOperator(predicate, source, true, thisArg)); };
	}

	/** PURE_IMPORTS_START _util_EmptyError,_filter,_take,_defaultIfEmpty,_throwIfEmpty,_util_identity PURE_IMPORTS_END */
	function first(predicate, defaultValue) {
	    var hasDefaultValue = arguments.length >= 2;
	    return function (source) { return source.pipe(predicate ? filter(function (v, i) { return predicate(v, i, source); }) : identity, take(1), hasDefaultValue ? defaultIfEmpty(defaultValue) : throwIfEmpty(function () { return new EmptyError(); })); };
	}

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function ignoreElements() {
	    return function ignoreElementsOperatorFunction(source) {
	        return source.lift(new IgnoreElementsOperator());
	    };
	}
	var IgnoreElementsOperator = /*@__PURE__*/ (function () {
	    function IgnoreElementsOperator() {
	    }
	    IgnoreElementsOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new IgnoreElementsSubscriber(subscriber));
	    };
	    return IgnoreElementsOperator;
	}());
	var IgnoreElementsSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(IgnoreElementsSubscriber, _super);
	    function IgnoreElementsSubscriber() {
	        return _super !== null && _super.apply(this, arguments) || this;
	    }
	    IgnoreElementsSubscriber.prototype._next = function (unused) {
	    };
	    return IgnoreElementsSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function isEmpty() {
	    return function (source) { return source.lift(new IsEmptyOperator()); };
	}
	var IsEmptyOperator = /*@__PURE__*/ (function () {
	    function IsEmptyOperator() {
	    }
	    IsEmptyOperator.prototype.call = function (observer, source) {
	        return source.subscribe(new IsEmptySubscriber(observer));
	    };
	    return IsEmptyOperator;
	}());
	var IsEmptySubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(IsEmptySubscriber, _super);
	    function IsEmptySubscriber(destination) {
	        return _super.call(this, destination) || this;
	    }
	    IsEmptySubscriber.prototype.notifyComplete = function (isEmpty) {
	        var destination = this.destination;
	        destination.next(isEmpty);
	        destination.complete();
	    };
	    IsEmptySubscriber.prototype._next = function (value) {
	        this.notifyComplete(false);
	    };
	    IsEmptySubscriber.prototype._complete = function () {
	        this.notifyComplete(true);
	    };
	    return IsEmptySubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber,_util_ArgumentOutOfRangeError,_observable_empty PURE_IMPORTS_END */
	function takeLast(count) {
	    return function takeLastOperatorFunction(source) {
	        if (count === 0) {
	            return empty$1();
	        }
	        else {
	            return source.lift(new TakeLastOperator(count));
	        }
	    };
	}
	var TakeLastOperator = /*@__PURE__*/ (function () {
	    function TakeLastOperator(total) {
	        this.total = total;
	        if (this.total < 0) {
	            throw new ArgumentOutOfRangeError;
	        }
	    }
	    TakeLastOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new TakeLastSubscriber(subscriber, this.total));
	    };
	    return TakeLastOperator;
	}());
	var TakeLastSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(TakeLastSubscriber, _super);
	    function TakeLastSubscriber(destination, total) {
	        var _this = _super.call(this, destination) || this;
	        _this.total = total;
	        _this.ring = new Array();
	        _this.count = 0;
	        return _this;
	    }
	    TakeLastSubscriber.prototype._next = function (value) {
	        var ring = this.ring;
	        var total = this.total;
	        var count = this.count++;
	        if (ring.length < total) {
	            ring.push(value);
	        }
	        else {
	            var index = count % total;
	            ring[index] = value;
	        }
	    };
	    TakeLastSubscriber.prototype._complete = function () {
	        var destination = this.destination;
	        var count = this.count;
	        if (count > 0) {
	            var total = this.count >= this.total ? this.total : this.count;
	            var ring = this.ring;
	            for (var i = 0; i < total; i++) {
	                var idx = (count++) % total;
	                destination.next(ring[idx]);
	            }
	        }
	        destination.complete();
	    };
	    return TakeLastSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _util_EmptyError,_filter,_takeLast,_throwIfEmpty,_defaultIfEmpty,_util_identity PURE_IMPORTS_END */
	function last(predicate, defaultValue) {
	    var hasDefaultValue = arguments.length >= 2;
	    return function (source) { return source.pipe(predicate ? filter(function (v, i) { return predicate(v, i, source); }) : identity, takeLast(1), hasDefaultValue ? defaultIfEmpty(defaultValue) : throwIfEmpty(function () { return new EmptyError(); })); };
	}

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function mapTo(value) {
	    return function (source) { return source.lift(new MapToOperator(value)); };
	}
	var MapToOperator = /*@__PURE__*/ (function () {
	    function MapToOperator(value) {
	        this.value = value;
	    }
	    MapToOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new MapToSubscriber(subscriber, this.value));
	    };
	    return MapToOperator;
	}());
	var MapToSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(MapToSubscriber, _super);
	    function MapToSubscriber(destination, value) {
	        var _this = _super.call(this, destination) || this;
	        _this.value = value;
	        return _this;
	    }
	    MapToSubscriber.prototype._next = function (x) {
	        this.destination.next(this.value);
	    };
	    return MapToSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber,_Notification PURE_IMPORTS_END */
	function materialize() {
	    return function materializeOperatorFunction(source) {
	        return source.lift(new MaterializeOperator());
	    };
	}
	var MaterializeOperator = /*@__PURE__*/ (function () {
	    function MaterializeOperator() {
	    }
	    MaterializeOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new MaterializeSubscriber(subscriber));
	    };
	    return MaterializeOperator;
	}());
	var MaterializeSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(MaterializeSubscriber, _super);
	    function MaterializeSubscriber(destination) {
	        return _super.call(this, destination) || this;
	    }
	    MaterializeSubscriber.prototype._next = function (value) {
	        this.destination.next(Notification.createNext(value));
	    };
	    MaterializeSubscriber.prototype._error = function (err) {
	        var destination = this.destination;
	        destination.next(Notification.createError(err));
	        destination.complete();
	    };
	    MaterializeSubscriber.prototype._complete = function () {
	        var destination = this.destination;
	        destination.next(Notification.createComplete());
	        destination.complete();
	    };
	    return MaterializeSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _scan,_takeLast,_defaultIfEmpty,_util_pipe PURE_IMPORTS_END */
	function reduce(accumulator, seed) {
	    if (arguments.length >= 2) {
	        return function reduceOperatorFunctionWithSeed(source) {
	            return pipe(scan(accumulator, seed), takeLast(1), defaultIfEmpty(seed))(source);
	        };
	    }
	    return function reduceOperatorFunction(source) {
	        return pipe(scan(function (acc, value, index) { return accumulator(acc, value, index + 1); }), takeLast(1))(source);
	    };
	}

	/** PURE_IMPORTS_START _reduce PURE_IMPORTS_END */
	function max(comparer) {
	    var max = (typeof comparer === 'function')
	        ? function (x, y) { return comparer(x, y) > 0 ? x : y; }
	        : function (x, y) { return x > y ? x : y; };
	    return reduce(max);
	}

	/** PURE_IMPORTS_START _observable_merge PURE_IMPORTS_END */
	function merge$1() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    return function (source) { return source.lift.call(merge.apply(void 0, [source].concat(observables))); };
	}

	/** PURE_IMPORTS_START _mergeMap PURE_IMPORTS_END */
	function mergeMapTo(innerObservable, resultSelector, concurrent) {
	    if (concurrent === void 0) {
	        concurrent = Number.POSITIVE_INFINITY;
	    }
	    if (typeof resultSelector === 'function') {
	        return mergeMap(function () { return innerObservable; }, resultSelector, concurrent);
	    }
	    if (typeof resultSelector === 'number') {
	        concurrent = resultSelector;
	    }
	    return mergeMap(function () { return innerObservable; }, concurrent);
	}

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function mergeScan(accumulator, seed, concurrent) {
	    if (concurrent === void 0) {
	        concurrent = Number.POSITIVE_INFINITY;
	    }
	    return function (source) { return source.lift(new MergeScanOperator(accumulator, seed, concurrent)); };
	}
	var MergeScanOperator = /*@__PURE__*/ (function () {
	    function MergeScanOperator(accumulator, seed, concurrent) {
	        this.accumulator = accumulator;
	        this.seed = seed;
	        this.concurrent = concurrent;
	    }
	    MergeScanOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new MergeScanSubscriber(subscriber, this.accumulator, this.seed, this.concurrent));
	    };
	    return MergeScanOperator;
	}());
	var MergeScanSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(MergeScanSubscriber, _super);
	    function MergeScanSubscriber(destination, accumulator, acc, concurrent) {
	        var _this = _super.call(this, destination) || this;
	        _this.accumulator = accumulator;
	        _this.acc = acc;
	        _this.concurrent = concurrent;
	        _this.hasValue = false;
	        _this.hasCompleted = false;
	        _this.buffer = [];
	        _this.active = 0;
	        _this.index = 0;
	        return _this;
	    }
	    MergeScanSubscriber.prototype._next = function (value) {
	        if (this.active < this.concurrent) {
	            var index = this.index++;
	            var destination = this.destination;
	            var ish = void 0;
	            try {
	                var accumulator = this.accumulator;
	                ish = accumulator(this.acc, value, index);
	            }
	            catch (e) {
	                return destination.error(e);
	            }
	            this.active++;
	            this._innerSub(ish);
	        }
	        else {
	            this.buffer.push(value);
	        }
	    };
	    MergeScanSubscriber.prototype._innerSub = function (ish) {
	        var innerSubscriber = new SimpleInnerSubscriber(this);
	        var destination = this.destination;
	        destination.add(innerSubscriber);
	        var innerSubscription = innerSubscribe(ish, innerSubscriber);
	        if (innerSubscription !== innerSubscriber) {
	            destination.add(innerSubscription);
	        }
	    };
	    MergeScanSubscriber.prototype._complete = function () {
	        this.hasCompleted = true;
	        if (this.active === 0 && this.buffer.length === 0) {
	            if (this.hasValue === false) {
	                this.destination.next(this.acc);
	            }
	            this.destination.complete();
	        }
	        this.unsubscribe();
	    };
	    MergeScanSubscriber.prototype.notifyNext = function (innerValue) {
	        var destination = this.destination;
	        this.acc = innerValue;
	        this.hasValue = true;
	        destination.next(innerValue);
	    };
	    MergeScanSubscriber.prototype.notifyComplete = function () {
	        var buffer = this.buffer;
	        this.active--;
	        if (buffer.length > 0) {
	            this._next(buffer.shift());
	        }
	        else if (this.active === 0 && this.hasCompleted) {
	            if (this.hasValue === false) {
	                this.destination.next(this.acc);
	            }
	            this.destination.complete();
	        }
	    };
	    return MergeScanSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START _reduce PURE_IMPORTS_END */
	function min(comparer) {
	    var min = (typeof comparer === 'function')
	        ? function (x, y) { return comparer(x, y) < 0 ? x : y; }
	        : function (x, y) { return x < y ? x : y; };
	    return reduce(min);
	}

	/** PURE_IMPORTS_START _observable_ConnectableObservable PURE_IMPORTS_END */
	function multicast(subjectOrSubjectFactory, selector) {
	    return function multicastOperatorFunction(source) {
	        var subjectFactory;
	        if (typeof subjectOrSubjectFactory === 'function') {
	            subjectFactory = subjectOrSubjectFactory;
	        }
	        else {
	            subjectFactory = function subjectFactory() {
	                return subjectOrSubjectFactory;
	            };
	        }
	        if (typeof selector === 'function') {
	            return source.lift(new MulticastOperator(subjectFactory, selector));
	        }
	        var connectable = Object.create(source, connectableObservableDescriptor);
	        connectable.source = source;
	        connectable.subjectFactory = subjectFactory;
	        return connectable;
	    };
	}
	var MulticastOperator = /*@__PURE__*/ (function () {
	    function MulticastOperator(subjectFactory, selector) {
	        this.subjectFactory = subjectFactory;
	        this.selector = selector;
	    }
	    MulticastOperator.prototype.call = function (subscriber, source) {
	        var selector = this.selector;
	        var subject = this.subjectFactory();
	        var subscription = selector(subject).subscribe(subscriber);
	        subscription.add(source.subscribe(subject));
	        return subscription;
	    };
	    return MulticastOperator;
	}());

	/** PURE_IMPORTS_START tslib,_observable_from,_util_isArray,_innerSubscribe PURE_IMPORTS_END */
	function onErrorResumeNext$1() {
	    var nextSources = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        nextSources[_i] = arguments[_i];
	    }
	    if (nextSources.length === 1 && isArray(nextSources[0])) {
	        nextSources = nextSources[0];
	    }
	    return function (source) { return source.lift(new OnErrorResumeNextOperator(nextSources)); };
	}
	var OnErrorResumeNextOperator = /*@__PURE__*/ (function () {
	    function OnErrorResumeNextOperator(nextSources) {
	        this.nextSources = nextSources;
	    }
	    OnErrorResumeNextOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new OnErrorResumeNextSubscriber(subscriber, this.nextSources));
	    };
	    return OnErrorResumeNextOperator;
	}());
	var OnErrorResumeNextSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(OnErrorResumeNextSubscriber, _super);
	    function OnErrorResumeNextSubscriber(destination, nextSources) {
	        var _this = _super.call(this, destination) || this;
	        _this.destination = destination;
	        _this.nextSources = nextSources;
	        return _this;
	    }
	    OnErrorResumeNextSubscriber.prototype.notifyError = function () {
	        this.subscribeToNextSource();
	    };
	    OnErrorResumeNextSubscriber.prototype.notifyComplete = function () {
	        this.subscribeToNextSource();
	    };
	    OnErrorResumeNextSubscriber.prototype._error = function (err) {
	        this.subscribeToNextSource();
	        this.unsubscribe();
	    };
	    OnErrorResumeNextSubscriber.prototype._complete = function () {
	        this.subscribeToNextSource();
	        this.unsubscribe();
	    };
	    OnErrorResumeNextSubscriber.prototype.subscribeToNextSource = function () {
	        var next = this.nextSources.shift();
	        if (!!next) {
	            var innerSubscriber = new SimpleInnerSubscriber(this);
	            var destination = this.destination;
	            destination.add(innerSubscriber);
	            var innerSubscription = innerSubscribe(next, innerSubscriber);
	            if (innerSubscription !== innerSubscriber) {
	                destination.add(innerSubscription);
	            }
	        }
	        else {
	            this.destination.complete();
	        }
	    };
	    return OnErrorResumeNextSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function pairwise() {
	    return function (source) { return source.lift(new PairwiseOperator()); };
	}
	var PairwiseOperator = /*@__PURE__*/ (function () {
	    function PairwiseOperator() {
	    }
	    PairwiseOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new PairwiseSubscriber(subscriber));
	    };
	    return PairwiseOperator;
	}());
	var PairwiseSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(PairwiseSubscriber, _super);
	    function PairwiseSubscriber(destination) {
	        var _this = _super.call(this, destination) || this;
	        _this.hasPrev = false;
	        return _this;
	    }
	    PairwiseSubscriber.prototype._next = function (value) {
	        var pair;
	        if (this.hasPrev) {
	            pair = [this.prev, value];
	        }
	        else {
	            this.hasPrev = true;
	        }
	        this.prev = value;
	        if (pair) {
	            this.destination.next(pair);
	        }
	    };
	    return PairwiseSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _util_not,_filter PURE_IMPORTS_END */
	function partition$1(predicate, thisArg) {
	    return function (source) {
	        return [
	            filter(predicate, thisArg)(source),
	            filter(not$1(predicate, thisArg))(source)
	        ];
	    };
	}

	/** PURE_IMPORTS_START _map PURE_IMPORTS_END */
	function pluck() {
	    var properties = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        properties[_i] = arguments[_i];
	    }
	    var length = properties.length;
	    if (length === 0) {
	        throw new Error('list of properties cannot be empty.');
	    }
	    return function (source) { return map(plucker(properties, length))(source); };
	}
	function plucker(props, length) {
	    var mapper = function (x) {
	        var currentProp = x;
	        for (var i = 0; i < length; i++) {
	            var p = currentProp != null ? currentProp[props[i]] : undefined;
	            if (p !== void 0) {
	                currentProp = p;
	            }
	            else {
	                return undefined;
	            }
	        }
	        return currentProp;
	    };
	    return mapper;
	}

	/** PURE_IMPORTS_START _Subject,_multicast PURE_IMPORTS_END */
	function publish(selector) {
	    return selector ?
	        multicast(function () { return new Subject(); }, selector) :
	        multicast(new Subject());
	}

	/** PURE_IMPORTS_START _BehaviorSubject,_multicast PURE_IMPORTS_END */
	function publishBehavior(value) {
	    return function (source) { return multicast(new BehaviorSubject(value))(source); };
	}

	/** PURE_IMPORTS_START _AsyncSubject,_multicast PURE_IMPORTS_END */
	function publishLast() {
	    return function (source) { return multicast(new AsyncSubject())(source); };
	}

	/** PURE_IMPORTS_START _ReplaySubject,_multicast PURE_IMPORTS_END */
	function publishReplay(bufferSize, windowTime, selectorOrScheduler, scheduler) {
	    if (selectorOrScheduler && typeof selectorOrScheduler !== 'function') {
	        scheduler = selectorOrScheduler;
	    }
	    var selector = typeof selectorOrScheduler === 'function' ? selectorOrScheduler : undefined;
	    var subject = new ReplaySubject(bufferSize, windowTime, scheduler);
	    return function (source) { return multicast(function () { return subject; }, selector)(source); };
	}

	/** PURE_IMPORTS_START _util_isArray,_observable_race PURE_IMPORTS_END */
	function race$1() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    return function raceOperatorFunction(source) {
	        if (observables.length === 1 && isArray(observables[0])) {
	            observables = observables[0];
	        }
	        return source.lift.call(race.apply(void 0, [source].concat(observables)));
	    };
	}

	/** PURE_IMPORTS_START tslib,_Subscriber,_observable_empty PURE_IMPORTS_END */
	function repeat(count) {
	    if (count === void 0) {
	        count = -1;
	    }
	    return function (source) {
	        if (count === 0) {
	            return empty$1();
	        }
	        else if (count < 0) {
	            return source.lift(new RepeatOperator(-1, source));
	        }
	        else {
	            return source.lift(new RepeatOperator(count - 1, source));
	        }
	    };
	}
	var RepeatOperator = /*@__PURE__*/ (function () {
	    function RepeatOperator(count, source) {
	        this.count = count;
	        this.source = source;
	    }
	    RepeatOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new RepeatSubscriber(subscriber, this.count, this.source));
	    };
	    return RepeatOperator;
	}());
	var RepeatSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(RepeatSubscriber, _super);
	    function RepeatSubscriber(destination, count, source) {
	        var _this = _super.call(this, destination) || this;
	        _this.count = count;
	        _this.source = source;
	        return _this;
	    }
	    RepeatSubscriber.prototype.complete = function () {
	        if (!this.isStopped) {
	            var _a = this, source = _a.source, count = _a.count;
	            if (count === 0) {
	                return _super.prototype.complete.call(this);
	            }
	            else if (count > -1) {
	                this.count = count - 1;
	            }
	            source.subscribe(this._unsubscribeAndRecycle());
	        }
	    };
	    return RepeatSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subject,_innerSubscribe PURE_IMPORTS_END */
	function repeatWhen(notifier) {
	    return function (source) { return source.lift(new RepeatWhenOperator(notifier)); };
	}
	var RepeatWhenOperator = /*@__PURE__*/ (function () {
	    function RepeatWhenOperator(notifier) {
	        this.notifier = notifier;
	    }
	    RepeatWhenOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new RepeatWhenSubscriber(subscriber, this.notifier, source));
	    };
	    return RepeatWhenOperator;
	}());
	var RepeatWhenSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(RepeatWhenSubscriber, _super);
	    function RepeatWhenSubscriber(destination, notifier, source) {
	        var _this = _super.call(this, destination) || this;
	        _this.notifier = notifier;
	        _this.source = source;
	        _this.sourceIsBeingSubscribedTo = true;
	        return _this;
	    }
	    RepeatWhenSubscriber.prototype.notifyNext = function () {
	        this.sourceIsBeingSubscribedTo = true;
	        this.source.subscribe(this);
	    };
	    RepeatWhenSubscriber.prototype.notifyComplete = function () {
	        if (this.sourceIsBeingSubscribedTo === false) {
	            return _super.prototype.complete.call(this);
	        }
	    };
	    RepeatWhenSubscriber.prototype.complete = function () {
	        this.sourceIsBeingSubscribedTo = false;
	        if (!this.isStopped) {
	            if (!this.retries) {
	                this.subscribeToRetries();
	            }
	            if (!this.retriesSubscription || this.retriesSubscription.closed) {
	                return _super.prototype.complete.call(this);
	            }
	            this._unsubscribeAndRecycle();
	            this.notifications.next(undefined);
	        }
	    };
	    RepeatWhenSubscriber.prototype._unsubscribe = function () {
	        var _a = this, notifications = _a.notifications, retriesSubscription = _a.retriesSubscription;
	        if (notifications) {
	            notifications.unsubscribe();
	            this.notifications = undefined;
	        }
	        if (retriesSubscription) {
	            retriesSubscription.unsubscribe();
	            this.retriesSubscription = undefined;
	        }
	        this.retries = undefined;
	    };
	    RepeatWhenSubscriber.prototype._unsubscribeAndRecycle = function () {
	        var _unsubscribe = this._unsubscribe;
	        this._unsubscribe = null;
	        _super.prototype._unsubscribeAndRecycle.call(this);
	        this._unsubscribe = _unsubscribe;
	        return this;
	    };
	    RepeatWhenSubscriber.prototype.subscribeToRetries = function () {
	        this.notifications = new Subject();
	        var retries;
	        try {
	            var notifier = this.notifier;
	            retries = notifier(this.notifications);
	        }
	        catch (e) {
	            return _super.prototype.complete.call(this);
	        }
	        this.retries = retries;
	        this.retriesSubscription = innerSubscribe(retries, new SimpleInnerSubscriber(this));
	    };
	    return RepeatWhenSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function retry(count) {
	    if (count === void 0) {
	        count = -1;
	    }
	    return function (source) { return source.lift(new RetryOperator(count, source)); };
	}
	var RetryOperator = /*@__PURE__*/ (function () {
	    function RetryOperator(count, source) {
	        this.count = count;
	        this.source = source;
	    }
	    RetryOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new RetrySubscriber(subscriber, this.count, this.source));
	    };
	    return RetryOperator;
	}());
	var RetrySubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(RetrySubscriber, _super);
	    function RetrySubscriber(destination, count, source) {
	        var _this = _super.call(this, destination) || this;
	        _this.count = count;
	        _this.source = source;
	        return _this;
	    }
	    RetrySubscriber.prototype.error = function (err) {
	        if (!this.isStopped) {
	            var _a = this, source = _a.source, count = _a.count;
	            if (count === 0) {
	                return _super.prototype.error.call(this, err);
	            }
	            else if (count > -1) {
	                this.count = count - 1;
	            }
	            source.subscribe(this._unsubscribeAndRecycle());
	        }
	    };
	    return RetrySubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subject,_innerSubscribe PURE_IMPORTS_END */
	function retryWhen(notifier) {
	    return function (source) { return source.lift(new RetryWhenOperator(notifier, source)); };
	}
	var RetryWhenOperator = /*@__PURE__*/ (function () {
	    function RetryWhenOperator(notifier, source) {
	        this.notifier = notifier;
	        this.source = source;
	    }
	    RetryWhenOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new RetryWhenSubscriber(subscriber, this.notifier, this.source));
	    };
	    return RetryWhenOperator;
	}());
	var RetryWhenSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(RetryWhenSubscriber, _super);
	    function RetryWhenSubscriber(destination, notifier, source) {
	        var _this = _super.call(this, destination) || this;
	        _this.notifier = notifier;
	        _this.source = source;
	        return _this;
	    }
	    RetryWhenSubscriber.prototype.error = function (err) {
	        if (!this.isStopped) {
	            var errors = this.errors;
	            var retries = this.retries;
	            var retriesSubscription = this.retriesSubscription;
	            if (!retries) {
	                errors = new Subject();
	                try {
	                    var notifier = this.notifier;
	                    retries = notifier(errors);
	                }
	                catch (e) {
	                    return _super.prototype.error.call(this, e);
	                }
	                retriesSubscription = innerSubscribe(retries, new SimpleInnerSubscriber(this));
	            }
	            else {
	                this.errors = undefined;
	                this.retriesSubscription = undefined;
	            }
	            this._unsubscribeAndRecycle();
	            this.errors = errors;
	            this.retries = retries;
	            this.retriesSubscription = retriesSubscription;
	            errors.next(err);
	        }
	    };
	    RetryWhenSubscriber.prototype._unsubscribe = function () {
	        var _a = this, errors = _a.errors, retriesSubscription = _a.retriesSubscription;
	        if (errors) {
	            errors.unsubscribe();
	            this.errors = undefined;
	        }
	        if (retriesSubscription) {
	            retriesSubscription.unsubscribe();
	            this.retriesSubscription = undefined;
	        }
	        this.retries = undefined;
	    };
	    RetryWhenSubscriber.prototype.notifyNext = function () {
	        var _unsubscribe = this._unsubscribe;
	        this._unsubscribe = null;
	        this._unsubscribeAndRecycle();
	        this._unsubscribe = _unsubscribe;
	        this.source.subscribe(this);
	    };
	    return RetryWhenSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function sample(notifier) {
	    return function (source) { return source.lift(new SampleOperator(notifier)); };
	}
	var SampleOperator = /*@__PURE__*/ (function () {
	    function SampleOperator(notifier) {
	        this.notifier = notifier;
	    }
	    SampleOperator.prototype.call = function (subscriber, source) {
	        var sampleSubscriber = new SampleSubscriber(subscriber);
	        var subscription = source.subscribe(sampleSubscriber);
	        subscription.add(innerSubscribe(this.notifier, new SimpleInnerSubscriber(sampleSubscriber)));
	        return subscription;
	    };
	    return SampleOperator;
	}());
	var SampleSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SampleSubscriber, _super);
	    function SampleSubscriber() {
	        var _this = _super !== null && _super.apply(this, arguments) || this;
	        _this.hasValue = false;
	        return _this;
	    }
	    SampleSubscriber.prototype._next = function (value) {
	        this.value = value;
	        this.hasValue = true;
	    };
	    SampleSubscriber.prototype.notifyNext = function () {
	        this.emitValue();
	    };
	    SampleSubscriber.prototype.notifyComplete = function () {
	        this.emitValue();
	    };
	    SampleSubscriber.prototype.emitValue = function () {
	        if (this.hasValue) {
	            this.hasValue = false;
	            this.destination.next(this.value);
	        }
	    };
	    return SampleSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber,_scheduler_async PURE_IMPORTS_END */
	function sampleTime(period, scheduler) {
	    if (scheduler === void 0) {
	        scheduler = async;
	    }
	    return function (source) { return source.lift(new SampleTimeOperator(period, scheduler)); };
	}
	var SampleTimeOperator = /*@__PURE__*/ (function () {
	    function SampleTimeOperator(period, scheduler) {
	        this.period = period;
	        this.scheduler = scheduler;
	    }
	    SampleTimeOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new SampleTimeSubscriber(subscriber, this.period, this.scheduler));
	    };
	    return SampleTimeOperator;
	}());
	var SampleTimeSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SampleTimeSubscriber, _super);
	    function SampleTimeSubscriber(destination, period, scheduler) {
	        var _this = _super.call(this, destination) || this;
	        _this.period = period;
	        _this.scheduler = scheduler;
	        _this.hasValue = false;
	        _this.add(scheduler.schedule(dispatchNotification, period, { subscriber: _this, period: period }));
	        return _this;
	    }
	    SampleTimeSubscriber.prototype._next = function (value) {
	        this.lastValue = value;
	        this.hasValue = true;
	    };
	    SampleTimeSubscriber.prototype.notifyNext = function () {
	        if (this.hasValue) {
	            this.hasValue = false;
	            this.destination.next(this.lastValue);
	        }
	    };
	    return SampleTimeSubscriber;
	}(Subscriber));
	function dispatchNotification(state) {
	    var subscriber = state.subscriber, period = state.period;
	    subscriber.notifyNext();
	    this.schedule(state, period);
	}

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function sequenceEqual(compareTo, comparator) {
	    return function (source) { return source.lift(new SequenceEqualOperator(compareTo, comparator)); };
	}
	var SequenceEqualOperator = /*@__PURE__*/ (function () {
	    function SequenceEqualOperator(compareTo, comparator) {
	        this.compareTo = compareTo;
	        this.comparator = comparator;
	    }
	    SequenceEqualOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new SequenceEqualSubscriber(subscriber, this.compareTo, this.comparator));
	    };
	    return SequenceEqualOperator;
	}());
	var SequenceEqualSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SequenceEqualSubscriber, _super);
	    function SequenceEqualSubscriber(destination, compareTo, comparator) {
	        var _this = _super.call(this, destination) || this;
	        _this.compareTo = compareTo;
	        _this.comparator = comparator;
	        _this._a = [];
	        _this._b = [];
	        _this._oneComplete = false;
	        _this.destination.add(compareTo.subscribe(new SequenceEqualCompareToSubscriber(destination, _this)));
	        return _this;
	    }
	    SequenceEqualSubscriber.prototype._next = function (value) {
	        if (this._oneComplete && this._b.length === 0) {
	            this.emit(false);
	        }
	        else {
	            this._a.push(value);
	            this.checkValues();
	        }
	    };
	    SequenceEqualSubscriber.prototype._complete = function () {
	        if (this._oneComplete) {
	            this.emit(this._a.length === 0 && this._b.length === 0);
	        }
	        else {
	            this._oneComplete = true;
	        }
	        this.unsubscribe();
	    };
	    SequenceEqualSubscriber.prototype.checkValues = function () {
	        var _c = this, _a = _c._a, _b = _c._b, comparator = _c.comparator;
	        while (_a.length > 0 && _b.length > 0) {
	            var a = _a.shift();
	            var b = _b.shift();
	            var areEqual = false;
	            try {
	                areEqual = comparator ? comparator(a, b) : a === b;
	            }
	            catch (e) {
	                this.destination.error(e);
	            }
	            if (!areEqual) {
	                this.emit(false);
	            }
	        }
	    };
	    SequenceEqualSubscriber.prototype.emit = function (value) {
	        var destination = this.destination;
	        destination.next(value);
	        destination.complete();
	    };
	    SequenceEqualSubscriber.prototype.nextB = function (value) {
	        if (this._oneComplete && this._a.length === 0) {
	            this.emit(false);
	        }
	        else {
	            this._b.push(value);
	            this.checkValues();
	        }
	    };
	    SequenceEqualSubscriber.prototype.completeB = function () {
	        if (this._oneComplete) {
	            this.emit(this._a.length === 0 && this._b.length === 0);
	        }
	        else {
	            this._oneComplete = true;
	        }
	    };
	    return SequenceEqualSubscriber;
	}(Subscriber));
	var SequenceEqualCompareToSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SequenceEqualCompareToSubscriber, _super);
	    function SequenceEqualCompareToSubscriber(destination, parent) {
	        var _this = _super.call(this, destination) || this;
	        _this.parent = parent;
	        return _this;
	    }
	    SequenceEqualCompareToSubscriber.prototype._next = function (value) {
	        this.parent.nextB(value);
	    };
	    SequenceEqualCompareToSubscriber.prototype._error = function (err) {
	        this.parent.error(err);
	        this.unsubscribe();
	    };
	    SequenceEqualCompareToSubscriber.prototype._complete = function () {
	        this.parent.completeB();
	        this.unsubscribe();
	    };
	    return SequenceEqualCompareToSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _multicast,_refCount,_Subject PURE_IMPORTS_END */
	function shareSubjectFactory() {
	    return new Subject();
	}
	function share() {
	    return function (source) { return refCount()(multicast(shareSubjectFactory)(source)); };
	}

	/** PURE_IMPORTS_START _ReplaySubject PURE_IMPORTS_END */
	function shareReplay(configOrBufferSize, windowTime, scheduler) {
	    var config;
	    if (configOrBufferSize && typeof configOrBufferSize === 'object') {
	        config = configOrBufferSize;
	    }
	    else {
	        config = {
	            bufferSize: configOrBufferSize,
	            windowTime: windowTime,
	            refCount: false,
	            scheduler: scheduler
	        };
	    }
	    return function (source) { return source.lift(shareReplayOperator(config)); };
	}
	function shareReplayOperator(_a) {
	    var _b = _a.bufferSize, bufferSize = _b === void 0 ? Number.POSITIVE_INFINITY : _b, _c = _a.windowTime, windowTime = _c === void 0 ? Number.POSITIVE_INFINITY : _c, useRefCount = _a.refCount, scheduler = _a.scheduler;
	    var subject;
	    var refCount = 0;
	    var subscription;
	    var hasError = false;
	    var isComplete = false;
	    return function shareReplayOperation(source) {
	        refCount++;
	        var innerSub;
	        if (!subject || hasError) {
	            hasError = false;
	            subject = new ReplaySubject(bufferSize, windowTime, scheduler);
	            innerSub = subject.subscribe(this);
	            subscription = source.subscribe({
	                next: function (value) { subject.next(value); },
	                error: function (err) {
	                    hasError = true;
	                    subject.error(err);
	                },
	                complete: function () {
	                    isComplete = true;
	                    subscription = undefined;
	                    subject.complete();
	                },
	            });
	        }
	        else {
	            innerSub = subject.subscribe(this);
	        }
	        this.add(function () {
	            refCount--;
	            innerSub.unsubscribe();
	            if (subscription && !isComplete && useRefCount && refCount === 0) {
	                subscription.unsubscribe();
	                subscription = undefined;
	                subject = undefined;
	            }
	        });
	    };
	}

	/** PURE_IMPORTS_START tslib,_Subscriber,_util_EmptyError PURE_IMPORTS_END */
	function single(predicate) {
	    return function (source) { return source.lift(new SingleOperator(predicate, source)); };
	}
	var SingleOperator = /*@__PURE__*/ (function () {
	    function SingleOperator(predicate, source) {
	        this.predicate = predicate;
	        this.source = source;
	    }
	    SingleOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new SingleSubscriber(subscriber, this.predicate, this.source));
	    };
	    return SingleOperator;
	}());
	var SingleSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SingleSubscriber, _super);
	    function SingleSubscriber(destination, predicate, source) {
	        var _this = _super.call(this, destination) || this;
	        _this.predicate = predicate;
	        _this.source = source;
	        _this.seenValue = false;
	        _this.index = 0;
	        return _this;
	    }
	    SingleSubscriber.prototype.applySingleValue = function (value) {
	        if (this.seenValue) {
	            this.destination.error('Sequence contains more than one element');
	        }
	        else {
	            this.seenValue = true;
	            this.singleValue = value;
	        }
	    };
	    SingleSubscriber.prototype._next = function (value) {
	        var index = this.index++;
	        if (this.predicate) {
	            this.tryNext(value, index);
	        }
	        else {
	            this.applySingleValue(value);
	        }
	    };
	    SingleSubscriber.prototype.tryNext = function (value, index) {
	        try {
	            if (this.predicate(value, index, this.source)) {
	                this.applySingleValue(value);
	            }
	        }
	        catch (err) {
	            this.destination.error(err);
	        }
	    };
	    SingleSubscriber.prototype._complete = function () {
	        var destination = this.destination;
	        if (this.index > 0) {
	            destination.next(this.seenValue ? this.singleValue : undefined);
	            destination.complete();
	        }
	        else {
	            destination.error(new EmptyError);
	        }
	    };
	    return SingleSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function skip(count) {
	    return function (source) { return source.lift(new SkipOperator(count)); };
	}
	var SkipOperator = /*@__PURE__*/ (function () {
	    function SkipOperator(total) {
	        this.total = total;
	    }
	    SkipOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new SkipSubscriber(subscriber, this.total));
	    };
	    return SkipOperator;
	}());
	var SkipSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SkipSubscriber, _super);
	    function SkipSubscriber(destination, total) {
	        var _this = _super.call(this, destination) || this;
	        _this.total = total;
	        _this.count = 0;
	        return _this;
	    }
	    SkipSubscriber.prototype._next = function (x) {
	        if (++this.count > this.total) {
	            this.destination.next(x);
	        }
	    };
	    return SkipSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber,_util_ArgumentOutOfRangeError PURE_IMPORTS_END */
	function skipLast(count) {
	    return function (source) { return source.lift(new SkipLastOperator(count)); };
	}
	var SkipLastOperator = /*@__PURE__*/ (function () {
	    function SkipLastOperator(_skipCount) {
	        this._skipCount = _skipCount;
	        if (this._skipCount < 0) {
	            throw new ArgumentOutOfRangeError;
	        }
	    }
	    SkipLastOperator.prototype.call = function (subscriber, source) {
	        if (this._skipCount === 0) {
	            return source.subscribe(new Subscriber(subscriber));
	        }
	        else {
	            return source.subscribe(new SkipLastSubscriber(subscriber, this._skipCount));
	        }
	    };
	    return SkipLastOperator;
	}());
	var SkipLastSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SkipLastSubscriber, _super);
	    function SkipLastSubscriber(destination, _skipCount) {
	        var _this = _super.call(this, destination) || this;
	        _this._skipCount = _skipCount;
	        _this._count = 0;
	        _this._ring = new Array(_skipCount);
	        return _this;
	    }
	    SkipLastSubscriber.prototype._next = function (value) {
	        var skipCount = this._skipCount;
	        var count = this._count++;
	        if (count < skipCount) {
	            this._ring[count] = value;
	        }
	        else {
	            var currentIndex = count % skipCount;
	            var ring = this._ring;
	            var oldValue = ring[currentIndex];
	            ring[currentIndex] = value;
	            this.destination.next(oldValue);
	        }
	    };
	    return SkipLastSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function skipUntil(notifier) {
	    return function (source) { return source.lift(new SkipUntilOperator(notifier)); };
	}
	var SkipUntilOperator = /*@__PURE__*/ (function () {
	    function SkipUntilOperator(notifier) {
	        this.notifier = notifier;
	    }
	    SkipUntilOperator.prototype.call = function (destination, source) {
	        return source.subscribe(new SkipUntilSubscriber(destination, this.notifier));
	    };
	    return SkipUntilOperator;
	}());
	var SkipUntilSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SkipUntilSubscriber, _super);
	    function SkipUntilSubscriber(destination, notifier) {
	        var _this = _super.call(this, destination) || this;
	        _this.hasValue = false;
	        var innerSubscriber = new SimpleInnerSubscriber(_this);
	        _this.add(innerSubscriber);
	        _this.innerSubscription = innerSubscriber;
	        var innerSubscription = innerSubscribe(notifier, innerSubscriber);
	        if (innerSubscription !== innerSubscriber) {
	            _this.add(innerSubscription);
	            _this.innerSubscription = innerSubscription;
	        }
	        return _this;
	    }
	    SkipUntilSubscriber.prototype._next = function (value) {
	        if (this.hasValue) {
	            _super.prototype._next.call(this, value);
	        }
	    };
	    SkipUntilSubscriber.prototype.notifyNext = function () {
	        this.hasValue = true;
	        if (this.innerSubscription) {
	            this.innerSubscription.unsubscribe();
	        }
	    };
	    SkipUntilSubscriber.prototype.notifyComplete = function () {
	    };
	    return SkipUntilSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function skipWhile(predicate) {
	    return function (source) { return source.lift(new SkipWhileOperator(predicate)); };
	}
	var SkipWhileOperator = /*@__PURE__*/ (function () {
	    function SkipWhileOperator(predicate) {
	        this.predicate = predicate;
	    }
	    SkipWhileOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new SkipWhileSubscriber(subscriber, this.predicate));
	    };
	    return SkipWhileOperator;
	}());
	var SkipWhileSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SkipWhileSubscriber, _super);
	    function SkipWhileSubscriber(destination, predicate) {
	        var _this = _super.call(this, destination) || this;
	        _this.predicate = predicate;
	        _this.skipping = true;
	        _this.index = 0;
	        return _this;
	    }
	    SkipWhileSubscriber.prototype._next = function (value) {
	        var destination = this.destination;
	        if (this.skipping) {
	            this.tryCallPredicate(value);
	        }
	        if (!this.skipping) {
	            destination.next(value);
	        }
	    };
	    SkipWhileSubscriber.prototype.tryCallPredicate = function (value) {
	        try {
	            var result = this.predicate(value, this.index++);
	            this.skipping = Boolean(result);
	        }
	        catch (err) {
	            this.destination.error(err);
	        }
	    };
	    return SkipWhileSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START _observable_concat,_util_isScheduler PURE_IMPORTS_END */
	function startWith() {
	    var array = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        array[_i] = arguments[_i];
	    }
	    var scheduler = array[array.length - 1];
	    if (isScheduler(scheduler)) {
	        array.pop();
	        return function (source) { return concat(array, source, scheduler); };
	    }
	    else {
	        return function (source) { return concat(array, source); };
	    }
	}

	/** PURE_IMPORTS_START _observable_SubscribeOnObservable PURE_IMPORTS_END */
	function subscribeOn(scheduler, delay) {
	    if (delay === void 0) {
	        delay = 0;
	    }
	    return function subscribeOnOperatorFunction(source) {
	        return source.lift(new SubscribeOnOperator(scheduler, delay));
	    };
	}
	var SubscribeOnOperator = /*@__PURE__*/ (function () {
	    function SubscribeOnOperator(scheduler, delay) {
	        this.scheduler = scheduler;
	        this.delay = delay;
	    }
	    SubscribeOnOperator.prototype.call = function (subscriber, source) {
	        return new SubscribeOnObservable(source, this.delay, this.scheduler).subscribe(subscriber);
	    };
	    return SubscribeOnOperator;
	}());

	/** PURE_IMPORTS_START tslib,_map,_observable_from,_innerSubscribe PURE_IMPORTS_END */
	function switchMap(project, resultSelector) {
	    if (typeof resultSelector === 'function') {
	        return function (source) { return source.pipe(switchMap(function (a, i) { return from(project(a, i)).pipe(map(function (b, ii) { return resultSelector(a, b, i, ii); })); })); };
	    }
	    return function (source) { return source.lift(new SwitchMapOperator(project)); };
	}
	var SwitchMapOperator = /*@__PURE__*/ (function () {
	    function SwitchMapOperator(project) {
	        this.project = project;
	    }
	    SwitchMapOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new SwitchMapSubscriber(subscriber, this.project));
	    };
	    return SwitchMapOperator;
	}());
	var SwitchMapSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(SwitchMapSubscriber, _super);
	    function SwitchMapSubscriber(destination, project) {
	        var _this = _super.call(this, destination) || this;
	        _this.project = project;
	        _this.index = 0;
	        return _this;
	    }
	    SwitchMapSubscriber.prototype._next = function (value) {
	        var result;
	        var index = this.index++;
	        try {
	            result = this.project(value, index);
	        }
	        catch (error) {
	            this.destination.error(error);
	            return;
	        }
	        this._innerSub(result);
	    };
	    SwitchMapSubscriber.prototype._innerSub = function (result) {
	        var innerSubscription = this.innerSubscription;
	        if (innerSubscription) {
	            innerSubscription.unsubscribe();
	        }
	        var innerSubscriber = new SimpleInnerSubscriber(this);
	        var destination = this.destination;
	        destination.add(innerSubscriber);
	        this.innerSubscription = innerSubscribe(result, innerSubscriber);
	        if (this.innerSubscription !== innerSubscriber) {
	            destination.add(this.innerSubscription);
	        }
	    };
	    SwitchMapSubscriber.prototype._complete = function () {
	        var innerSubscription = this.innerSubscription;
	        if (!innerSubscription || innerSubscription.closed) {
	            _super.prototype._complete.call(this);
	        }
	        this.unsubscribe();
	    };
	    SwitchMapSubscriber.prototype._unsubscribe = function () {
	        this.innerSubscription = undefined;
	    };
	    SwitchMapSubscriber.prototype.notifyComplete = function () {
	        this.innerSubscription = undefined;
	        if (this.isStopped) {
	            _super.prototype._complete.call(this);
	        }
	    };
	    SwitchMapSubscriber.prototype.notifyNext = function (innerValue) {
	        this.destination.next(innerValue);
	    };
	    return SwitchMapSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START _switchMap,_util_identity PURE_IMPORTS_END */
	function switchAll() {
	    return switchMap(identity);
	}

	/** PURE_IMPORTS_START _switchMap PURE_IMPORTS_END */
	function switchMapTo(innerObservable, resultSelector) {
	    return resultSelector ? switchMap(function () { return innerObservable; }, resultSelector) : switchMap(function () { return innerObservable; });
	}

	/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */
	function takeUntil(notifier) {
	    return function (source) { return source.lift(new TakeUntilOperator(notifier)); };
	}
	var TakeUntilOperator = /*@__PURE__*/ (function () {
	    function TakeUntilOperator(notifier) {
	        this.notifier = notifier;
	    }
	    TakeUntilOperator.prototype.call = function (subscriber, source) {
	        var takeUntilSubscriber = new TakeUntilSubscriber(subscriber);
	        var notifierSubscription = innerSubscribe(this.notifier, new SimpleInnerSubscriber(takeUntilSubscriber));
	        if (notifierSubscription && !takeUntilSubscriber.seenValue) {
	            takeUntilSubscriber.add(notifierSubscription);
	            return source.subscribe(takeUntilSubscriber);
	        }
	        return takeUntilSubscriber;
	    };
	    return TakeUntilOperator;
	}());
	var TakeUntilSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(TakeUntilSubscriber, _super);
	    function TakeUntilSubscriber(destination) {
	        var _this = _super.call(this, destination) || this;
	        _this.seenValue = false;
	        return _this;
	    }
	    TakeUntilSubscriber.prototype.notifyNext = function () {
	        this.seenValue = true;
	        this.complete();
	    };
	    TakeUntilSubscriber.prototype.notifyComplete = function () {
	    };
	    return TakeUntilSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
	function takeWhile(predicate, inclusive) {
	    if (inclusive === void 0) {
	        inclusive = false;
	    }
	    return function (source) {
	        return source.lift(new TakeWhileOperator(predicate, inclusive));
	    };
	}
	var TakeWhileOperator = /*@__PURE__*/ (function () {
	    function TakeWhileOperator(predicate, inclusive) {
	        this.predicate = predicate;
	        this.inclusive = inclusive;
	    }
	    TakeWhileOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new TakeWhileSubscriber(subscriber, this.predicate, this.inclusive));
	    };
	    return TakeWhileOperator;
	}());
	var TakeWhileSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(TakeWhileSubscriber, _super);
	    function TakeWhileSubscriber(destination, predicate, inclusive) {
	        var _this = _super.call(this, destination) || this;
	        _this.predicate = predicate;
	        _this.inclusive = inclusive;
	        _this.index = 0;
	        return _this;
	    }
	    TakeWhileSubscriber.prototype._next = function (value) {
	        var destination = this.destination;
	        var result;
	        try {
	            result = this.predicate(value, this.index++);
	        }
	        catch (err) {
	            destination.error(err);
	            return;
	        }
	        this.nextOrComplete(value, result);
	    };
	    TakeWhileSubscriber.prototype.nextOrComplete = function (value, predicateResult) {
	        var destination = this.destination;
	        if (Boolean(predicateResult)) {
	            destination.next(value);
	        }
	        else {
	            if (this.inclusive) {
	                destination.next(value);
	            }
	            destination.complete();
	        }
	    };
	    return TakeWhileSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber,_util_noop,_util_isFunction PURE_IMPORTS_END */
	function tap(nextOrObserver, error, complete) {
	    return function tapOperatorFunction(source) {
	        return source.lift(new DoOperator(nextOrObserver, error, complete));
	    };
	}
	var DoOperator = /*@__PURE__*/ (function () {
	    function DoOperator(nextOrObserver, error, complete) {
	        this.nextOrObserver = nextOrObserver;
	        this.error = error;
	        this.complete = complete;
	    }
	    DoOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new TapSubscriber(subscriber, this.nextOrObserver, this.error, this.complete));
	    };
	    return DoOperator;
	}());
	var TapSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(TapSubscriber, _super);
	    function TapSubscriber(destination, observerOrNext, error, complete) {
	        var _this = _super.call(this, destination) || this;
	        _this._tapNext = noop;
	        _this._tapError = noop;
	        _this._tapComplete = noop;
	        _this._tapError = error || noop;
	        _this._tapComplete = complete || noop;
	        if (isFunction(observerOrNext)) {
	            _this._context = _this;
	            _this._tapNext = observerOrNext;
	        }
	        else if (observerOrNext) {
	            _this._context = observerOrNext;
	            _this._tapNext = observerOrNext.next || noop;
	            _this._tapError = observerOrNext.error || noop;
	            _this._tapComplete = observerOrNext.complete || noop;
	        }
	        return _this;
	    }
	    TapSubscriber.prototype._next = function (value) {
	        try {
	            this._tapNext.call(this._context, value);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        this.destination.next(value);
	    };
	    TapSubscriber.prototype._error = function (err) {
	        try {
	            this._tapError.call(this._context, err);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        this.destination.error(err);
	    };
	    TapSubscriber.prototype._complete = function () {
	        try {
	            this._tapComplete.call(this._context);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        return this.destination.complete();
	    };
	    return TapSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber,_scheduler_async,_throttle PURE_IMPORTS_END */
	function throttleTime(duration, scheduler, config) {
	    if (scheduler === void 0) {
	        scheduler = async;
	    }
	    if (config === void 0) {
	        config = defaultThrottleConfig;
	    }
	    return function (source) { return source.lift(new ThrottleTimeOperator(duration, scheduler, config.leading, config.trailing)); };
	}
	var ThrottleTimeOperator = /*@__PURE__*/ (function () {
	    function ThrottleTimeOperator(duration, scheduler, leading, trailing) {
	        this.duration = duration;
	        this.scheduler = scheduler;
	        this.leading = leading;
	        this.trailing = trailing;
	    }
	    ThrottleTimeOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new ThrottleTimeSubscriber(subscriber, this.duration, this.scheduler, this.leading, this.trailing));
	    };
	    return ThrottleTimeOperator;
	}());
	var ThrottleTimeSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(ThrottleTimeSubscriber, _super);
	    function ThrottleTimeSubscriber(destination, duration, scheduler, leading, trailing) {
	        var _this = _super.call(this, destination) || this;
	        _this.duration = duration;
	        _this.scheduler = scheduler;
	        _this.leading = leading;
	        _this.trailing = trailing;
	        _this._hasTrailingValue = false;
	        _this._trailingValue = null;
	        return _this;
	    }
	    ThrottleTimeSubscriber.prototype._next = function (value) {
	        if (this.throttled) {
	            if (this.trailing) {
	                this._trailingValue = value;
	                this._hasTrailingValue = true;
	            }
	        }
	        else {
	            this.add(this.throttled = this.scheduler.schedule(dispatchNext$3, this.duration, { subscriber: this }));
	            if (this.leading) {
	                this.destination.next(value);
	            }
	            else if (this.trailing) {
	                this._trailingValue = value;
	                this._hasTrailingValue = true;
	            }
	        }
	    };
	    ThrottleTimeSubscriber.prototype._complete = function () {
	        if (this._hasTrailingValue) {
	            this.destination.next(this._trailingValue);
	            this.destination.complete();
	        }
	        else {
	            this.destination.complete();
	        }
	    };
	    ThrottleTimeSubscriber.prototype.clearThrottle = function () {
	        var throttled = this.throttled;
	        if (throttled) {
	            if (this.trailing && this._hasTrailingValue) {
	                this.destination.next(this._trailingValue);
	                this._trailingValue = null;
	                this._hasTrailingValue = false;
	            }
	            throttled.unsubscribe();
	            this.remove(throttled);
	            this.throttled = null;
	        }
	    };
	    return ThrottleTimeSubscriber;
	}(Subscriber));
	function dispatchNext$3(arg) {
	    var subscriber = arg.subscriber;
	    subscriber.clearThrottle();
	}

	/** PURE_IMPORTS_START tslib,_scheduler_async,_util_isDate,_innerSubscribe PURE_IMPORTS_END */
	function timeoutWith(due, withObservable, scheduler) {
	    if (scheduler === void 0) {
	        scheduler = async;
	    }
	    return function (source) {
	        var absoluteTimeout = isDate(due);
	        var waitFor = absoluteTimeout ? (+due - scheduler.now()) : Math.abs(due);
	        return source.lift(new TimeoutWithOperator(waitFor, absoluteTimeout, withObservable, scheduler));
	    };
	}
	var TimeoutWithOperator = /*@__PURE__*/ (function () {
	    function TimeoutWithOperator(waitFor, absoluteTimeout, withObservable, scheduler) {
	        this.waitFor = waitFor;
	        this.absoluteTimeout = absoluteTimeout;
	        this.withObservable = withObservable;
	        this.scheduler = scheduler;
	    }
	    TimeoutWithOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new TimeoutWithSubscriber(subscriber, this.absoluteTimeout, this.waitFor, this.withObservable, this.scheduler));
	    };
	    return TimeoutWithOperator;
	}());
	var TimeoutWithSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(TimeoutWithSubscriber, _super);
	    function TimeoutWithSubscriber(destination, absoluteTimeout, waitFor, withObservable, scheduler) {
	        var _this = _super.call(this, destination) || this;
	        _this.absoluteTimeout = absoluteTimeout;
	        _this.waitFor = waitFor;
	        _this.withObservable = withObservable;
	        _this.scheduler = scheduler;
	        _this.scheduleTimeout();
	        return _this;
	    }
	    TimeoutWithSubscriber.dispatchTimeout = function (subscriber) {
	        var withObservable = subscriber.withObservable;
	        subscriber._unsubscribeAndRecycle();
	        subscriber.add(innerSubscribe(withObservable, new SimpleInnerSubscriber(subscriber)));
	    };
	    TimeoutWithSubscriber.prototype.scheduleTimeout = function () {
	        var action = this.action;
	        if (action) {
	            this.action = action.schedule(this, this.waitFor);
	        }
	        else {
	            this.add(this.action = this.scheduler.schedule(TimeoutWithSubscriber.dispatchTimeout, this.waitFor, this));
	        }
	    };
	    TimeoutWithSubscriber.prototype._next = function (value) {
	        if (!this.absoluteTimeout) {
	            this.scheduleTimeout();
	        }
	        _super.prototype._next.call(this, value);
	    };
	    TimeoutWithSubscriber.prototype._unsubscribe = function () {
	        this.action = undefined;
	        this.scheduler = null;
	        this.withObservable = null;
	    };
	    return TimeoutWithSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START _scheduler_async,_util_TimeoutError,_timeoutWith,_observable_throwError PURE_IMPORTS_END */
	function timeout(due, scheduler) {
	    if (scheduler === void 0) {
	        scheduler = async;
	    }
	    return timeoutWith(due, throwError(new TimeoutError()), scheduler);
	}

	/** PURE_IMPORTS_START _reduce PURE_IMPORTS_END */
	function toArrayReducer(arr, item, index) {
	    if (index === 0) {
	        return [item];
	    }
	    arr.push(item);
	    return arr;
	}
	function toArray() {
	    return reduce(toArrayReducer, []);
	}

	/** PURE_IMPORTS_START tslib,_Subject,_innerSubscribe PURE_IMPORTS_END */
	function window$1(windowBoundaries) {
	    return function windowOperatorFunction(source) {
	        return source.lift(new WindowOperator(windowBoundaries));
	    };
	}
	var WindowOperator = /*@__PURE__*/ (function () {
	    function WindowOperator(windowBoundaries) {
	        this.windowBoundaries = windowBoundaries;
	    }
	    WindowOperator.prototype.call = function (subscriber, source) {
	        var windowSubscriber = new WindowSubscriber(subscriber);
	        var sourceSubscription = source.subscribe(windowSubscriber);
	        if (!sourceSubscription.closed) {
	            windowSubscriber.add(innerSubscribe(this.windowBoundaries, new SimpleInnerSubscriber(windowSubscriber)));
	        }
	        return sourceSubscription;
	    };
	    return WindowOperator;
	}());
	var WindowSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(WindowSubscriber, _super);
	    function WindowSubscriber(destination) {
	        var _this = _super.call(this, destination) || this;
	        _this.window = new Subject();
	        destination.next(_this.window);
	        return _this;
	    }
	    WindowSubscriber.prototype.notifyNext = function () {
	        this.openWindow();
	    };
	    WindowSubscriber.prototype.notifyError = function (error) {
	        this._error(error);
	    };
	    WindowSubscriber.prototype.notifyComplete = function () {
	        this._complete();
	    };
	    WindowSubscriber.prototype._next = function (value) {
	        this.window.next(value);
	    };
	    WindowSubscriber.prototype._error = function (err) {
	        this.window.error(err);
	        this.destination.error(err);
	    };
	    WindowSubscriber.prototype._complete = function () {
	        this.window.complete();
	        this.destination.complete();
	    };
	    WindowSubscriber.prototype._unsubscribe = function () {
	        this.window = null;
	    };
	    WindowSubscriber.prototype.openWindow = function () {
	        var prevWindow = this.window;
	        if (prevWindow) {
	            prevWindow.complete();
	        }
	        var destination = this.destination;
	        var newWindow = this.window = new Subject();
	        destination.next(newWindow);
	    };
	    return WindowSubscriber;
	}(SimpleOuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subscriber,_Subject PURE_IMPORTS_END */
	function windowCount(windowSize, startWindowEvery) {
	    if (startWindowEvery === void 0) {
	        startWindowEvery = 0;
	    }
	    return function windowCountOperatorFunction(source) {
	        return source.lift(new WindowCountOperator(windowSize, startWindowEvery));
	    };
	}
	var WindowCountOperator = /*@__PURE__*/ (function () {
	    function WindowCountOperator(windowSize, startWindowEvery) {
	        this.windowSize = windowSize;
	        this.startWindowEvery = startWindowEvery;
	    }
	    WindowCountOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new WindowCountSubscriber(subscriber, this.windowSize, this.startWindowEvery));
	    };
	    return WindowCountOperator;
	}());
	var WindowCountSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(WindowCountSubscriber, _super);
	    function WindowCountSubscriber(destination, windowSize, startWindowEvery) {
	        var _this = _super.call(this, destination) || this;
	        _this.destination = destination;
	        _this.windowSize = windowSize;
	        _this.startWindowEvery = startWindowEvery;
	        _this.windows = [new Subject()];
	        _this.count = 0;
	        destination.next(_this.windows[0]);
	        return _this;
	    }
	    WindowCountSubscriber.prototype._next = function (value) {
	        var startWindowEvery = (this.startWindowEvery > 0) ? this.startWindowEvery : this.windowSize;
	        var destination = this.destination;
	        var windowSize = this.windowSize;
	        var windows = this.windows;
	        var len = windows.length;
	        for (var i = 0; i < len && !this.closed; i++) {
	            windows[i].next(value);
	        }
	        var c = this.count - windowSize + 1;
	        if (c >= 0 && c % startWindowEvery === 0 && !this.closed) {
	            windows.shift().complete();
	        }
	        if (++this.count % startWindowEvery === 0 && !this.closed) {
	            var window_1 = new Subject();
	            windows.push(window_1);
	            destination.next(window_1);
	        }
	    };
	    WindowCountSubscriber.prototype._error = function (err) {
	        var windows = this.windows;
	        if (windows) {
	            while (windows.length > 0 && !this.closed) {
	                windows.shift().error(err);
	            }
	        }
	        this.destination.error(err);
	    };
	    WindowCountSubscriber.prototype._complete = function () {
	        var windows = this.windows;
	        if (windows) {
	            while (windows.length > 0 && !this.closed) {
	                windows.shift().complete();
	            }
	        }
	        this.destination.complete();
	    };
	    WindowCountSubscriber.prototype._unsubscribe = function () {
	        this.count = 0;
	        this.windows = null;
	    };
	    return WindowCountSubscriber;
	}(Subscriber));

	/** PURE_IMPORTS_START tslib,_Subject,_scheduler_async,_Subscriber,_util_isNumeric,_util_isScheduler PURE_IMPORTS_END */
	function windowTime(windowTimeSpan) {
	    var scheduler = async;
	    var windowCreationInterval = null;
	    var maxWindowSize = Number.POSITIVE_INFINITY;
	    if (isScheduler(arguments[3])) {
	        scheduler = arguments[3];
	    }
	    if (isScheduler(arguments[2])) {
	        scheduler = arguments[2];
	    }
	    else if (isNumeric(arguments[2])) {
	        maxWindowSize = Number(arguments[2]);
	    }
	    if (isScheduler(arguments[1])) {
	        scheduler = arguments[1];
	    }
	    else if (isNumeric(arguments[1])) {
	        windowCreationInterval = Number(arguments[1]);
	    }
	    return function windowTimeOperatorFunction(source) {
	        return source.lift(new WindowTimeOperator(windowTimeSpan, windowCreationInterval, maxWindowSize, scheduler));
	    };
	}
	var WindowTimeOperator = /*@__PURE__*/ (function () {
	    function WindowTimeOperator(windowTimeSpan, windowCreationInterval, maxWindowSize, scheduler) {
	        this.windowTimeSpan = windowTimeSpan;
	        this.windowCreationInterval = windowCreationInterval;
	        this.maxWindowSize = maxWindowSize;
	        this.scheduler = scheduler;
	    }
	    WindowTimeOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new WindowTimeSubscriber(subscriber, this.windowTimeSpan, this.windowCreationInterval, this.maxWindowSize, this.scheduler));
	    };
	    return WindowTimeOperator;
	}());
	var CountedSubject = /*@__PURE__*/ (function (_super) {
	    __extends(CountedSubject, _super);
	    function CountedSubject() {
	        var _this = _super !== null && _super.apply(this, arguments) || this;
	        _this._numberOfNextedValues = 0;
	        return _this;
	    }
	    CountedSubject.prototype.next = function (value) {
	        this._numberOfNextedValues++;
	        _super.prototype.next.call(this, value);
	    };
	    Object.defineProperty(CountedSubject.prototype, "numberOfNextedValues", {
	        get: function () {
	            return this._numberOfNextedValues;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return CountedSubject;
	}(Subject));
	var WindowTimeSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(WindowTimeSubscriber, _super);
	    function WindowTimeSubscriber(destination, windowTimeSpan, windowCreationInterval, maxWindowSize, scheduler) {
	        var _this = _super.call(this, destination) || this;
	        _this.destination = destination;
	        _this.windowTimeSpan = windowTimeSpan;
	        _this.windowCreationInterval = windowCreationInterval;
	        _this.maxWindowSize = maxWindowSize;
	        _this.scheduler = scheduler;
	        _this.windows = [];
	        var window = _this.openWindow();
	        if (windowCreationInterval !== null && windowCreationInterval >= 0) {
	            var closeState = { subscriber: _this, window: window, context: null };
	            var creationState = { windowTimeSpan: windowTimeSpan, windowCreationInterval: windowCreationInterval, subscriber: _this, scheduler: scheduler };
	            _this.add(scheduler.schedule(dispatchWindowClose, windowTimeSpan, closeState));
	            _this.add(scheduler.schedule(dispatchWindowCreation, windowCreationInterval, creationState));
	        }
	        else {
	            var timeSpanOnlyState = { subscriber: _this, window: window, windowTimeSpan: windowTimeSpan };
	            _this.add(scheduler.schedule(dispatchWindowTimeSpanOnly, windowTimeSpan, timeSpanOnlyState));
	        }
	        return _this;
	    }
	    WindowTimeSubscriber.prototype._next = function (value) {
	        var windows = this.windows;
	        var len = windows.length;
	        for (var i = 0; i < len; i++) {
	            var window_1 = windows[i];
	            if (!window_1.closed) {
	                window_1.next(value);
	                if (window_1.numberOfNextedValues >= this.maxWindowSize) {
	                    this.closeWindow(window_1);
	                }
	            }
	        }
	    };
	    WindowTimeSubscriber.prototype._error = function (err) {
	        var windows = this.windows;
	        while (windows.length > 0) {
	            windows.shift().error(err);
	        }
	        this.destination.error(err);
	    };
	    WindowTimeSubscriber.prototype._complete = function () {
	        var windows = this.windows;
	        while (windows.length > 0) {
	            var window_2 = windows.shift();
	            if (!window_2.closed) {
	                window_2.complete();
	            }
	        }
	        this.destination.complete();
	    };
	    WindowTimeSubscriber.prototype.openWindow = function () {
	        var window = new CountedSubject();
	        this.windows.push(window);
	        var destination = this.destination;
	        destination.next(window);
	        return window;
	    };
	    WindowTimeSubscriber.prototype.closeWindow = function (window) {
	        window.complete();
	        var windows = this.windows;
	        windows.splice(windows.indexOf(window), 1);
	    };
	    return WindowTimeSubscriber;
	}(Subscriber));
	function dispatchWindowTimeSpanOnly(state) {
	    var subscriber = state.subscriber, windowTimeSpan = state.windowTimeSpan, window = state.window;
	    if (window) {
	        subscriber.closeWindow(window);
	    }
	    state.window = subscriber.openWindow();
	    this.schedule(state, windowTimeSpan);
	}
	function dispatchWindowCreation(state) {
	    var windowTimeSpan = state.windowTimeSpan, subscriber = state.subscriber, scheduler = state.scheduler, windowCreationInterval = state.windowCreationInterval;
	    var window = subscriber.openWindow();
	    var action = this;
	    var context = { action: action, subscription: null };
	    var timeSpanState = { subscriber: subscriber, window: window, context: context };
	    context.subscription = scheduler.schedule(dispatchWindowClose, windowTimeSpan, timeSpanState);
	    action.add(context.subscription);
	    action.schedule(state, windowCreationInterval);
	}
	function dispatchWindowClose(state) {
	    var subscriber = state.subscriber, window = state.window, context = state.context;
	    if (context && context.action && context.subscription) {
	        context.action.remove(context.subscription);
	    }
	    subscriber.closeWindow(window);
	}

	/** PURE_IMPORTS_START tslib,_Subject,_Subscription,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
	function windowToggle(openings, closingSelector) {
	    return function (source) { return source.lift(new WindowToggleOperator(openings, closingSelector)); };
	}
	var WindowToggleOperator = /*@__PURE__*/ (function () {
	    function WindowToggleOperator(openings, closingSelector) {
	        this.openings = openings;
	        this.closingSelector = closingSelector;
	    }
	    WindowToggleOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new WindowToggleSubscriber(subscriber, this.openings, this.closingSelector));
	    };
	    return WindowToggleOperator;
	}());
	var WindowToggleSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(WindowToggleSubscriber, _super);
	    function WindowToggleSubscriber(destination, openings, closingSelector) {
	        var _this = _super.call(this, destination) || this;
	        _this.openings = openings;
	        _this.closingSelector = closingSelector;
	        _this.contexts = [];
	        _this.add(_this.openSubscription = subscribeToResult(_this, openings, openings));
	        return _this;
	    }
	    WindowToggleSubscriber.prototype._next = function (value) {
	        var contexts = this.contexts;
	        if (contexts) {
	            var len = contexts.length;
	            for (var i = 0; i < len; i++) {
	                contexts[i].window.next(value);
	            }
	        }
	    };
	    WindowToggleSubscriber.prototype._error = function (err) {
	        var contexts = this.contexts;
	        this.contexts = null;
	        if (contexts) {
	            var len = contexts.length;
	            var index = -1;
	            while (++index < len) {
	                var context_1 = contexts[index];
	                context_1.window.error(err);
	                context_1.subscription.unsubscribe();
	            }
	        }
	        _super.prototype._error.call(this, err);
	    };
	    WindowToggleSubscriber.prototype._complete = function () {
	        var contexts = this.contexts;
	        this.contexts = null;
	        if (contexts) {
	            var len = contexts.length;
	            var index = -1;
	            while (++index < len) {
	                var context_2 = contexts[index];
	                context_2.window.complete();
	                context_2.subscription.unsubscribe();
	            }
	        }
	        _super.prototype._complete.call(this);
	    };
	    WindowToggleSubscriber.prototype._unsubscribe = function () {
	        var contexts = this.contexts;
	        this.contexts = null;
	        if (contexts) {
	            var len = contexts.length;
	            var index = -1;
	            while (++index < len) {
	                var context_3 = contexts[index];
	                context_3.window.unsubscribe();
	                context_3.subscription.unsubscribe();
	            }
	        }
	    };
	    WindowToggleSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
	        if (outerValue === this.openings) {
	            var closingNotifier = void 0;
	            try {
	                var closingSelector = this.closingSelector;
	                closingNotifier = closingSelector(innerValue);
	            }
	            catch (e) {
	                return this.error(e);
	            }
	            var window_1 = new Subject();
	            var subscription = new Subscription();
	            var context_4 = { window: window_1, subscription: subscription };
	            this.contexts.push(context_4);
	            var innerSubscription = subscribeToResult(this, closingNotifier, context_4);
	            if (innerSubscription.closed) {
	                this.closeWindow(this.contexts.length - 1);
	            }
	            else {
	                innerSubscription.context = context_4;
	                subscription.add(innerSubscription);
	            }
	            this.destination.next(window_1);
	        }
	        else {
	            this.closeWindow(this.contexts.indexOf(outerValue));
	        }
	    };
	    WindowToggleSubscriber.prototype.notifyError = function (err) {
	        this.error(err);
	    };
	    WindowToggleSubscriber.prototype.notifyComplete = function (inner) {
	        if (inner !== this.openSubscription) {
	            this.closeWindow(this.contexts.indexOf(inner.context));
	        }
	    };
	    WindowToggleSubscriber.prototype.closeWindow = function (index) {
	        if (index === -1) {
	            return;
	        }
	        var contexts = this.contexts;
	        var context = contexts[index];
	        var window = context.window, subscription = context.subscription;
	        contexts.splice(index, 1);
	        window.complete();
	        subscription.unsubscribe();
	    };
	    return WindowToggleSubscriber;
	}(OuterSubscriber));

	/** PURE_IMPORTS_START tslib,_Subject,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
	function windowWhen(closingSelector) {
	    return function windowWhenOperatorFunction(source) {
	        return source.lift(new WindowOperator$1(closingSelector));
	    };
	}
	var WindowOperator$1 = /*@__PURE__*/ (function () {
	    function WindowOperator(closingSelector) {
	        this.closingSelector = closingSelector;
	    }
	    WindowOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new WindowSubscriber$1(subscriber, this.closingSelector));
	    };
	    return WindowOperator;
	}());
	var WindowSubscriber$1 = /*@__PURE__*/ (function (_super) {
	    __extends(WindowSubscriber, _super);
	    function WindowSubscriber(destination, closingSelector) {
	        var _this = _super.call(this, destination) || this;
	        _this.destination = destination;
	        _this.closingSelector = closingSelector;
	        _this.openWindow();
	        return _this;
	    }
	    WindowSubscriber.prototype.notifyNext = function (_outerValue, _innerValue, _outerIndex, _innerIndex, innerSub) {
	        this.openWindow(innerSub);
	    };
	    WindowSubscriber.prototype.notifyError = function (error) {
	        this._error(error);
	    };
	    WindowSubscriber.prototype.notifyComplete = function (innerSub) {
	        this.openWindow(innerSub);
	    };
	    WindowSubscriber.prototype._next = function (value) {
	        this.window.next(value);
	    };
	    WindowSubscriber.prototype._error = function (err) {
	        this.window.error(err);
	        this.destination.error(err);
	        this.unsubscribeClosingNotification();
	    };
	    WindowSubscriber.prototype._complete = function () {
	        this.window.complete();
	        this.destination.complete();
	        this.unsubscribeClosingNotification();
	    };
	    WindowSubscriber.prototype.unsubscribeClosingNotification = function () {
	        if (this.closingNotification) {
	            this.closingNotification.unsubscribe();
	        }
	    };
	    WindowSubscriber.prototype.openWindow = function (innerSub) {
	        if (innerSub === void 0) {
	            innerSub = null;
	        }
	        if (innerSub) {
	            this.remove(innerSub);
	            innerSub.unsubscribe();
	        }
	        var prevWindow = this.window;
	        if (prevWindow) {
	            prevWindow.complete();
	        }
	        var window = this.window = new Subject();
	        this.destination.next(window);
	        var closingNotifier;
	        try {
	            var closingSelector = this.closingSelector;
	            closingNotifier = closingSelector();
	        }
	        catch (e) {
	            this.destination.error(e);
	            this.window.error(e);
	            return;
	        }
	        this.add(this.closingNotification = subscribeToResult(this, closingNotifier));
	    };
	    return WindowSubscriber;
	}(OuterSubscriber));

	/** PURE_IMPORTS_START tslib,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
	function withLatestFrom() {
	    var args = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        args[_i] = arguments[_i];
	    }
	    return function (source) {
	        var project;
	        if (typeof args[args.length - 1] === 'function') {
	            project = args.pop();
	        }
	        var observables = args;
	        return source.lift(new WithLatestFromOperator(observables, project));
	    };
	}
	var WithLatestFromOperator = /*@__PURE__*/ (function () {
	    function WithLatestFromOperator(observables, project) {
	        this.observables = observables;
	        this.project = project;
	    }
	    WithLatestFromOperator.prototype.call = function (subscriber, source) {
	        return source.subscribe(new WithLatestFromSubscriber(subscriber, this.observables, this.project));
	    };
	    return WithLatestFromOperator;
	}());
	var WithLatestFromSubscriber = /*@__PURE__*/ (function (_super) {
	    __extends(WithLatestFromSubscriber, _super);
	    function WithLatestFromSubscriber(destination, observables, project) {
	        var _this = _super.call(this, destination) || this;
	        _this.observables = observables;
	        _this.project = project;
	        _this.toRespond = [];
	        var len = observables.length;
	        _this.values = new Array(len);
	        for (var i = 0; i < len; i++) {
	            _this.toRespond.push(i);
	        }
	        for (var i = 0; i < len; i++) {
	            var observable = observables[i];
	            _this.add(subscribeToResult(_this, observable, undefined, i));
	        }
	        return _this;
	    }
	    WithLatestFromSubscriber.prototype.notifyNext = function (_outerValue, innerValue, outerIndex) {
	        this.values[outerIndex] = innerValue;
	        var toRespond = this.toRespond;
	        if (toRespond.length > 0) {
	            var found = toRespond.indexOf(outerIndex);
	            if (found !== -1) {
	                toRespond.splice(found, 1);
	            }
	        }
	    };
	    WithLatestFromSubscriber.prototype.notifyComplete = function () {
	    };
	    WithLatestFromSubscriber.prototype._next = function (value) {
	        if (this.toRespond.length === 0) {
	            var args = [value].concat(this.values);
	            if (this.project) {
	                this._tryProject(args);
	            }
	            else {
	                this.destination.next(args);
	            }
	        }
	    };
	    WithLatestFromSubscriber.prototype._tryProject = function (args) {
	        var result;
	        try {
	            result = this.project.apply(this, args);
	        }
	        catch (err) {
	            this.destination.error(err);
	            return;
	        }
	        this.destination.next(result);
	    };
	    return WithLatestFromSubscriber;
	}(OuterSubscriber));

	/** PURE_IMPORTS_START _observable_zip PURE_IMPORTS_END */
	function zip$1() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    return function zipOperatorFunction(source) {
	        return source.lift.call(zip.apply(void 0, [source].concat(observables)));
	    };
	}

	/** PURE_IMPORTS_START _observable_zip PURE_IMPORTS_END */
	function zipAll(project) {
	    return function (source) { return source.lift(new ZipOperator(project)); };
	}

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */

	var operators = /*#__PURE__*/Object.freeze({
		__proto__: null,
		audit: audit,
		auditTime: auditTime,
		buffer: buffer,
		bufferCount: bufferCount,
		bufferTime: bufferTime,
		bufferToggle: bufferToggle,
		bufferWhen: bufferWhen,
		catchError: catchError,
		combineAll: combineAll,
		combineLatest: combineLatest$1,
		concat: concat$1,
		concatAll: concatAll,
		concatMap: concatMap,
		concatMapTo: concatMapTo,
		count: count,
		debounce: debounce,
		debounceTime: debounceTime,
		defaultIfEmpty: defaultIfEmpty,
		delay: delay,
		delayWhen: delayWhen,
		dematerialize: dematerialize,
		distinct: distinct,
		distinctUntilChanged: distinctUntilChanged,
		distinctUntilKeyChanged: distinctUntilKeyChanged,
		elementAt: elementAt,
		endWith: endWith,
		every: every,
		exhaust: exhaust,
		exhaustMap: exhaustMap,
		expand: expand,
		filter: filter,
		finalize: finalize,
		find: find,
		findIndex: findIndex,
		first: first,
		groupBy: groupBy,
		ignoreElements: ignoreElements,
		isEmpty: isEmpty,
		last: last,
		map: map,
		mapTo: mapTo,
		materialize: materialize,
		max: max,
		merge: merge$1,
		mergeAll: mergeAll,
		mergeMap: mergeMap,
		flatMap: flatMap,
		mergeMapTo: mergeMapTo,
		mergeScan: mergeScan,
		min: min,
		multicast: multicast,
		observeOn: observeOn,
		onErrorResumeNext: onErrorResumeNext$1,
		pairwise: pairwise,
		partition: partition$1,
		pluck: pluck,
		publish: publish,
		publishBehavior: publishBehavior,
		publishLast: publishLast,
		publishReplay: publishReplay,
		race: race$1,
		reduce: reduce,
		repeat: repeat,
		repeatWhen: repeatWhen,
		retry: retry,
		retryWhen: retryWhen,
		refCount: refCount,
		sample: sample,
		sampleTime: sampleTime,
		scan: scan,
		sequenceEqual: sequenceEqual,
		share: share,
		shareReplay: shareReplay,
		single: single,
		skip: skip,
		skipLast: skipLast,
		skipUntil: skipUntil,
		skipWhile: skipWhile,
		startWith: startWith,
		subscribeOn: subscribeOn,
		switchAll: switchAll,
		switchMap: switchMap,
		switchMapTo: switchMapTo,
		take: take,
		takeLast: takeLast,
		takeUntil: takeUntil,
		takeWhile: takeWhile,
		tap: tap,
		throttle: throttle,
		throttleTime: throttleTime,
		throwIfEmpty: throwIfEmpty,
		timeInterval: timeInterval,
		timeout: timeout,
		timeoutWith: timeoutWith,
		timestamp: timestamp,
		toArray: toArray,
		window: window$1,
		windowCount: windowCount,
		windowTime: windowTime,
		windowToggle: windowToggle,
		windowWhen: windowWhen,
		withLatestFrom: withLatestFrom,
		zip: zip$1,
		zipAll: zipAll
	});

	var _operators = /*@__PURE__*/getAugmentedNamespace(operators);

	/**
	 * Buffers the source Observable values until `closingNotifier` emits.
	 *
	 * <span class="informal">Collects values from the past as an array, and emits
	 * that array only when another Observable emits.</span>
	 *
	 * <img src="./img/buffer.png" width="100%">
	 *
	 * Buffers the incoming Observable values until the given `closingNotifier`
	 * Observable emits a value, at which point it emits the buffer on the output
	 * Observable and starts a new buffer internally, awaiting the next time
	 * `closingNotifier` emits.
	 *
	 * @example <caption>On every click, emit array of most recent interval events</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var interval = Rx.Observable.interval(1000);
	 * var buffered = interval.buffer(clicks);
	 * buffered.subscribe(x => console.log(x));
	 *
	 * @see {@link bufferCount}
	 * @see {@link bufferTime}
	 * @see {@link bufferToggle}
	 * @see {@link bufferWhen}
	 * @see {@link window}
	 *
	 * @param {Observable<any>} closingNotifier An Observable that signals the
	 * buffer to be emitted on the output Observable.
	 * @return {Observable<T[]>} An Observable of buffers, which are arrays of
	 * values.
	 * @method buffer
	 * @owner Observable
	 */
	function buffer$1(closingNotifier) {
	    return _operators.buffer(closingNotifier)(this);
	}
	var buffer_2 = buffer$1;


	var buffer_1 = /*#__PURE__*/Object.defineProperty({
		buffer: buffer_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.buffer = buffer_1.buffer;

	/**
	 * Buffers the source Observable values until the size hits the maximum
	 * `bufferSize` given.
	 *
	 * <span class="informal">Collects values from the past as an array, and emits
	 * that array only when its size reaches `bufferSize`.</span>
	 *
	 * <img src="./img/bufferCount.png" width="100%">
	 *
	 * Buffers a number of values from the source Observable by `bufferSize` then
	 * emits the buffer and clears it, and starts a new buffer each
	 * `startBufferEvery` values. If `startBufferEvery` is not provided or is
	 * `null`, then new buffers are started immediately at the start of the source
	 * and when each buffer closes and is emitted.
	 *
	 * @example <caption>Emit the last two click events as an array</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var buffered = clicks.bufferCount(2);
	 * buffered.subscribe(x => console.log(x));
	 *
	 * @example <caption>On every click, emit the last two click events as an array</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var buffered = clicks.bufferCount(2, 1);
	 * buffered.subscribe(x => console.log(x));
	 *
	 * @see {@link buffer}
	 * @see {@link bufferTime}
	 * @see {@link bufferToggle}
	 * @see {@link bufferWhen}
	 * @see {@link pairwise}
	 * @see {@link windowCount}
	 *
	 * @param {number} bufferSize The maximum size of the buffer emitted.
	 * @param {number} [startBufferEvery] Interval at which to start a new buffer.
	 * For example if `startBufferEvery` is `2`, then a new buffer will be started
	 * on every other value from the source. A new buffer is started at the
	 * beginning of the source by default.
	 * @return {Observable<T[]>} An Observable of arrays of buffered values.
	 * @method bufferCount
	 * @owner Observable
	 */
	function bufferCount$1(bufferSize, startBufferEvery) {
	    if (startBufferEvery === void 0) { startBufferEvery = null; }
	    return _operators.bufferCount(bufferSize, startBufferEvery)(this);
	}
	var bufferCount_2 = bufferCount$1;


	var bufferCount_1 = /*#__PURE__*/Object.defineProperty({
		bufferCount: bufferCount_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.bufferCount = bufferCount_1.bufferCount;

	var internal_compatibility_1 = /*@__PURE__*/getAugmentedNamespace(internalCompatibility);

	/* tslint:enable:max-line-length */
	/**
	 * Buffers the source Observable values for a specific time period.
	 *
	 * <span class="informal">Collects values from the past as an array, and emits
	 * those arrays periodically in time.</span>
	 *
	 * <img src="./img/bufferTime.png" width="100%">
	 *
	 * Buffers values from the source for a specific time duration `bufferTimeSpan`.
	 * Unless the optional argument `bufferCreationInterval` is given, it emits and
	 * resets the buffer every `bufferTimeSpan` milliseconds. If
	 * `bufferCreationInterval` is given, this operator opens the buffer every
	 * `bufferCreationInterval` milliseconds and closes (emits and resets) the
	 * buffer every `bufferTimeSpan` milliseconds. When the optional argument
	 * `maxBufferSize` is specified, the buffer will be closed either after
	 * `bufferTimeSpan` milliseconds or when it contains `maxBufferSize` elements.
	 *
	 * @example <caption>Every second, emit an array of the recent click events</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var buffered = clicks.bufferTime(1000);
	 * buffered.subscribe(x => console.log(x));
	 *
	 * @example <caption>Every 5 seconds, emit the click events from the next 2 seconds</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var buffered = clicks.bufferTime(2000, 5000);
	 * buffered.subscribe(x => console.log(x));
	 *
	 * @see {@link buffer}
	 * @see {@link bufferCount}
	 * @see {@link bufferToggle}
	 * @see {@link bufferWhen}
	 * @see {@link windowTime}
	 *
	 * @param {number} bufferTimeSpan The amount of time to fill each buffer array.
	 * @param {number} [bufferCreationInterval] The interval at which to start new
	 * buffers.
	 * @param {number} [maxBufferSize] The maximum buffer size.
	 * @param {Scheduler} [scheduler=asyncScheduler] The scheduler on which to schedule the
	 * intervals that determine buffer boundaries.
	 * @return {Observable<T[]>} An observable of arrays of buffered values.
	 * @method bufferTime
	 * @owner Observable
	 */
	function bufferTime$1(bufferTimeSpan) {
	    var length = arguments.length;
	    var scheduler = rxjs_1.asyncScheduler;
	    if (internal_compatibility_1.isScheduler(arguments[arguments.length - 1])) {
	        scheduler = arguments[arguments.length - 1];
	        length--;
	    }
	    var bufferCreationInterval = null;
	    if (length >= 2) {
	        bufferCreationInterval = arguments[1];
	    }
	    var maxBufferSize = Number.POSITIVE_INFINITY;
	    if (length >= 3) {
	        maxBufferSize = arguments[2];
	    }
	    return _operators.bufferTime(bufferTimeSpan, bufferCreationInterval, maxBufferSize, scheduler)(this);
	}
	var bufferTime_2 = bufferTime$1;


	var bufferTime_1 = /*#__PURE__*/Object.defineProperty({
		bufferTime: bufferTime_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.bufferTime = bufferTime_1.bufferTime;

	/**
	 * Buffers the source Observable values starting from an emission from
	 * `openings` and ending when the output of `closingSelector` emits.
	 *
	 * <span class="informal">Collects values from the past as an array. Starts
	 * collecting only when `opening` emits, and calls the `closingSelector`
	 * function to get an Observable that tells when to close the buffer.</span>
	 *
	 * <img src="./img/bufferToggle.png" width="100%">
	 *
	 * Buffers values from the source by opening the buffer via signals from an
	 * Observable provided to `openings`, and closing and sending the buffers when
	 * a Subscribable or Promise returned by the `closingSelector` function emits.
	 *
	 * @example <caption>Every other second, emit the click events from the next 500ms</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var openings = Rx.Observable.interval(1000);
	 * var buffered = clicks.bufferToggle(openings, i =>
	 *   i % 2 ? Rx.Observable.interval(500) : Rx.Observable.empty()
	 * );
	 * buffered.subscribe(x => console.log(x));
	 *
	 * @see {@link buffer}
	 * @see {@link bufferCount}
	 * @see {@link bufferTime}
	 * @see {@link bufferWhen}
	 * @see {@link windowToggle}
	 *
	 * @param {SubscribableOrPromise<O>} openings A Subscribable or Promise of notifications to start new
	 * buffers.
	 * @param {function(value: O): SubscribableOrPromise} closingSelector A function that takes
	 * the value emitted by the `openings` observable and returns a Subscribable or Promise,
	 * which, when it emits, signals that the associated buffer should be emitted
	 * and cleared.
	 * @return {Observable<T[]>} An observable of arrays of buffered values.
	 * @method bufferToggle
	 * @owner Observable
	 */
	function bufferToggle$1(openings, closingSelector) {
	    return _operators.bufferToggle(openings, closingSelector)(this);
	}
	var bufferToggle_2 = bufferToggle$1;


	var bufferToggle_1 = /*#__PURE__*/Object.defineProperty({
		bufferToggle: bufferToggle_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.bufferToggle = bufferToggle_1.bufferToggle;

	/**
	 * Buffers the source Observable values, using a factory function of closing
	 * Observables to determine when to close, emit, and reset the buffer.
	 *
	 * <span class="informal">Collects values from the past as an array. When it
	 * starts collecting values, it calls a function that returns an Observable that
	 * tells when to close the buffer and restart collecting.</span>
	 *
	 * <img src="./img/bufferWhen.png" width="100%">
	 *
	 * Opens a buffer immediately, then closes the buffer when the observable
	 * returned by calling `closingSelector` function emits a value. When it closes
	 * the buffer, it immediately opens a new buffer and repeats the process.
	 *
	 * @example <caption>Emit an array of the last clicks every [1-5] random seconds</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var buffered = clicks.bufferWhen(() =>
	 *   Rx.Observable.interval(1000 + Math.random() * 4000)
	 * );
	 * buffered.subscribe(x => console.log(x));
	 *
	 * @see {@link buffer}
	 * @see {@link bufferCount}
	 * @see {@link bufferTime}
	 * @see {@link bufferToggle}
	 * @see {@link windowWhen}
	 *
	 * @param {function(): Observable} closingSelector A function that takes no
	 * arguments and returns an Observable that signals buffer closure.
	 * @return {Observable<T[]>} An observable of arrays of buffered values.
	 * @method bufferWhen
	 * @owner Observable
	 */
	function bufferWhen$1(closingSelector) {
	    return _operators.bufferWhen(closingSelector)(this);
	}
	var bufferWhen_2 = bufferWhen$1;


	var bufferWhen_1 = /*#__PURE__*/Object.defineProperty({
		bufferWhen: bufferWhen_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.bufferWhen = bufferWhen_1.bufferWhen;

	/**
	 * Catches errors on the observable to be handled by returning a new observable or throwing an error.
	 *
	 * <img src="./img/catch.png" width="100%">
	 *
	 * @example <caption>Continues with a different Observable when there's an error</caption>
	 *
	 * Observable.of(1, 2, 3, 4, 5)
	 *   .map(n => {
	 * 	   if (n == 4) {
	 * 	     throw 'four!';
	 *     }
	 *	   return n;
	 *   })
	 *   .catch(err => Observable.of('I', 'II', 'III', 'IV', 'V'))
	 *   .subscribe(x => console.log(x));
	 *   // 1, 2, 3, I, II, III, IV, V
	 *
	 * @example <caption>Retries the caught source Observable again in case of error, similar to retry() operator</caption>
	 *
	 * Observable.of(1, 2, 3, 4, 5)
	 *   .map(n => {
	 * 	   if (n === 4) {
	 * 	     throw 'four!';
	 *     }
	 * 	   return n;
	 *   })
	 *   .catch((err, caught) => caught)
	 *   .take(30)
	 *   .subscribe(x => console.log(x));
	 *   // 1, 2, 3, 1, 2, 3, ...
	 *
	 * @example <caption>Throws a new error when the source Observable throws an error</caption>
	 *
	 * Observable.of(1, 2, 3, 4, 5)
	 *   .map(n => {
	 *     if (n == 4) {
	 *       throw 'four!';
	 *     }
	 *     return n;
	 *   })
	 *   .catch(err => {
	 *     throw 'error in source. Details: ' + err;
	 *   })
	 *   .subscribe(
	 *     x => console.log(x),
	 *     err => console.log(err)
	 *   );
	 *   // 1, 2, 3, error in source. Details: four!
	 *
	 * @param {function} selector a function that takes as arguments `err`, which is the error, and `caught`, which
	 *  is the source observable, in case you'd like to "retry" that observable by returning it again. Whatever observable
	 *  is returned by the `selector` will be used to continue the observable chain.
	 * @return {Observable} An observable that originates from either the source or the observable returned by the
	 *  catch `selector` function.
	 * @method catch
	 * @name catch
	 * @owner Observable
	 */
	function _catch(selector) {
	    return _operators.catchError(selector)(this);
	}
	var _catch_2 = _catch;


	var _catch_1 = /*#__PURE__*/Object.defineProperty({
		_catch: _catch_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.catch = _catch_1._catch;
	rxjs_1.Observable.prototype._catch = _catch_1._catch;

	/**
	 * Converts a higher-order Observable into a first-order Observable by waiting
	 * for the outer Observable to complete, then applying {@link combineLatest}.
	 *
	 * <span class="informal">Flattens an Observable-of-Observables by applying
	 * {@link combineLatest} when the Observable-of-Observables completes.</span>
	 *
	 * <img src="./img/combineAll.png" width="100%">
	 *
	 * Takes an Observable of Observables, and collects all Observables from it.
	 * Once the outer Observable completes, it subscribes to all collected
	 * Observables and combines their values using the {@link combineLatest}
	 * strategy, such that:
	 * - Every time an inner Observable emits, the output Observable emits.
	 * - When the returned observable emits, it emits all of the latest values by:
	 *   - If a `project` function is provided, it is called with each recent value
	 *     from each inner Observable in whatever order they arrived, and the result
	 *     of the `project` function is what is emitted by the output Observable.
	 *   - If there is no `project` function, an array of all of the most recent
	 *     values is emitted by the output Observable.
	 *
	 * @example <caption>Map two click events to a finite interval Observable, then apply combineAll</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var higherOrder = clicks.map(ev =>
	 *   Rx.Observable.interval(Math.random()*2000).take(3)
	 * ).take(2);
	 * var result = higherOrder.combineAll();
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link combineLatest}
	 * @see {@link mergeAll}
	 *
	 * @param {function} [project] An optional function to map the most recent
	 * values from each inner Observable into a new result. Takes each of the most
	 * recent values from each collected inner Observable as arguments, in order.
	 * @return {Observable} An Observable of projected results or arrays of recent
	 * values.
	 * @method combineAll
	 * @owner Observable
	 */
	function combineAll$1(project) {
	    return _operators.combineAll(project)(this);
	}
	var combineAll_2 = combineAll$1;


	var combineAll_1 = /*#__PURE__*/Object.defineProperty({
		combineAll: combineAll_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.combineAll = combineAll_1.combineAll;

	/* tslint:enable:max-line-length */
	/**
	 * Combines multiple Observables to create an Observable whose values are
	 * calculated from the latest values of each of its input Observables.
	 *
	 * <span class="informal">Whenever any input Observable emits a value, it
	 * computes a formula using the latest values from all the inputs, then emits
	 * the output of that formula.</span>
	 *
	 * <img src="./img/combineLatest.png" width="100%">
	 *
	 * `combineLatest` combines the values from this Observable with values from
	 * Observables passed as arguments. This is done by subscribing to each
	 * Observable, in order, and collecting an array of each of the most recent
	 * values any time any of the input Observables emits, then either taking that
	 * array and passing it as arguments to an optional `project` function and
	 * emitting the return value of that, or just emitting the array of recent
	 * values directly if there is no `project` function.
	 *
	 * @example <caption>Dynamically calculate the Body-Mass Index from an Observable of weight and one for height</caption>
	 * var weight = Rx.Observable.of(70, 72, 76, 79, 75);
	 * var height = Rx.Observable.of(1.76, 1.77, 1.78);
	 * var bmi = weight.combineLatest(height, (w, h) => w / (h * h));
	 * bmi.subscribe(x => console.log('BMI is ' + x));
	 *
	 * // With output to console:
	 * // BMI is 24.212293388429753
	 * // BMI is 23.93948099205209
	 * // BMI is 23.671253629592222
	 *
	 * @see {@link combineAll}
	 * @see {@link merge}
	 * @see {@link withLatestFrom}
	 *
	 * @param {ObservableInput} other An input Observable to combine with the source
	 * Observable. More than one input Observables may be given as argument.
	 * @param {function} [project] An optional function to project the values from
	 * the combined latest values into a new value on the output Observable.
	 * @return {Observable} An Observable of projected values from the most recent
	 * values from each input Observable, or an array of the most recent values from
	 * each input Observable.
	 * @method combineLatest
	 * @owner Observable
	 */
	function combineLatest$2() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    var project = null;
	    if (typeof observables[observables.length - 1] === 'function') {
	        project = observables.pop();
	    }
	    // if the first and only other argument besides the resultSelector is an array
	    // assume it's been called with `combineLatest([obs1, obs2, obs3], project)`
	    if (observables.length === 1 && internal_compatibility_1.isArray(observables[0])) {
	        observables = observables[0].slice();
	    }
	    return this.lift.call(rxjs_1.of.apply(void 0, [this].concat(observables)), new internal_compatibility_1.CombineLatestOperator(project));
	}
	var combineLatest_2 = combineLatest$2;


	var combineLatest_1 = /*#__PURE__*/Object.defineProperty({
		combineLatest: combineLatest_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.combineLatest = combineLatest_1.combineLatest;

	/* tslint:enable:max-line-length */
	/**
	 * Creates an output Observable which sequentially emits all values from every
	 * given input Observable after the current Observable.
	 *
	 * <span class="informal">Concatenates multiple Observables together by
	 * sequentially emitting their values, one Observable after the other.</span>
	 *
	 * <img src="./img/concat.png" width="100%">
	 *
	 * Joins this Observable with multiple other Observables by subscribing to them
	 * one at a time, starting with the source, and merging their results into the
	 * output Observable. Will wait for each Observable to complete before moving
	 * on to the next.
	 *
	 * @example <caption>Concatenate a timer counting from 0 to 3 with a synchronous sequence from 1 to 10</caption>
	 * var timer = Rx.Observable.interval(1000).take(4);
	 * var sequence = Rx.Observable.range(1, 10);
	 * var result = timer.concat(sequence);
	 * result.subscribe(x => console.log(x));
	 *
	 * // results in:
	 * // 1000ms-> 0 -1000ms-> 1 -1000ms-> 2 -1000ms-> 3 -immediate-> 1 ... 10
	 *
	 * @example <caption>Concatenate 3 Observables</caption>
	 * var timer1 = Rx.Observable.interval(1000).take(10);
	 * var timer2 = Rx.Observable.interval(2000).take(6);
	 * var timer3 = Rx.Observable.interval(500).take(10);
	 * var result = timer1.concat(timer2, timer3);
	 * result.subscribe(x => console.log(x));
	 *
	 * // results in the following:
	 * // (Prints to console sequentially)
	 * // -1000ms-> 0 -1000ms-> 1 -1000ms-> ... 9
	 * // -2000ms-> 0 -2000ms-> 1 -2000ms-> ... 5
	 * // -500ms-> 0 -500ms-> 1 -500ms-> ... 9
	 *
	 * @see {@link concatAll}
	 * @see {@link concatMap}
	 * @see {@link concatMapTo}
	 *
	 * @param {ObservableInput} other An input Observable to concatenate after the source
	 * Observable. More than one input Observables may be given as argument.
	 * @param {Scheduler} [scheduler=null] An optional IScheduler to schedule each
	 * Observable subscription on.
	 * @return {Observable} All values of each passed Observable merged into a
	 * single Observable, in order, in serial fashion.
	 * @method concat
	 * @owner Observable
	 */
	function concat$2() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    return this.lift.call(rxjs_1.concat.apply(void 0, [this].concat(observables)));
	}
	var concat_2 = concat$2;


	var concat_1 = /*#__PURE__*/Object.defineProperty({
		concat: concat_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.concat = concat_1.concat;

	/**
	 * Converts a higher-order Observable into a first-order Observable by
	 * concatenating the inner Observables in order.
	 *
	 * <span class="informal">Flattens an Observable-of-Observables by putting one
	 * inner Observable after the other.</span>
	 *
	 * <img src="./img/concatAll.png" width="100%">
	 *
	 * Joins every Observable emitted by the source (a higher-order Observable), in
	 * a serial fashion. It subscribes to each inner Observable only after the
	 * previous inner Observable has completed, and merges all of their values into
	 * the returned observable.
	 *
	 * __Warning:__ If the source Observable emits Observables quickly and
	 * endlessly, and the inner Observables it emits generally complete slower than
	 * the source emits, you can run into memory issues as the incoming Observables
	 * collect in an unbounded buffer.
	 *
	 * Note: `concatAll` is equivalent to `mergeAll` with concurrency parameter set
	 * to `1`.
	 *
	 * @example <caption>For each click event, tick every second from 0 to 3, with no concurrency</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var higherOrder = clicks.map(ev => Rx.Observable.interval(1000).take(4));
	 * var firstOrder = higherOrder.concatAll();
	 * firstOrder.subscribe(x => console.log(x));
	 *
	 * // Results in the following:
	 * // (results are not concurrent)
	 * // For every click on the "document" it will emit values 0 to 3 spaced
	 * // on a 1000ms interval
	 * // one click = 1000ms-> 0 -1000ms-> 1 -1000ms-> 2 -1000ms-> 3
	 *
	 * @see {@link combineAll}
	 * @see {@link concat}
	 * @see {@link concatMap}
	 * @see {@link concatMapTo}
	 * @see {@link exhaust}
	 * @see {@link mergeAll}
	 * @see {@link switch}
	 * @see {@link zipAll}
	 *
	 * @return {Observable} An Observable emitting values from all the inner
	 * Observables concatenated.
	 * @method concatAll
	 * @owner Observable
	 */
	function concatAll$1() {
	    return _operators.concatAll()(this);
	}
	var concatAll_2 = concatAll$1;


	var concatAll_1 = /*#__PURE__*/Object.defineProperty({
		concatAll: concatAll_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.concatAll = concatAll_1.concatAll;

	/**
	 * Projects each source value to an Observable which is merged in the output
	 * Observable, in a serialized fashion waiting for each one to complete before
	 * merging the next.
	 *
	 * <span class="informal">Maps each value to an Observable, then flattens all of
	 * these inner Observables using {@link concatAll}.</span>
	 *
	 * <img src="./img/concatMap.png" width="100%">
	 *
	 * Returns an Observable that emits items based on applying a function that you
	 * supply to each item emitted by the source Observable, where that function
	 * returns an (so-called "inner") Observable. Each new inner Observable is
	 * concatenated with the previous inner Observable.
	 *
	 * __Warning:__ if source values arrive endlessly and faster than their
	 * corresponding inner Observables can complete, it will result in memory issues
	 * as inner Observables amass in an unbounded buffer waiting for their turn to
	 * be subscribed to.
	 *
	 * Note: `concatMap` is equivalent to `mergeMap` with concurrency parameter set
	 * to `1`.
	 *
	 * @example <caption>For each click event, tick every second from 0 to 3, with no concurrency</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.concatMap(ev => Rx.Observable.interval(1000).take(4));
	 * result.subscribe(x => console.log(x));
	 *
	 * // Results in the following:
	 * // (results are not concurrent)
	 * // For every click on the "document" it will emit values 0 to 3 spaced
	 * // on a 1000ms interval
	 * // one click = 1000ms-> 0 -1000ms-> 1 -1000ms-> 2 -1000ms-> 3
	 *
	 * @see {@link concat}
	 * @see {@link concatAll}
	 * @see {@link concatMapTo}
	 * @see {@link exhaustMap}
	 * @see {@link mergeMap}
	 * @see {@link switchMap}
	 *
	 * @param {function(value: T, ?index: number): ObservableInput} project A function
	 * that, when applied to an item emitted by the source Observable, returns an
	 * Observable.
	 * @return {Observable} An Observable that emits the result of applying the
	 * projection function (and the optional `resultSelector`) to each item emitted
	 * by the source Observable and taking values from each projected inner
	 * Observable sequentially.
	 * @method concatMap
	 * @owner Observable
	 */
	function concatMap$1(project) {
	    return _operators.concatMap(project)(this);
	}
	var concatMap_2 = concatMap$1;


	var concatMap_1 = /*#__PURE__*/Object.defineProperty({
		concatMap: concatMap_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.concatMap = concatMap_1.concatMap;

	/**
	 * Projects each source value to the same Observable which is merged multiple
	 * times in a serialized fashion on the output Observable.
	 *
	 * <span class="informal">It's like {@link concatMap}, but maps each value
	 * always to the same inner Observable.</span>
	 *
	 * <img src="./img/concatMapTo.png" width="100%">
	 *
	 * Maps each source value to the given Observable `innerObservable` regardless
	 * of the source value, and then flattens those resulting Observables into one
	 * single Observable, which is the output Observable. Each new `innerObservable`
	 * instance emitted on the output Observable is concatenated with the previous
	 * `innerObservable` instance.
	 *
	 * __Warning:__ if source values arrive endlessly and faster than their
	 * corresponding inner Observables can complete, it will result in memory issues
	 * as inner Observables amass in an unbounded buffer waiting for their turn to
	 * be subscribed to.
	 *
	 * Note: `concatMapTo` is equivalent to `mergeMapTo` with concurrency parameter
	 * set to `1`.
	 *
	 * @example <caption>For each click event, tick every second from 0 to 3, with no concurrency</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.concatMapTo(Rx.Observable.interval(1000).take(4));
	 * result.subscribe(x => console.log(x));
	 *
	 * // Results in the following:
	 * // (results are not concurrent)
	 * // For every click on the "document" it will emit values 0 to 3 spaced
	 * // on a 1000ms interval
	 * // one click = 1000ms-> 0 -1000ms-> 1 -1000ms-> 2 -1000ms-> 3
	 *
	 * @see {@link concat}
	 * @see {@link concatAll}
	 * @see {@link concatMap}
	 * @see {@link mergeMapTo}
	 * @see {@link switchMapTo}
	 *
	 * @param {ObservableInput} innerObservable An Observable to replace each value from
	 * the source Observable.
	 * @return {Observable} An observable of values merged together by joining the
	 * passed observable with itself, one after the other, for each value emitted
	 * from the source.
	 * @method concatMapTo
	 * @owner Observable
	 */
	function concatMapTo$1(innerObservable) {
	    return _operators.concatMapTo(innerObservable)(this);
	}
	var concatMapTo_2 = concatMapTo$1;


	var concatMapTo_1 = /*#__PURE__*/Object.defineProperty({
		concatMapTo: concatMapTo_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.concatMapTo = concatMapTo_1.concatMapTo;

	/**
	 * Counts the number of emissions on the source and emits that number when the
	 * source completes.
	 *
	 * <span class="informal">Tells how many values were emitted, when the source
	 * completes.</span>
	 *
	 * <img src="./img/count.png" width="100%">
	 *
	 * `count` transforms an Observable that emits values into an Observable that
	 * emits a single value that represents the number of values emitted by the
	 * source Observable. If the source Observable terminates with an error, `count`
	 * will pass this error notification along without emitting a value first. If
	 * the source Observable does not terminate at all, `count` will neither emit
	 * a value nor terminate. This operator takes an optional `predicate` function
	 * as argument, in which case the output emission will represent the number of
	 * source values that matched `true` with the `predicate`.
	 *
	 * @example <caption>Counts how many seconds have passed before the first click happened</caption>
	 * var seconds = Rx.Observable.interval(1000);
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var secondsBeforeClick = seconds.takeUntil(clicks);
	 * var result = secondsBeforeClick.count();
	 * result.subscribe(x => console.log(x));
	 *
	 * @example <caption>Counts how many odd numbers are there between 1 and 7</caption>
	 * var numbers = Rx.Observable.range(1, 7);
	 * var result = numbers.count(i => i % 2 === 1);
	 * result.subscribe(x => console.log(x));
	 *
	 * // Results in:
	 * // 4
	 *
	 * @see {@link max}
	 * @see {@link min}
	 * @see {@link reduce}
	 *
	 * @param {function(value: T, i: number, source: Observable<T>): boolean} [predicate] A
	 * boolean function to select what values are to be counted. It is provided with
	 * arguments of:
	 * - `value`: the value from the source Observable.
	 * - `index`: the (zero-based) "index" of the value from the source Observable.
	 * - `source`: the source Observable instance itself.
	 * @return {Observable} An Observable of one number that represents the count as
	 * described above.
	 * @method count
	 * @owner Observable
	 */
	function count$1(predicate) {
	    return _operators.count(predicate)(this);
	}
	var count_2 = count$1;


	var count_1 = /*#__PURE__*/Object.defineProperty({
		count: count_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.count = count_1.count;

	/**
	 * Converts an Observable of {@link Notification} objects into the emissions
	 * that they represent.
	 *
	 * <span class="informal">Unwraps {@link Notification} objects as actual `next`,
	 * `error` and `complete` emissions. The opposite of {@link materialize}.</span>
	 *
	 * <img src="./img/dematerialize.png" width="100%">
	 *
	 * `dematerialize` is assumed to operate an Observable that only emits
	 * {@link Notification} objects as `next` emissions, and does not emit any
	 * `error`. Such Observable is the output of a `materialize` operation. Those
	 * notifications are then unwrapped using the metadata they contain, and emitted
	 * as `next`, `error`, and `complete` on the output Observable.
	 *
	 * Use this operator in conjunction with {@link materialize}.
	 *
	 * @example <caption>Convert an Observable of Notifications to an actual Observable</caption>
	 * var notifA = new Rx.Notification('N', 'A');
	 * var notifB = new Rx.Notification('N', 'B');
	 * var notifE = new Rx.Notification('E', void 0,
	 *   new TypeError('x.toUpperCase is not a function')
	 * );
	 * var materialized = Rx.Observable.of(notifA, notifB, notifE);
	 * var upperCase = materialized.dematerialize();
	 * upperCase.subscribe(x => console.log(x), e => console.error(e));
	 *
	 * // Results in:
	 * // A
	 * // B
	 * // TypeError: x.toUpperCase is not a function
	 *
	 * @see {@link Notification}
	 * @see {@link materialize}
	 *
	 * @return {Observable} An Observable that emits items and notifications
	 * embedded in Notification objects emitted by the source Observable.
	 * @method dematerialize
	 * @owner Observable
	 */
	function dematerialize$1() {
	    return _operators.dematerialize()(this);
	}
	var dematerialize_2 = dematerialize$1;


	var dematerialize_1 = /*#__PURE__*/Object.defineProperty({
		dematerialize: dematerialize_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.dematerialize = dematerialize_1.dematerialize;

	/**
	 * Emits a value from the source Observable only after a particular time span
	 * determined by another Observable has passed without another source emission.
	 *
	 * <span class="informal">It's like {@link debounceTime}, but the time span of
	 * emission silence is determined by a second Observable.</span>
	 *
	 * <img src="./img/debounce.png" width="100%">
	 *
	 * `debounce` delays values emitted by the source Observable, but drops previous
	 * pending delayed emissions if a new value arrives on the source Observable.
	 * This operator keeps track of the most recent value from the source
	 * Observable, and spawns a duration Observable by calling the
	 * `durationSelector` function. The value is emitted only when the duration
	 * Observable emits a value or completes, and if no other value was emitted on
	 * the source Observable since the duration Observable was spawned. If a new
	 * value appears before the duration Observable emits, the previous value will
	 * be dropped and will not be emitted on the output Observable.
	 *
	 * Like {@link debounceTime}, this is a rate-limiting operator, and also a
	 * delay-like operator since output emissions do not necessarily occur at the
	 * same time as they did on the source Observable.
	 *
	 * @example <caption>Emit the most recent click after a burst of clicks</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.debounce(() => Rx.Observable.interval(1000));
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link audit}
	 * @see {@link debounceTime}
	 * @see {@link delayWhen}
	 * @see {@link throttle}
	 *
	 * @param {function(value: T): SubscribableOrPromise} durationSelector A function
	 * that receives a value from the source Observable, for computing the timeout
	 * duration for each source value, returned as an Observable or a Promise.
	 * @return {Observable} An Observable that delays the emissions of the source
	 * Observable by the specified duration Observable returned by
	 * `durationSelector`, and may drop some values if they occur too frequently.
	 * @method debounce
	 * @owner Observable
	 */
	function debounce$1(durationSelector) {
	    return _operators.debounce(durationSelector)(this);
	}
	var debounce_2 = debounce$1;


	var debounce_1 = /*#__PURE__*/Object.defineProperty({
		debounce: debounce_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.debounce = debounce_1.debounce;

	/**
	 * Emits a value from the source Observable only after a particular time span
	 * has passed without another source emission.
	 *
	 * <span class="informal">It's like {@link delay}, but passes only the most
	 * recent value from each burst of emissions.</span>
	 *
	 * <img src="./img/debounceTime.png" width="100%">
	 *
	 * `debounceTime` delays values emitted by the source Observable, but drops
	 * previous pending delayed emissions if a new value arrives on the source
	 * Observable. This operator keeps track of the most recent value from the
	 * source Observable, and emits that only when `dueTime` enough time has passed
	 * without any other value appearing on the source Observable. If a new value
	 * appears before `dueTime` silence occurs, the previous value will be dropped
	 * and will not be emitted on the output Observable.
	 *
	 * This is a rate-limiting operator, because it is impossible for more than one
	 * value to be emitted in any time window of duration `dueTime`, but it is also
	 * a delay-like operator since output emissions do not occur at the same time as
	 * they did on the source Observable. Optionally takes a {@link IScheduler} for
	 * managing timers.
	 *
	 * @example <caption>Emit the most recent click after a burst of clicks</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.debounceTime(1000);
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link auditTime}
	 * @see {@link debounce}
	 * @see {@link delay}
	 * @see {@link sampleTime}
	 * @see {@link throttleTime}
	 *
	 * @param {number} dueTime The timeout duration in milliseconds (or the time
	 * unit determined internally by the optional `scheduler`) for the window of
	 * time required to wait for emission silence before emitting the most recent
	 * source value.
	 * @param {Scheduler} [scheduler=asyncScheduler] The {@link SchedulerLike} to use for
	 * managing the timers that handle the timeout for each value.
	 * @return {Observable} An Observable that delays the emissions of the source
	 * Observable by the specified `dueTime`, and may drop some values if they occur
	 * too frequently.
	 * @method debounceTime
	 * @owner Observable
	 */
	function debounceTime$1(dueTime, scheduler) {
	    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
	    return _operators.debounceTime(dueTime, scheduler)(this);
	}
	var debounceTime_2 = debounceTime$1;


	var debounceTime_1 = /*#__PURE__*/Object.defineProperty({
		debounceTime: debounceTime_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.debounceTime = debounceTime_1.debounceTime;

	/* tslint:enable:max-line-length */
	/**
	 * Emits a given value if the source Observable completes without emitting any
	 * `next` value, otherwise mirrors the source Observable.
	 *
	 * <span class="informal">If the source Observable turns out to be empty, then
	 * this operator will emit a default value.</span>
	 *
	 * <img src="./img/defaultIfEmpty.png" width="100%">
	 *
	 * `defaultIfEmpty` emits the values emitted by the source Observable or a
	 * specified default value if the source Observable is empty (completes without
	 * having emitted any `next` value).
	 *
	 * @example <caption>If no clicks happen in 5 seconds, then emit "no clicks"</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var clicksBeforeFive = clicks.takeUntil(Rx.Observable.interval(5000));
	 * var result = clicksBeforeFive.defaultIfEmpty('no clicks');
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link empty}
	 * @see {@link last}
	 *
	 * @param {any} [defaultValue=null] The default value used if the source
	 * Observable is empty.
	 * @return {Observable} An Observable that emits either the specified
	 * `defaultValue` if the source Observable emits no items, or the values emitted
	 * by the source Observable.
	 * @method defaultIfEmpty
	 * @owner Observable
	 */
	function defaultIfEmpty$1(defaultValue) {
	    if (defaultValue === void 0) { defaultValue = null; }
	    return _operators.defaultIfEmpty(defaultValue)(this);
	}
	var defaultIfEmpty_2 = defaultIfEmpty$1;


	var defaultIfEmpty_1 = /*#__PURE__*/Object.defineProperty({
		defaultIfEmpty: defaultIfEmpty_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.defaultIfEmpty = defaultIfEmpty_1.defaultIfEmpty;

	/**
	 * Delays the emission of items from the source Observable by a given timeout or
	 * until a given Date.
	 *
	 * <span class="informal">Time shifts each item by some specified amount of
	 * milliseconds.</span>
	 *
	 * <img src="./img/delay.png" width="100%">
	 *
	 * If the delay argument is a Number, this operator time shifts the source
	 * Observable by that amount of time expressed in milliseconds. The relative
	 * time intervals between the values are preserved.
	 *
	 * If the delay argument is a Date, this operator time shifts the start of the
	 * Observable execution until the given date occurs.
	 *
	 * @example <caption>Delay each click by one second</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var delayedClicks = clicks.delay(1000); // each click emitted after 1 second
	 * delayedClicks.subscribe(x => console.log(x));
	 *
	 * @example <caption>Delay all clicks until a future date happens</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var date = new Date('March 15, 2050 12:00:00'); // in the future
	 * var delayedClicks = clicks.delay(date); // click emitted only after that date
	 * delayedClicks.subscribe(x => console.log(x));
	 *
	 * @see {@link debounceTime}
	 * @see {@link delayWhen}
	 *
	 * @param {number|Date} delay The delay duration in milliseconds (a `number`) or
	 * a `Date` until which the emission of the source items is delayed.
	 * @param {Scheduler} [scheduler=asyncScheduler] The SchedulerLike to use for
	 * managing the timers that handle the time-shift for each item.
	 * @return {Observable} An Observable that delays the emissions of the source
	 * Observable by the specified timeout or Date.
	 * @method delay
	 * @owner Observable
	 */
	function delay$1(delay, scheduler) {
	    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
	    return _operators.delay(delay, scheduler)(this);
	}
	var delay_2 = delay$1;


	var delay_1 = /*#__PURE__*/Object.defineProperty({
		delay: delay_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.delay = delay_1.delay;

	/**
	 * Delays the emission of items from the source Observable by a given time span
	 * determined by the emissions of another Observable.
	 *
	 * <span class="informal">It's like {@link delay}, but the time span of the
	 * delay duration is determined by a second Observable.</span>
	 *
	 * <img src="./img/delayWhen.png" width="100%">
	 *
	 * `delayWhen` time shifts each emitted value from the source Observable by a
	 * time span determined by another Observable. When the source emits a value,
	 * the `delayDurationSelector` function is called with the source value as
	 * argument, and should return an Observable, called the "duration" Observable.
	 * The source value is emitted on the output Observable only when the duration
	 * Observable emits a value or completes.
	 *
	 * Optionally, `delayWhen` takes a second argument, `subscriptionDelay`, which
	 * is an Observable. When `subscriptionDelay` emits its first value or
	 * completes, the source Observable is subscribed to and starts behaving like
	 * described in the previous paragraph. If `subscriptionDelay` is not provided,
	 * `delayWhen` will subscribe to the source Observable as soon as the output
	 * Observable is subscribed.
	 *
	 * @example <caption>Delay each click by a random amount of time, between 0 and 5 seconds</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var delayedClicks = clicks.delayWhen(event =>
	 *   Rx.Observable.interval(Math.random() * 5000)
	 * );
	 * delayedClicks.subscribe(x => console.log(x));
	 *
	 * @see {@link debounce}
	 * @see {@link delay}
	 *
	 * @param {function(value: T): Observable} delayDurationSelector A function that
	 * returns an Observable for each value emitted by the source Observable, which
	 * is then used to delay the emission of that item on the output Observable
	 * until the Observable returned from this function emits a value.
	 * @param {Observable} subscriptionDelay An Observable that triggers the
	 * subscription to the source Observable once it emits any value.
	 * @return {Observable} An Observable that delays the emissions of the source
	 * Observable by an amount of time specified by the Observable returned by
	 * `delayDurationSelector`.
	 * @method delayWhen
	 * @owner Observable
	 */
	function delayWhen$1(delayDurationSelector, subscriptionDelay) {
	    return _operators.delayWhen(delayDurationSelector, subscriptionDelay)(this);
	}
	var delayWhen_2 = delayWhen$1;


	var delayWhen_1 = /*#__PURE__*/Object.defineProperty({
		delayWhen: delayWhen_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.delayWhen = delayWhen_1.delayWhen;

	/**
	 * Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from previous items.
	 *
	 * If a keySelector function is provided, then it will project each value from the source observable into a new value that it will
	 * check for equality with previously projected values. If a keySelector function is not provided, it will use each value from the
	 * source observable directly with an equality check against previous values.
	 *
	 * In JavaScript runtimes that support `Set`, this operator will use a `Set` to improve performance of the distinct value checking.
	 *
	 * In other runtimes, this operator will use a minimal implementation of `Set` that relies on an `Array` and `indexOf` under the
	 * hood, so performance will degrade as more values are checked for distinction. Even in newer browsers, a long-running `distinct`
	 * use might result in memory leaks. To help alleviate this in some scenarios, an optional `flushes` parameter is also provided so
	 * that the internal `Set` can be "flushed", basically clearing it of values.
	 *
	 * @example <caption>A simple example with numbers</caption>
	 * Observable.of(1, 1, 2, 2, 2, 1, 2, 3, 4, 3, 2, 1)
	 *   .distinct()
	 *   .subscribe(x => console.log(x)); // 1, 2, 3, 4
	 *
	 * @example <caption>An example using a keySelector function</caption>
	 * interface Person {
	 *    age: number,
	 *    name: string
	 * }
	 *
	 * Observable.of<Person>(
	 *     { age: 4, name: 'Foo'},
	 *     { age: 7, name: 'Bar'},
	 *     { age: 5, name: 'Foo'})
	 *     .distinct((p: Person) => p.name)
	 *     .subscribe(x => console.log(x));
	 *
	 * // displays:
	 * // { age: 4, name: 'Foo' }
	 * // { age: 7, name: 'Bar' }
	 *
	 * @see {@link distinctUntilChanged}
	 * @see {@link distinctUntilKeyChanged}
	 *
	 * @param {function} [keySelector] Optional function to select which value you want to check as distinct.
	 * @param {Observable} [flushes] Optional Observable for flushing the internal HashSet of the operator.
	 * @return {Observable} An Observable that emits items from the source Observable with distinct values.
	 * @method distinct
	 * @owner Observable
	 */
	function distinct$1(keySelector, flushes) {
	    return _operators.distinct(keySelector, flushes)(this);
	}
	var distinct_2 = distinct$1;


	var distinct_1 = /*#__PURE__*/Object.defineProperty({
		distinct: distinct_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.distinct = distinct_1.distinct;

	/* tslint:enable:max-line-length */
	/**
	 * Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from the previous item.
	 *
	 * If a comparator function is provided, then it will be called for each item to test for whether or not that value should be emitted.
	 *
	 * If a comparator function is not provided, an equality check is used by default.
	 *
	 * @example <caption>A simple example with numbers</caption>
	 * Observable.of(1, 1, 2, 2, 2, 1, 1, 2, 3, 3, 4)
	 *   .distinctUntilChanged()
	 *   .subscribe(x => console.log(x)); // 1, 2, 1, 2, 3, 4
	 *
	 * @example <caption>An example using a compare function</caption>
	 * interface Person {
	 *    age: number,
	 *    name: string
	 * }
	 *
	 * Observable.of<Person>(
	 *     { age: 4, name: 'Foo'},
	 *     { age: 7, name: 'Bar'},
	 *     { age: 5, name: 'Foo'},
	 *     { age: 6, name: 'Foo'})
	 *     .distinctUntilChanged((p: Person, q: Person) => p.name === q.name)
	 *     .subscribe(x => console.log(x));
	 *
	 * // displays:
	 * // { age: 4, name: 'Foo' }
	 * // { age: 7, name: 'Bar' }
	 * // { age: 5, name: 'Foo' }
	 *
	 * @see {@link distinct}
	 * @see {@link distinctUntilKeyChanged}
	 *
	 * @param {function} [compare] Optional comparison function called to test if an item is distinct from the previous item in the source.
	 * @return {Observable} An Observable that emits items from the source Observable with distinct values.
	 * @method distinctUntilChanged
	 * @owner Observable
	 */
	function distinctUntilChanged$1(compare, keySelector) {
	    return _operators.distinctUntilChanged(compare, keySelector)(this);
	}
	var distinctUntilChanged_2 = distinctUntilChanged$1;


	var distinctUntilChanged_1 = /*#__PURE__*/Object.defineProperty({
		distinctUntilChanged: distinctUntilChanged_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.distinctUntilChanged = distinctUntilChanged_1.distinctUntilChanged;

	/* tslint:enable:max-line-length */
	/**
	 * Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from the previous item,
	 * using a property accessed by using the key provided to check if the two items are distinct.
	 *
	 * If a comparator function is provided, then it will be called for each item to test for whether or not that value should be emitted.
	 *
	 * If a comparator function is not provided, an equality check is used by default.
	 *
	 * @example <caption>An example comparing the name of persons</caption>
	 *
	 *  interface Person {
	 *     age: number,
	 *     name: string
	 *  }
	 *
	 * Observable.of<Person>(
	 *     { age: 4, name: 'Foo'},
	 *     { age: 7, name: 'Bar'},
	 *     { age: 5, name: 'Foo'},
	 *     { age: 6, name: 'Foo'})
	 *     .distinctUntilKeyChanged('name')
	 *     .subscribe(x => console.log(x));
	 *
	 * // displays:
	 * // { age: 4, name: 'Foo' }
	 * // { age: 7, name: 'Bar' }
	 * // { age: 5, name: 'Foo' }
	 *
	 * @example <caption>An example comparing the first letters of the name</caption>
	 *
	 * interface Person {
	 *     age: number,
	 *     name: string
	 *  }
	 *
	 * Observable.of<Person>(
	 *     { age: 4, name: 'Foo1'},
	 *     { age: 7, name: 'Bar'},
	 *     { age: 5, name: 'Foo2'},
	 *     { age: 6, name: 'Foo3'})
	 *     .distinctUntilKeyChanged('name', (x: string, y: string) => x.substring(0, 3) === y.substring(0, 3))
	 *     .subscribe(x => console.log(x));
	 *
	 * // displays:
	 * // { age: 4, name: 'Foo1' }
	 * // { age: 7, name: 'Bar' }
	 * // { age: 5, name: 'Foo2' }
	 *
	 * @see {@link distinct}
	 * @see {@link distinctUntilChanged}
	 *
	 * @param {string} key String key for object property lookup on each item.
	 * @param {function} [compare] Optional comparison function called to test if an item is distinct from the previous item in the source.
	 * @return {Observable} An Observable that emits items from the source Observable with distinct values based on the key specified.
	 * @method distinctUntilKeyChanged
	 * @owner Observable
	 */
	// tslint:disable-next-line:max-line-length
	function distinctUntilKeyChanged$1(key, compare) {
	    return _operators.distinctUntilKeyChanged(key, compare)(this);
	}
	var distinctUntilKeyChanged_2 = distinctUntilKeyChanged$1;


	var distinctUntilKeyChanged_1 = /*#__PURE__*/Object.defineProperty({
		distinctUntilKeyChanged: distinctUntilKeyChanged_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.distinctUntilKeyChanged = distinctUntilKeyChanged_1.distinctUntilKeyChanged;

	/* tslint:enable:max-line-length */
	/**
	 * Perform a side effect for every emission on the source Observable, but return
	 * an Observable that is identical to the source.
	 *
	 * <span class="informal">Intercepts each emission on the source and runs a
	 * function, but returns an output which is identical to the source as long as errors don't occur.</span>
	 *
	 * <img src="./img/do.png" width="100%">
	 *
	 * Returns a mirrored Observable of the source Observable, but modified so that
	 * the provided Observer is called to perform a side effect for every value,
	 * error, and completion emitted by the source. Any errors that are thrown in
	 * the aforementioned Observer or handlers are safely sent down the error path
	 * of the output Observable.
	 *
	 * This operator is useful for debugging your Observables for the correct values
	 * or performing other side effects.
	 *
	 * Note: this is different to a `subscribe` on the Observable. If the Observable
	 * returned by `do` is not subscribed, the side effects specified by the
	 * Observer will never happen. `do` therefore simply spies on existing
	 * execution, it does not trigger an execution to happen like `subscribe` does.
	 *
	 * @example <caption>Map every click to the clientX position of that click, while also logging the click event</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var positions = clicks
	 *   .do(ev => console.log(ev))
	 *   .map(ev => ev.clientX);
	 * positions.subscribe(x => console.log(x));
	 *
	 * @see {@link map}
	 * @see {@link subscribe}
	 *
	 * @param {Observer|function} [nextOrObserver] A normal Observer object or a
	 * callback for `next`.
	 * @param {function} [error] Callback for errors in the source.
	 * @param {function} [complete] Callback for the completion of the source.
	 * @return {Observable} An Observable identical to the source, but runs the
	 * specified Observer or callback(s) for each item.
	 * @method do
	 * @name do
	 * @owner Observable
	 */
	function _do(nextOrObserver, error, complete) {
	    return _operators.tap(nextOrObserver, error, complete)(this);
	}
	var _do_2 = _do;


	var _do_1 = /*#__PURE__*/Object.defineProperty({
		_do: _do_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.do = _do_1._do;
	rxjs_1.Observable.prototype._do = _do_1._do;

	/**
	 * Converts a higher-order Observable into a first-order Observable by dropping
	 * inner Observables while the previous inner Observable has not yet completed.
	 *
	 * <span class="informal">Flattens an Observable-of-Observables by dropping the
	 * next inner Observables while the current inner is still executing.</span>
	 *
	 * <img src="./img/exhaust.png" width="100%">
	 *
	 * `exhaust` subscribes to an Observable that emits Observables, also known as a
	 * higher-order Observable. Each time it observes one of these emitted inner
	 * Observables, the output Observable begins emitting the items emitted by that
	 * inner Observable. So far, it behaves like {@link mergeAll}. However,
	 * `exhaust` ignores every new inner Observable if the previous Observable has
	 * not yet completed. Once that one completes, it will accept and flatten the
	 * next inner Observable and repeat this process.
	 *
	 * @example <caption>Run a finite timer for each click, only if there is no currently active timer</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var higherOrder = clicks.map((ev) => Rx.Observable.interval(1000).take(5));
	 * var result = higherOrder.exhaust();
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link combineAll}
	 * @see {@link concatAll}
	 * @see {@link switch}
	 * @see {@link mergeAll}
	 * @see {@link exhaustMap}
	 * @see {@link zipAll}
	 *
	 * @return {Observable} An Observable that takes a source of Observables and propagates the first observable
	 * exclusively until it completes before subscribing to the next.
	 */
	function exhaust$1() {
	    return _operators.exhaust()(this);
	}
	var exhaust_2 = exhaust$1;


	var exhaust_1 = /*#__PURE__*/Object.defineProperty({
		exhaust: exhaust_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.exhaust = exhaust_1.exhaust;

	/**
	 * Projects each source value to an Observable which is merged in the output
	 * Observable only if the previous projected Observable has completed.
	 *
	 * <span class="informal">Maps each value to an Observable, then flattens all of
	 * these inner Observables using {@link exhaust}.</span>
	 *
	 * <img src="./img/exhaustMap.png" width="100%">
	 *
	 * Returns an Observable that emits items based on applying a function that you
	 * supply to each item emitted by the source Observable, where that function
	 * returns an (so-called "inner") Observable. When it projects a source value to
	 * an Observable, the output Observable begins emitting the items emitted by
	 * that projected Observable. However, `exhaustMap` ignores every new projected
	 * Observable if the previous projected Observable has not yet completed. Once
	 * that one completes, it will accept and flatten the next projected Observable
	 * and repeat this process.
	 *
	 * @example <caption>Run a finite timer for each click, only if there is no currently active timer</caption>
	 * var clicks = fromEvent(document, 'click');
	 * var result = clicks.pipe(exhaustMap((ev) => Rx.Observable.interval(1000).take(5)));
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link concatMap}
	 * @see {@link exhaust}
	 * @see {@link mergeMap}
	 * @see {@link switchMap}
	 *
	 * @param {function(value: T, ?index: number): ObservableInput} project A function
	 * that, when applied to an item emitted by the source Observable, returns an
	 * Observable.
	 * @return {Observable} An Observable containing projected Observables
	 * of each item of the source, ignoring projected Observables that start before
	 * their preceding Observable has completed.
	 */
	function exhaustMap$1(project) {
	    return _operators.exhaustMap(project)(this);
	}
	var exhaustMap_2 = exhaustMap$1;


	var exhaustMap_1 = /*#__PURE__*/Object.defineProperty({
		exhaustMap: exhaustMap_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.exhaustMap = exhaustMap_1.exhaustMap;

	/* tslint:enable:max-line-length */
	/**
	 * Recursively projects each source value to an Observable which is merged in
	 * the output Observable.
	 *
	 * <span class="informal">It's similar to {@link mergeMap}, but applies the
	 * projection function to every source value as well as every output value.
	 * It's recursive.</span>
	 *
	 * <img src="./img/expand.png" width="100%">
	 *
	 * Returns an Observable that emits items based on applying a function that you
	 * supply to each item emitted by the source Observable, where that function
	 * returns an Observable, and then merging those resulting Observables and
	 * emitting the results of this merger. *Expand* will re-emit on the output
	 * Observable every source value. Then, each output value is given to the
	 * `project` function which returns an inner Observable to be merged on the
	 * output Observable. Those output values resulting from the projection are also
	 * given to the `project` function to produce new output values. This is how
	 * *expand* behaves recursively.
	 *
	 * @example <caption>Start emitting the powers of two on every click, at most 10 of them</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var powersOfTwo = clicks
	 *   .mapTo(1)
	 *   .expand(x => Rx.Observable.of(2 * x).delay(1000))
	 *   .take(10);
	 * powersOfTwo.subscribe(x => console.log(x));
	 *
	 * @see {@link mergeMap}
	 * @see {@link mergeScan}
	 *
	 * @param {function(value: T, index: number) => Observable} project A function
	 * that, when applied to an item emitted by the source or the output Observable,
	 * returns an Observable.
	 * @param {number} [concurrent=Number.POSITIVE_INFINITY] Maximum number of input
	 * Observables being subscribed to concurrently.
	 * @param {Scheduler} [scheduler=null] The IScheduler to use for subscribing to
	 * each projected inner Observable.
	 * @return {Observable} An Observable that emits the source values and also
	 * result of applying the projection function to each value emitted on the
	 * output Observable and and merging the results of the Observables obtained
	 * from this transformation.
	 * @method expand
	 * @owner Observable
	 */
	function expand$1(project, concurrent, scheduler) {
	    if (concurrent === void 0) { concurrent = Number.POSITIVE_INFINITY; }
	    if (scheduler === void 0) { scheduler = undefined; }
	    concurrent = (concurrent || 0) < 1 ? Number.POSITIVE_INFINITY : concurrent;
	    return _operators.expand(project, concurrent, scheduler)(this);
	}
	var expand_2 = expand$1;


	var expand_1 = /*#__PURE__*/Object.defineProperty({
		expand: expand_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.expand = expand_1.expand;

	/**
	 * Emits the single value at the specified `index` in a sequence of emissions
	 * from the source Observable.
	 *
	 * <span class="informal">Emits only the i-th value, then completes.</span>
	 *
	 * <img src="./img/elementAt.png" width="100%">
	 *
	 * `elementAt` returns an Observable that emits the item at the specified
	 * `index` in the source Observable, or a default value if that `index` is out
	 * of range and the `default` argument is provided. If the `default` argument is
	 * not given and the `index` is out of range, the output Observable will emit an
	 * `ArgumentOutOfRangeError` error.
	 *
	 * @example <caption>Emit only the third click event</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.elementAt(2);
	 * result.subscribe(x => console.log(x));
	 *
	 * // Results in:
	 * // click 1 = nothing
	 * // click 2 = nothing
	 * // click 3 = MouseEvent object logged to console
	 *
	 * @see {@link first}
	 * @see {@link last}
	 * @see {@link skip}
	 * @see {@link single}
	 * @see {@link take}
	 *
	 * @throws {ArgumentOutOfRangeError} When using `elementAt(i)`, it delivers an
	 * ArgumentOutOrRangeError to the Observer's `error` callback if `i < 0` or the
	 * Observable has completed before emitting the i-th `next` notification.
	 *
	 * @param {number} index Is the number `i` for the i-th source emission that has
	 * happened since the subscription, starting from the number `0`.
	 * @param {T} [defaultValue] The default value returned for missing indices.
	 * @return {Observable} An Observable that emits a single item, if it is found.
	 * Otherwise, will emit the default value if given. If not, then emits an error.
	 * @method elementAt
	 * @owner Observable
	 */
	function elementAt$1(index, defaultValue) {
	    return _operators.elementAt.apply(undefined, arguments)(this);
	}
	var elementAt_2 = elementAt$1;


	var elementAt_1 = /*#__PURE__*/Object.defineProperty({
		elementAt: elementAt_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.elementAt = elementAt_1.elementAt;

	/* tslint:enable:max-line-length */
	/**
	 * Filter items emitted by the source Observable by only emitting those that
	 * satisfy a specified predicate.
	 *
	 * <span class="informal">Like
	 * [Array.prototype.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter),
	 * it only emits a value from the source if it passes a criterion function.</span>
	 *
	 * <img src="./img/filter.png" width="100%">
	 *
	 * Similar to the well-known `Array.prototype.filter` method, this operator
	 * takes values from the source Observable, passes them through a `predicate`
	 * function and only emits those values that yielded `true`.
	 *
	 * @example <caption>Emit only click events whose target was a DIV element</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var clicksOnDivs = clicks.filter(ev => ev.target.tagName === 'DIV');
	 * clicksOnDivs.subscribe(x => console.log(x));
	 *
	 * @see {@link distinct}
	 * @see {@link distinctUntilChanged}
	 * @see {@link distinctUntilKeyChanged}
	 * @see {@link ignoreElements}
	 * @see {@link partition}
	 * @see {@link skip}
	 *
	 * @param {function(value: T, index: number): boolean} predicate A function that
	 * evaluates each value emitted by the source Observable. If it returns `true`,
	 * the value is emitted, if `false` the value is not passed to the output
	 * Observable. The `index` parameter is the number `i` for the i-th source
	 * emission that has happened since the subscription, starting from the number
	 * `0`.
	 * @param {any} [thisArg] An optional argument to determine the value of `this`
	 * in the `predicate` function.
	 * @return {Observable} An Observable of values from the source that were
	 * allowed by the `predicate` function.
	 * @method filter
	 * @owner Observable
	 */
	function filter$1(predicate, thisArg) {
	    return _operators.filter(predicate, thisArg)(this);
	}
	var filter_2 = filter$1;


	var filter_1 = /*#__PURE__*/Object.defineProperty({
		filter: filter_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.filter = filter_1.filter;

	/**
	 * Returns an Observable that mirrors the source Observable, but will call a specified function when
	 * the source terminates on complete, error or unsubscribe.
	 *
	 * <span class="informal">Ensure a given function will be called when a stream ends, no matter why it ended.</span>
	 *
	 * `finally` method accepts as a single parameter a function. This function does not accept any parameters and
	 * should not return anything. It will be called whenever source Observable completes, errors or is unsubscribed,
	 * which makes it good candidate to perform any necessary clean up or side effects when Observable terminates,
	 * no matter how or why it terminated.
	 *
	 * Observable returned by `finally` will simply mirror source Observable - each time it is subscribed, source
	 * Observable will be subscribed underneath.
	 *
	 * Note that behavior of `finally` will be repeated per every subscription, so if resulting Observable has
	 * many subscribers, function passed to `finally` might be potentially called multiple times.
	 *
	 * Remember also that `finally` differs quite a lot from passing complete or error handler to {@link subscribe}. It will
	 * return an Observable which can be further chained, while `subscribe` returns Subscription, basically ending Observable
	 * chain. Function passed to `finally` will be called also when consumer of resulting Observable unsubscribes from it,
	 * while handlers passed to `subscribe` will not (even complete handler). But most importantly, `finally` does not start
	 * an execution of source Observable, like `subscribe` does, allowing you to set up all necessary hooks before
	 * passing Observable further, even without specific knowledge how or when it will be used.
	 *
	 *
	 * @example <caption>Call finally after complete notification</caption>
	 * Rx.Observable.of(1, 2, 3)
	 * .finally(() => console.log('I was finalized!'))
	 * .map(x => x * 2) // `finally` returns an Observable, so we still can chain operators.
	 * .subscribe(
	 *   val => console.log(val),
	 *   err => {},
	 *   () => console.log('I completed!')
	 * );
	 *
	 * // Logs:
	 * // 1
	 * // 2
	 * // 3
	 * // "I completed!"
	 * // "I was finalized!"
	 *
	 *
	 *
	 * @example <caption>Call finally after consumer unsubscribes</caption>
	 * const o = Rx.Observable.interval(1000)
	 * .finally(() => console.log('Timer stopped'));
	 *
	 * const subscription = o.subscribe(
	 *   val => console.log(val),
	 *   err => {},
	 *   () => console.log('Complete!') // Will not be called, since complete handler
	 * );                               // does not react to unsubscription, just to
	 *                                  // complete notification sent by the Observable itself.
	 *
	 * setTimeout(() => subscription.unsubscribe(), 2500);
	 *
	 * // Logs:
	 * // 0 after 1s
	 * // 1 after 2s
	 * // "Timer stopped" after 2.5s
	 *
	 * @see {@link using}
	 *
	 * @param {function} callback Function to be called when source terminates (completes, errors or is unsubscribed).
	 * @return {Observable} An Observable that mirrors the source, but will call the specified function on termination.
	 * @method finally
	 * @name finally
	 * @owner Observable
	 */
	function _finally(callback) {
	    return _operators.finalize(callback)(this);
	}
	var _finally_2 = _finally;


	var _finally_1 = /*#__PURE__*/Object.defineProperty({
		_finally: _finally_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.finally = _finally_1._finally;
	rxjs_1.Observable.prototype._finally = _finally_1._finally;

	/* tslint:enable:max-line-length */
	/**
	 * Emits only the first value emitted by the source Observable that meets some
	 * condition.
	 *
	 * <span class="informal">Finds the first value that passes some test and emits
	 * that.</span>
	 *
	 * <img src="./img/find.png" width="100%">
	 *
	 * `find` searches for the first item in the source Observable that matches the
	 * specified condition embodied by the `predicate`, and returns the first
	 * occurrence in the source. Unlike {@link first}, the `predicate` is required
	 * in `find`, and does not emit an error if a valid value is not found.
	 *
	 * @example <caption>Find and emit the first click that happens on a DIV element</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.find(ev => ev.target.tagName === 'DIV');
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link filter}
	 * @see {@link first}
	 * @see {@link findIndex}
	 * @see {@link take}
	 *
	 * @param {function(value: T, index: number, source: Observable<T>): boolean} predicate
	 * A function called with each item to test for condition matching.
	 * @param {any} [thisArg] An optional argument to determine the value of `this`
	 * in the `predicate` function.
	 * @return {Observable<T>} An Observable of the first item that matches the
	 * condition.
	 * @method find
	 * @owner Observable
	 */
	function find$1(predicate, thisArg) {
	    return _operators.find(predicate, thisArg)(this);
	}
	var find_2 = find$1;


	var find_1 = /*#__PURE__*/Object.defineProperty({
		find: find_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.find = find_1.find;

	/**
	 * Emits only the index of the first value emitted by the source Observable that
	 * meets some condition.
	 *
	 * <span class="informal">It's like {@link find}, but emits the index of the
	 * found value, not the value itself.</span>
	 *
	 * <img src="./img/findIndex.png" width="100%">
	 *
	 * `findIndex` searches for the first item in the source Observable that matches
	 * the specified condition embodied by the `predicate`, and returns the
	 * (zero-based) index of the first occurrence in the source. Unlike
	 * {@link first}, the `predicate` is required in `findIndex`, and does not emit
	 * an error if a valid value is not found.
	 *
	 * @example <caption>Emit the index of first click that happens on a DIV element</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.findIndex(ev => ev.target.tagName === 'DIV');
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link filter}
	 * @see {@link find}
	 * @see {@link first}
	 * @see {@link take}
	 *
	 * @param {function(value: T, index: number, source: Observable<T>): boolean} predicate
	 * A function called with each item to test for condition matching.
	 * @param {any} [thisArg] An optional argument to determine the value of `this`
	 * in the `predicate` function.
	 * @return {Observable} An Observable of the index of the first item that
	 * matches the condition.
	 * @method find
	 * @owner Observable
	 */
	function findIndex$1(predicate, thisArg) {
	    return _operators.findIndex(predicate, thisArg)(this);
	}
	var findIndex_2 = findIndex$1;


	var findIndex_1 = /*#__PURE__*/Object.defineProperty({
		findIndex: findIndex_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.findIndex = findIndex_1.findIndex;

	/* tslint:enable:max-line-length */
	/**
	 * Emits only the first value (or the first value that meets some condition)
	 * emitted by the source Observable.
	 *
	 * <span class="informal">Emits only the first value. Or emits only the first
	 * value that passes some test.</span>
	 *
	 * <img src="./img/first.png" width="100%">
	 *
	 * If called with no arguments, `first` emits the first value of the source
	 * Observable, then completes. If called with a `predicate` function, `first`
	 * emits the first value of the source that matches the specified condition. It
	 * may also take a `resultSelector` function to produce the output value from
	 * the input value, and a `defaultValue` to emit in case the source completes
	 * before it is able to emit a valid value. Throws an error if `defaultValue`
	 * was not provided and a matching element is not found.
	 *
	 * @example <caption>Emit only the first click that happens on the DOM</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.first();
	 * result.subscribe(x => console.log(x));
	 *
	 * @example <caption>Emits the first click that happens on a DIV</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.first(ev => ev.target.tagName === 'DIV');
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link filter}
	 * @see {@link find}
	 * @see {@link take}
	 *
	 * @throws {EmptyError} Delivers an EmptyError to the Observer's `error`
	 * callback if the Observable completes before any `next` notification was sent.
	 *
	 * @param {function(value: T, index: number, source: Observable<T>): boolean} [predicate]
	 * An optional function called with each item to test for condition matching.
	 * @param {T} [defaultValue] The default value emitted in case no valid value
	 * was found on the source.
	 * @return {Observable<T>} An Observable of the first item that matches the
	 * condition.
	 * @method first
	 * @owner Observable
	 */
	function first$1() {
	    var args = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        args[_i] = arguments[_i];
	    }
	    return _operators.first.apply(void 0, args)(this);
	}
	var first_2 = first$1;


	var first_1 = /*#__PURE__*/Object.defineProperty({
		first: first_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.first = first_1.first;

	/* tslint:enable:max-line-length */
	/**
	 * Groups the items emitted by an Observable according to a specified criterion,
	 * and emits these grouped items as `GroupedObservables`, one
	 * {@link GroupedObservable} per group.
	 *
	 * <img src="./img/groupBy.png" width="100%">
	 *
	 * @example <caption>Group objects by id and return as array</caption>
	 * Observable.of<Obj>({id: 1, name: 'aze1'},
	 *                    {id: 2, name: 'sf2'},
	 *                    {id: 2, name: 'dg2'},
	 *                    {id: 1, name: 'erg1'},
	 *                    {id: 1, name: 'df1'},
	 *                    {id: 2, name: 'sfqfb2'},
	 *                    {id: 3, name: 'qfs3'},
	 *                    {id: 2, name: 'qsgqsfg2'}
	 *     )
	 *     .groupBy(p => p.id)
	 *     .flatMap( (group$) => group$.reduce((acc, cur) => [...acc, cur], []))
	 *     .subscribe(p => console.log(p));
	 *
	 * // displays:
	 * // [ { id: 1, name: 'aze1' },
	 * //   { id: 1, name: 'erg1' },
	 * //   { id: 1, name: 'df1' } ]
	 * //
	 * // [ { id: 2, name: 'sf2' },
	 * //   { id: 2, name: 'dg2' },
	 * //   { id: 2, name: 'sfqfb2' },
	 * //   { id: 2, name: 'qsgqsfg2' } ]
	 * //
	 * // [ { id: 3, name: 'qfs3' } ]
	 *
	 * @example <caption>Pivot data on the id field</caption>
	 * Observable.of<Obj>({id: 1, name: 'aze1'},
	 *                    {id: 2, name: 'sf2'},
	 *                    {id: 2, name: 'dg2'},
	 *                    {id: 1, name: 'erg1'},
	 *                    {id: 1, name: 'df1'},
	 *                    {id: 2, name: 'sfqfb2'},
	 *                    {id: 3, name: 'qfs1'},
	 *                    {id: 2, name: 'qsgqsfg2'}
	 *                   )
	 *     .groupBy(p => p.id, p => p.name)
	 *     .flatMap( (group$) => group$.reduce((acc, cur) => [...acc, cur], ["" + group$.key]))
	 *     .map(arr => ({'id': parseInt(arr[0]), 'values': arr.slice(1)}))
	 *     .subscribe(p => console.log(p));
	 *
	 * // displays:
	 * // { id: 1, values: [ 'aze1', 'erg1', 'df1' ] }
	 * // { id: 2, values: [ 'sf2', 'dg2', 'sfqfb2', 'qsgqsfg2' ] }
	 * // { id: 3, values: [ 'qfs1' ] }
	 *
	 * @param {function(value: T): K} keySelector A function that extracts the key
	 * for each item.
	 * @param {function(value: T): R} [elementSelector] A function that extracts the
	 * return element for each item.
	 * @param {function(grouped: GroupedObservable<K,R>): Observable<any>} [durationSelector]
	 * A function that returns an Observable to determine how long each group should
	 * exist.
	 * @return {Observable<GroupedObservable<K,R>>} An Observable that emits
	 * GroupedObservables, each of which corresponds to a unique key value and each
	 * of which emits those items from the source Observable that share that key
	 * value.
	 * @method groupBy
	 * @owner Observable
	 */
	function groupBy$1(keySelector, elementSelector, durationSelector, subjectSelector) {
	    return _operators.groupBy(keySelector, elementSelector, durationSelector, subjectSelector)(this);
	}
	var groupBy_2 = groupBy$1;


	var groupBy_1 = /*#__PURE__*/Object.defineProperty({
		groupBy: groupBy_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.groupBy = groupBy_1.groupBy;

	/**
	 * Ignores all items emitted by the source Observable and only passes calls of `complete` or `error`.
	 *
	 * <img src="./img/ignoreElements.png" width="100%">
	 *
	 * @return {Observable} An empty Observable that only calls `complete`
	 * or `error`, based on which one is called by the source Observable.
	 * @method ignoreElements
	 * @owner Observable
	 */
	function ignoreElements$1() {
	    return _operators.ignoreElements()(this);
	}
	var ignoreElements_2 = ignoreElements$1;


	var ignoreElements_1 = /*#__PURE__*/Object.defineProperty({
		ignoreElements: ignoreElements_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.ignoreElements = ignoreElements_1.ignoreElements;

	/**
	 * If the source Observable is empty it returns an Observable that emits true, otherwise it emits false.
	 *
	 * <img src="./img/isEmpty.png" width="100%">
	 *
	 * @return {Observable} An Observable that emits a Boolean.
	 * @method isEmpty
	 * @owner Observable
	 */
	function isEmpty$1() {
	    return _operators.isEmpty()(this);
	}
	var isEmpty_2 = isEmpty$1;


	var isEmpty_1 = /*#__PURE__*/Object.defineProperty({
		isEmpty: isEmpty_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.isEmpty = isEmpty_1.isEmpty;

	/**
	 * Ignores source values for a duration determined by another Observable, then
	 * emits the most recent value from the source Observable, then repeats this
	 * process.
	 *
	 * <span class="informal">It's like {@link auditTime}, but the silencing
	 * duration is determined by a second Observable.</span>
	 *
	 * <img src="./img/audit.png" width="100%">
	 *
	 * `audit` is similar to `throttle`, but emits the last value from the silenced
	 * time window, instead of the first value. `audit` emits the most recent value
	 * from the source Observable on the output Observable as soon as its internal
	 * timer becomes disabled, and ignores source values while the timer is enabled.
	 * Initially, the timer is disabled. As soon as the first source value arrives,
	 * the timer is enabled by calling the `durationSelector` function with the
	 * source value, which returns the "duration" Observable. When the duration
	 * Observable emits a value or completes, the timer is disabled, then the most
	 * recent source value is emitted on the output Observable, and this process
	 * repeats for the next source value.
	 *
	 * @example <caption>Emit clicks at a rate of at most one click per second</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.audit(ev => Rx.Observable.interval(1000));
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link auditTime}
	 * @see {@link debounce}
	 * @see {@link delayWhen}
	 * @see {@link sample}
	 * @see {@link throttle}
	 *
	 * @param {function(value: T): SubscribableOrPromise} durationSelector A function
	 * that receives a value from the source Observable, for computing the silencing
	 * duration, returned as an Observable or a Promise.
	 * @return {Observable<T>} An Observable that performs rate-limiting of
	 * emissions from the source Observable.
	 * @method audit
	 * @owner Observable
	 */
	function audit$1(durationSelector) {
	    return _operators.audit(durationSelector)(this);
	}
	var audit_2 = audit$1;


	var audit_1 = /*#__PURE__*/Object.defineProperty({
		audit: audit_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.audit = audit_1.audit;

	/**
	 * Ignores source values for `duration` milliseconds, then emits the most recent
	 * value from the source Observable, then repeats this process.
	 *
	 * <span class="informal">When it sees a source values, it ignores that plus
	 * the next ones for `duration` milliseconds, and then it emits the most recent
	 * value from the source.</span>
	 *
	 * <img src="./img/auditTime.png" width="100%">
	 *
	 * `auditTime` is similar to `throttleTime`, but emits the last value from the
	 * silenced time window, instead of the first value. `auditTime` emits the most
	 * recent value from the source Observable on the output Observable as soon as
	 * its internal timer becomes disabled, and ignores source values while the
	 * timer is enabled. Initially, the timer is disabled. As soon as the first
	 * source value arrives, the timer is enabled. After `duration` milliseconds (or
	 * the time unit determined internally by the optional `scheduler`) has passed,
	 * the timer is disabled, then the most recent source value is emitted on the
	 * output Observable, and this process repeats for the next source value.
	 * Optionally takes a {@link IScheduler} for managing timers.
	 *
	 * @example <caption>Emit clicks at a rate of at most one click per second</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.auditTime(1000);
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link audit}
	 * @see {@link debounceTime}
	 * @see {@link delay}
	 * @see {@link sampleTime}
	 * @see {@link throttleTime}
	 *
	 * @param {number} duration Time to wait before emitting the most recent source
	 * value, measured in milliseconds or the time unit determined internally
	 * by the optional `scheduler`.
	 * @param {Scheduler} [scheduler=async] The {@link IScheduler} to use for
	 * managing the timers that handle the rate-limiting behavior.
	 * @return {Observable<T>} An Observable that performs rate-limiting of
	 * emissions from the source Observable.
	 * @method auditTime
	 * @owner Observable
	 */
	function auditTime$1(duration, scheduler) {
	    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
	    return _operators.auditTime(duration, scheduler)(this);
	}
	var auditTime_2 = auditTime$1;


	var auditTime_1 = /*#__PURE__*/Object.defineProperty({
		auditTime: auditTime_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.auditTime = auditTime_1.auditTime;

	/* tslint:enable:max-line-length */
	/**
	 * Returns an Observable that emits only the last item emitted by the source Observable.
	 * It optionally takes a predicate function as a parameter, in which case, rather than emitting
	 * the last item from the source Observable, the resulting Observable will emit the last item
	 * from the source Observable that satisfies the predicate.
	 *
	 * <img src="./img/last.png" width="100%">
	 *
	 * @throws {EmptyError} Delivers an EmptyError to the Observer's `error`
	 * callback if the Observable completes before any `next` notification was sent.
	 * @param {function} [predicate] - The condition any source emitted item has to satisfy.
	 * @param {any} [defaultValue] - The default value to use if the predicate isn't
	 * satisfied, or no values were emitted (if no predicate).
	 * @return {Observable} An Observable that emits only the last item satisfying the given condition
	 * from the source, or an NoSuchElementException if no such items are emitted.
	 * @throws - Throws if no items that match the predicate are emitted by the source Observable.
	 * @method last
	 * @owner Observable
	 */
	function last$1() {
	    var args = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        args[_i] = arguments[_i];
	    }
	    return _operators.last.apply(void 0, args)(this);
	}
	var last_2 = last$1;


	var last_1 = /*#__PURE__*/Object.defineProperty({
		last: last_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.last = last_1.last;

	/**
	 * @param func
	 * @return {Observable<R>}
	 * @method let
	 * @owner Observable
	 */
	function letProto(func) {
	    return func(this);
	}
	var letProto_1 = letProto;


	var _let = /*#__PURE__*/Object.defineProperty({
		letProto: letProto_1
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.let = _let.letProto;
	rxjs_1.Observable.prototype.letBind = _let.letProto;

	/**
	 * Returns an Observable that emits whether or not every item of the source satisfies the condition specified.
	 *
	 * @example <caption>A simple example emitting true if all elements are less than 5, false otherwise</caption>
	 *  Observable.of(1, 2, 3, 4, 5, 6)
	 *     .every(x => x < 5)
	 *     .subscribe(x => console.log(x)); // -> false
	 *
	 * @param {function} predicate A function for determining if an item meets a specified condition.
	 * @param {any} [thisArg] Optional object to use for `this` in the callback.
	 * @return {Observable} An Observable of booleans that determines if all items of the source Observable meet the condition specified.
	 * @method every
	 * @owner Observable
	 */
	function every$1(predicate, thisArg) {
	    return _operators.every(predicate, thisArg)(this);
	}
	var every_2 = every$1;


	var every_1 = /*#__PURE__*/Object.defineProperty({
		every: every_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.every = every_1.every;

	/**
	 * Applies a given `project` function to each value emitted by the source
	 * Observable, and emits the resulting values as an Observable.
	 *
	 * <span class="informal">Like [Array.prototype.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map),
	 * it passes each source value through a transformation function to get
	 * corresponding output values.</span>
	 *
	 * <img src="./img/map.png" width="100%">
	 *
	 * Similar to the well known `Array.prototype.map` function, this operator
	 * applies a projection to each value and emits that projection in the output
	 * Observable.
	 *
	 * @example <caption>Map every click to the clientX position of that click</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var positions = clicks.map(ev => ev.clientX);
	 * positions.subscribe(x => console.log(x));
	 *
	 * @see {@link mapTo}
	 * @see {@link pluck}
	 *
	 * @param {function(value: T, index: number): R} project The function to apply
	 * to each `value` emitted by the source Observable. The `index` parameter is
	 * the number `i` for the i-th emission that has happened since the
	 * subscription, starting from the number `0`.
	 * @param {any} [thisArg] An optional argument to define what `this` is in the
	 * `project` function.
	 * @return {Observable<R>} An Observable that emits the values from the source
	 * Observable transformed by the given `project` function.
	 * @method map
	 * @owner Observable
	 */
	function map$1(project, thisArg) {
	    return _operators.map(project, thisArg)(this);
	}
	var map_2 = map$1;


	var map_1 = /*#__PURE__*/Object.defineProperty({
		map: map_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.map = map_1.map;

	/**
	 * Emits the given constant value on the output Observable every time the source
	 * Observable emits a value.
	 *
	 * <span class="informal">Like {@link map}, but it maps every source value to
	 * the same output value every time.</span>
	 *
	 * <img src="./img/mapTo.png" width="100%">
	 *
	 * Takes a constant `value` as argument, and emits that whenever the source
	 * Observable emits a value. In other words, ignores the actual source value,
	 * and simply uses the emission moment to know when to emit the given `value`.
	 *
	 * @example <caption>Map every click to the string 'Hi'</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var greetings = clicks.mapTo('Hi');
	 * greetings.subscribe(x => console.log(x));
	 *
	 * @see {@link map}
	 *
	 * @param {any} value The value to map each source value to.
	 * @return {Observable} An Observable that emits the given `value` every time
	 * the source Observable emits something.
	 * @method mapTo
	 * @owner Observable
	 */
	function mapTo$1(value) {
	    return _operators.mapTo(value)(this);
	}
	var mapTo_2 = mapTo$1;


	var mapTo_1 = /*#__PURE__*/Object.defineProperty({
		mapTo: mapTo_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.mapTo = mapTo_1.mapTo;

	/**
	 * Represents all of the notifications from the source Observable as `next`
	 * emissions marked with their original types within {@link Notification}
	 * objects.
	 *
	 * <span class="informal">Wraps `next`, `error` and `complete` emissions in
	 * {@link Notification} objects, emitted as `next` on the output Observable.
	 * </span>
	 *
	 * <img src="./img/materialize.png" width="100%">
	 *
	 * `materialize` returns an Observable that emits a `next` notification for each
	 * `next`, `error`, or `complete` emission of the source Observable. When the
	 * source Observable emits `complete`, the output Observable will emit `next` as
	 * a Notification of type "complete", and then it will emit `complete` as well.
	 * When the source Observable emits `error`, the output will emit `next` as a
	 * Notification of type "error", and then `complete`.
	 *
	 * This operator is useful for producing metadata of the source Observable, to
	 * be consumed as `next` emissions. Use it in conjunction with
	 * {@link dematerialize}.
	 *
	 * @example <caption>Convert a faulty Observable to an Observable of Notifications</caption>
	 * var letters = Rx.Observable.of('a', 'b', 13, 'd');
	 * var upperCase = letters.map(x => x.toUpperCase());
	 * var materialized = upperCase.materialize();
	 * materialized.subscribe(x => console.log(x));
	 *
	 * // Results in the following:
	 * // - Notification {kind: "N", value: "A", error: undefined, hasValue: true}
	 * // - Notification {kind: "N", value: "B", error: undefined, hasValue: true}
	 * // - Notification {kind: "E", value: undefined, error: TypeError:
	 * //   x.toUpperCase is not a function at MapSubscriber.letters.map.x
	 * //   [as project] (http://1…, hasValue: false}
	 *
	 * @see {@link Notification}
	 * @see {@link dematerialize}
	 *
	 * @return {Observable<Notification<T>>} An Observable that emits
	 * {@link Notification} objects that wrap the original emissions from the source
	 * Observable with metadata.
	 * @method materialize
	 * @owner Observable
	 */
	function materialize$1() {
	    return _operators.materialize()(this);
	}
	var materialize_2 = materialize$1;


	var materialize_1 = /*#__PURE__*/Object.defineProperty({
		materialize: materialize_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.materialize = materialize_1.materialize;

	/**
	 * The Max operator operates on an Observable that emits numbers (or items that can be compared with a provided function),
	 * and when source Observable completes it emits a single item: the item with the largest value.
	 *
	 * <img src="./img/max.png" width="100%">
	 *
	 * @example <caption>Get the maximal value of a series of numbers</caption>
	 * Rx.Observable.of(5, 4, 7, 2, 8)
	 *   .max()
	 *   .subscribe(x => console.log(x)); // -> 8
	 *
	 * @example <caption>Use a comparer function to get the maximal item</caption>
	 * interface Person {
	 *   age: number,
	 *   name: string
	 * }
	 * Observable.of<Person>({age: 7, name: 'Foo'},
	 *                       {age: 5, name: 'Bar'},
	 *                       {age: 9, name: 'Beer'})
	 *           .max<Person>((a: Person, b: Person) => a.age < b.age ? -1 : 1)
	 *           .subscribe((x: Person) => console.log(x.name)); // -> 'Beer'
	 * }
	 *
	 * @see {@link min}
	 *
	 * @param {Function} [comparer] - Optional comparer function that it will use instead of its default to compare the
	 * value of two items.
	 * @return {Observable} An Observable that emits item with the largest value.
	 * @method max
	 * @owner Observable
	 */
	function max$1(comparer) {
	    return _operators.max(comparer)(this);
	}
	var max_2 = max$1;


	var max_1 = /*#__PURE__*/Object.defineProperty({
		max: max_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.max = max_1.max;

	/* tslint:enable:max-line-length */
	/**
	 * Creates an output Observable which concurrently emits all values from every
	 * given input Observable.
	 *
	 * <span class="informal">Flattens multiple Observables together by blending
	 * their values into one Observable.</span>
	 *
	 * <img src="./img/merge.png" width="100%">
	 *
	 * `merge` subscribes to each given input Observable (either the source or an
	 * Observable given as argument), and simply forwards (without doing any
	 * transformation) all the values from all the input Observables to the output
	 * Observable. The output Observable only completes once all input Observables
	 * have completed. Any error delivered by an input Observable will be immediately
	 * emitted on the output Observable.
	 *
	 * @example <caption>Merge together two Observables: 1s interval and clicks</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var timer = Rx.Observable.interval(1000);
	 * var clicksOrTimer = clicks.merge(timer);
	 * clicksOrTimer.subscribe(x => console.log(x));
	 *
	 * @example <caption>Merge together 3 Observables, but only 2 run concurrently</caption>
	 * var timer1 = Rx.Observable.interval(1000).take(10);
	 * var timer2 = Rx.Observable.interval(2000).take(6);
	 * var timer3 = Rx.Observable.interval(500).take(10);
	 * var concurrent = 2; // the argument
	 * var merged = timer1.merge(timer2, timer3, concurrent);
	 * merged.subscribe(x => console.log(x));
	 *
	 * @see {@link mergeAll}
	 * @see {@link mergeMap}
	 * @see {@link mergeMapTo}
	 * @see {@link mergeScan}
	 *
	 * @param {ObservableInput} other An input Observable to merge with the source
	 * Observable. More than one input Observables may be given as argument.
	 * @param {number} [concurrent=Number.POSITIVE_INFINITY] Maximum number of input
	 * Observables being subscribed to concurrently.
	 * @param {Scheduler} [scheduler=null] The IScheduler to use for managing
	 * concurrency of input Observables.
	 * @return {Observable} An Observable that emits items that are the result of
	 * every input Observable.
	 * @method merge
	 * @owner Observable
	 */
	function merge$2() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    return this.lift.call(rxjs_1.merge.apply(void 0, [this].concat(observables)));
	}
	var merge_2 = merge$2;


	var merge_1 = /*#__PURE__*/Object.defineProperty({
		merge: merge_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.merge = merge_1.merge;

	/**
	 * Converts a higher-order Observable into a first-order Observable which
	 * concurrently delivers all values that are emitted on the inner Observables.
	 *
	 * <span class="informal">Flattens an Observable-of-Observables.</span>
	 *
	 * <img src="./img/mergeAll.png" width="100%">
	 *
	 * `mergeAll` subscribes to an Observable that emits Observables, also known as
	 * a higher-order Observable. Each time it observes one of these emitted inner
	 * Observables, it subscribes to that and delivers all the values from the
	 * inner Observable on the output Observable. The output Observable only
	 * completes once all inner Observables have completed. Any error delivered by
	 * a inner Observable will be immediately emitted on the output Observable.
	 *
	 * @example <caption>Spawn a new interval Observable for each click event, and blend their outputs as one Observable</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var higherOrder = clicks.map((ev) => Rx.Observable.interval(1000));
	 * var firstOrder = higherOrder.mergeAll();
	 * firstOrder.subscribe(x => console.log(x));
	 *
	 * @example <caption>Count from 0 to 9 every second for each click, but only allow 2 concurrent timers</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var higherOrder = clicks.map((ev) => Rx.Observable.interval(1000).take(10));
	 * var firstOrder = higherOrder.mergeAll(2);
	 * firstOrder.subscribe(x => console.log(x));
	 *
	 * @see {@link combineAll}
	 * @see {@link concatAll}
	 * @see {@link exhaust}
	 * @see {@link merge}
	 * @see {@link mergeMap}
	 * @see {@link mergeMapTo}
	 * @see {@link mergeScan}
	 * @see {@link switch}
	 * @see {@link zipAll}
	 *
	 * @param {number} [concurrent=Number.POSITIVE_INFINITY] Maximum number of inner
	 * Observables being subscribed to concurrently.
	 * @return {Observable} An Observable that emits values coming from all the
	 * inner Observables emitted by the source Observable.
	 * @method mergeAll
	 * @owner Observable
	 */
	function mergeAll$1(concurrent) {
	    if (concurrent === void 0) { concurrent = Number.POSITIVE_INFINITY; }
	    return _operators.mergeAll(concurrent)(this);
	}
	var mergeAll_2 = mergeAll$1;


	var mergeAll_1 = /*#__PURE__*/Object.defineProperty({
		mergeAll: mergeAll_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.mergeAll = mergeAll_1.mergeAll;

	/**
	 * Projects each source value to an Observable which is merged in the output
	 * Observable.
	 *
	 * <span class="informal">Maps each value to an Observable, then flattens all of
	 * these inner Observables using {@link mergeAll}.</span>
	 *
	 * <img src="./img/mergeMap.png" width="100%">
	 *
	 * Returns an Observable that emits items based on applying a function that you
	 * supply to each item emitted by the source Observable, where that function
	 * returns an Observable, and then merging those resulting Observables and
	 * emitting the results of this merger.
	 *
	 * @example <caption>Map and flatten each letter to an Observable ticking every 1 second</caption>
	 * var letters = Rx.Observable.of('a', 'b', 'c');
	 * var result = letters.mergeMap(x =>
	 *   Rx.Observable.interval(1000).map(i => x+i)
	 * );
	 * result.subscribe(x => console.log(x));
	 *
	 * // Results in the following:
	 * // a0
	 * // b0
	 * // c0
	 * // a1
	 * // b1
	 * // c1
	 * // continues to list a,b,c with respective ascending integers
	 *
	 * @see {@link concatMap}
	 * @see {@link exhaustMap}
	 * @see {@link merge}
	 * @see {@link mergeAll}
	 * @see {@link mergeMapTo}
	 * @see {@link mergeScan}
	 * @see {@link switchMap}
	 *
	 * @param {function(value: T, ?index: number): ObservableInput} project A function
	 * that, when applied to an item emitted by the source Observable, returns an
	 * Observable.
	 * @param {number} [concurrent=Number.POSITIVE_INFINITY] Maximum number of input
	 * Observables being subscribed to concurrently.
	 * @return {Observable} An Observable that emits the result of applying the
	 * projection function (and the optional `resultSelector`) to each item emitted
	 * by the source Observable and merging the results of the Observables obtained
	 * from this transformation.
	 * @method mergeMap
	 * @owner Observable
	 */
	function mergeMap$1(project, concurrent) {
	    if (concurrent === void 0) { concurrent = Number.POSITIVE_INFINITY; }
	    return _operators.mergeMap(project, concurrent)(this);
	}
	var mergeMap_2 = mergeMap$1;


	var mergeMap_1 = /*#__PURE__*/Object.defineProperty({
		mergeMap: mergeMap_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.mergeMap = mergeMap_1.mergeMap;
	rxjs_1.Observable.prototype.flatMap = mergeMap_1.mergeMap;

	/**
	 * Projects each source value to the same Observable which is merged multiple
	 * times in the output Observable.
	 *
	 * <span class="informal">It's like {@link mergeMap}, but maps each value always
	 * to the same inner Observable.</span>
	 *
	 * <img src="./img/mergeMapTo.png" width="100%">
	 *
	 * Maps each source value to the given Observable `innerObservable` regardless
	 * of the source value, and then merges those resulting Observables into one
	 * single Observable, which is the output Observable.
	 *
	 * @example <caption>For each click event, start an interval Observable ticking every 1 second</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.mergeMapTo(Rx.Observable.interval(1000));
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link concatMapTo}
	 * @see {@link merge}
	 * @see {@link mergeAll}
	 * @see {@link mergeMap}
	 * @see {@link mergeScan}
	 * @see {@link switchMapTo}
	 *
	 * @param {ObservableInput} innerObservable An Observable to replace each value from
	 * the source Observable.
	 * @param {number} [concurrent=Number.POSITIVE_INFINITY] Maximum number of input
	 * Observables being subscribed to concurrently.
	 * @return {Observable} An Observable that emits items from the given
	 * `innerObservable`.
	 * @method mergeMapTo
	 * @owner Observable
	 */
	function mergeMapTo$1(innerObservable, concurrent) {
	    if (concurrent === void 0) { concurrent = Number.POSITIVE_INFINITY; }
	    return _operators.mergeMapTo(innerObservable, concurrent)(this);
	}
	var mergeMapTo_2 = mergeMapTo$1;


	var mergeMapTo_1 = /*#__PURE__*/Object.defineProperty({
		mergeMapTo: mergeMapTo_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.flatMapTo = mergeMapTo_1.mergeMapTo;
	rxjs_1.Observable.prototype.mergeMapTo = mergeMapTo_1.mergeMapTo;

	/**
	 * Applies an accumulator function over the source Observable where the
	 * accumulator function itself returns an Observable, then each intermediate
	 * Observable returned is merged into the output Observable.
	 *
	 * <span class="informal">It's like {@link scan}, but the Observables returned
	 * by the accumulator are merged into the outer Observable.</span>
	 *
	 * @example <caption>Count the number of click events</caption>
	 * const click$ = Rx.Observable.fromEvent(document, 'click');
	 * const one$ = click$.mapTo(1);
	 * const seed = 0;
	 * const count$ = one$.mergeScan((acc, one) => Rx.Observable.of(acc + one), seed);
	 * count$.subscribe(x => console.log(x));
	 *
	 * // Results:
	 * 1
	 * 2
	 * 3
	 * 4
	 * // ...and so on for each click
	 *
	 * @param {function(acc: R, value: T): Observable<R>} accumulator
	 * The accumulator function called on each source value.
	 * @param seed The initial accumulation value.
	 * @param {number} [concurrent=Number.POSITIVE_INFINITY] Maximum number of
	 * input Observables being subscribed to concurrently.
	 * @return {Observable<R>} An observable of the accumulated values.
	 * @method mergeScan
	 * @owner Observable
	 */
	function mergeScan$1(accumulator, seed, concurrent) {
	    if (concurrent === void 0) { concurrent = Number.POSITIVE_INFINITY; }
	    return _operators.mergeScan(accumulator, seed, concurrent)(this);
	}
	var mergeScan_2 = mergeScan$1;


	var mergeScan_1 = /*#__PURE__*/Object.defineProperty({
		mergeScan: mergeScan_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.mergeScan = mergeScan_1.mergeScan;

	/**
	 * The Min operator operates on an Observable that emits numbers (or items that can be compared with a provided function),
	 * and when source Observable completes it emits a single item: the item with the smallest value.
	 *
	 * <img src="./img/min.png" width="100%">
	 *
	 * @example <caption>Get the minimal value of a series of numbers</caption>
	 * Rx.Observable.of(5, 4, 7, 2, 8)
	 *   .min()
	 *   .subscribe(x => console.log(x)); // -> 2
	 *
	 * @example <caption>Use a comparer function to get the minimal item</caption>
	 * interface Person {
	 *   age: number,
	 *   name: string
	 * }
	 * Observable.of<Person>({age: 7, name: 'Foo'},
	 *                       {age: 5, name: 'Bar'},
	 *                       {age: 9, name: 'Beer'})
	 *           .min<Person>( (a: Person, b: Person) => a.age < b.age ? -1 : 1)
	 *           .subscribe((x: Person) => console.log(x.name)); // -> 'Bar'
	 * }
	 *
	 * @see {@link max}
	 *
	 * @param {Function} [comparer] - Optional comparer function that it will use instead of its default to compare the
	 * value of two items.
	 * @return {Observable<R>} An Observable that emits item with the smallest value.
	 * @method min
	 * @owner Observable
	 */
	function min$1(comparer) {
	    return _operators.min(comparer)(this);
	}
	var min_2 = min$1;


	var min_1 = /*#__PURE__*/Object.defineProperty({
		min: min_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.min = min_1.min;

	/* tslint:enable:max-line-length */
	/**
	 * Allows source Observable to be subscribed only once with a Subject of choice,
	 * while still sharing its values between multiple subscribers.
	 *
	 * <span class="informal">Subscribe to Observable once, but send its values to multiple subscribers.</span>
	 *
	 * <img src="./img/multicast.png" width="100%">
	 *
	 * `multicast` is an operator that works in two modes.
	 *
	 * In the first mode you provide a single argument to it, which can be either an initialized Subject or a Subject
	 * factory. As a result you will get a special kind of an Observable - a {@link ConnectableObservable}. It can be
	 * subscribed multiple times, just as regular Observable, but it won't subscribe to the source Observable at that
	 * moment. It will do it only if you call its `connect` method. This means you can essentially control by hand, when
	 * source Observable will be actually subscribed. What is more, ConnectableObservable will share this one subscription
	 * between all of its subscribers. This means that, for example, `ajax` Observable will only send a request once,
	 * even though usually it would send a request per every subscriber. Since it sends a request at the moment of
	 * subscription, here request would be sent when the `connect` method of a ConnectableObservable is called.
	 *
	 * The most common pattern of using ConnectableObservable is calling `connect` when the first consumer subscribes,
	 * keeping the subscription alive while several consumers come and go and finally unsubscribing from the source
	 * Observable, when the last consumer unsubscribes. To not implement that logic over and over again,
	 * ConnectableObservable has a special operator, `refCount`. When called, it returns an Observable, which will count
	 * the number of consumers subscribed to it and keep ConnectableObservable connected as long as there is at least
	 * one consumer. So if you don't actually need to decide yourself when to connect and disconnect a
	 * ConnectableObservable, use `refCount`.
	 *
	 * The second mode is invoked by calling `multicast` with an additional, second argument - selector function.
	 * This function accepts an Observable - which basically mirrors the source Observable - and returns Observable
	 * as well, which should be the input stream modified by any operators you want. Note that in this
	 * mode you cannot provide initialized Subject as a first argument - it has to be a Subject factory. If
	 * you provide selector function, `multicast` returns just a regular Observable, instead of ConnectableObservable.
	 * Thus, as usual, each subscription to this stream triggers subscription to the source Observable. However,
	 * if inside the selector function you subscribe to the input Observable multiple times, actual source stream
	 * will be subscribed only once. So if you have a chain of operators that use some Observable many times,
	 * but you want to subscribe to that Observable only once, this is the mode you would use.
	 *
	 * Subject provided as a first parameter of `multicast` is used as a proxy for the single subscription to the
	 * source Observable. It means that all values from the source stream go through that Subject. Thus, if a Subject
	 * has some special properties, Observable returned by `multicast` will have them as well. If you want to use
	 * `multicast` with a Subject that is one of the ones included in RxJS by default - {@link Subject},
	 * {@link AsyncSubject}, {@link BehaviorSubject}, or {@link ReplaySubject} - simply use {@link publish},
	 * {@link publishLast}, {@link publishBehavior} or {@link publishReplay} respectively. These are actually
	 * just wrappers around `multicast`, with a specific Subject hardcoded inside.
	 *
	 * Also, if you use {@link publish} or {@link publishReplay} with a ConnectableObservables `refCount` operator,
	 * you can simply use {@link share} and {@link shareReplay} respectively, which chain these two.
	 *
	 * @example <caption>Use ConnectableObservable</caption>
	 * const seconds = Rx.Observable.interval(1000);
	 * const connectableSeconds = seconds.multicast(new Subject());
	 *
	 * connectableSeconds.subscribe(value => console.log('first: ' + value));
	 * connectableSeconds.subscribe(value => console.log('second: ' + value));
	 *
	 * // At this point still nothing happens, even though we subscribed twice.
	 *
	 * connectableSeconds.connect();
	 *
	 * // From now on `seconds` are being logged to the console,
	 * // twice per every second. `seconds` Observable was however only subscribed once,
	 * // so under the hood Observable.interval had only one clock started.
	 *
	 * @example <caption>Use selector</caption>
	 * const seconds = Rx.Observable.interval(1000);
	 *
	 * seconds
	 *     .multicast(
	 *         () => new Subject(),
	 *         seconds => seconds.zip(seconds) // Usually zip would subscribe to `seconds` twice.
	 *                                         // Because we are inside selector, `seconds` is subscribed once,
	 *     )                                   // thus starting only one clock used internally by Observable.interval.
	 *     .subscribe();
	 *
	 * @see {@link publish}
	 * @see {@link publishLast}
	 * @see {@link publishBehavior}
	 * @see {@link publishReplay}
	 * @see {@link share}
	 * @see {@link shareReplay}
	 *
	 * @param {Function|Subject} subjectOrSubjectFactory - Factory function to create an intermediate Subject through
	 * which the source sequence's elements will be multicast to the selector function input Observable or
	 * ConnectableObservable returned by the operator.
	 * @param {Function} [selector] - Optional selector function that can use the input stream
	 * as many times as needed, without causing multiple subscriptions to the source stream.
	 * Subscribers to the input source will receive all notifications of the source from the
	 * time of the subscription forward.
	 * @return {Observable<T>|ConnectableObservable<T>} An Observable that emits the results of invoking the selector
	 * on the source stream or a special {@link ConnectableObservable}, if selector was not provided.
	 *
	 * @method multicast
	 * @owner Observable
	 */
	function multicast$1(subjectOrSubjectFactory, selector) {
	    return _operators.multicast(subjectOrSubjectFactory, selector)(this);
	}
	var multicast_2 = multicast$1;


	var multicast_1 = /*#__PURE__*/Object.defineProperty({
		multicast: multicast_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.multicast = multicast_1.multicast;

	/**
	 *
	 * Re-emits all notifications from source Observable with specified scheduler.
	 *
	 * <span class="informal">Ensure a specific scheduler is used, from outside of an Observable.</span>
	 *
	 * `observeOn` is an operator that accepts a scheduler as a first parameter, which will be used to reschedule
	 * notifications emitted by the source Observable. It might be useful, if you do not have control over
	 * internal scheduler of a given Observable, but want to control when its values are emitted nevertheless.
	 *
	 * Returned Observable emits the same notifications (nexted values, complete and error events) as the source Observable,
	 * but rescheduled with provided scheduler. Note that this doesn't mean that source Observables internal
	 * scheduler will be replaced in any way. Original scheduler still will be used, but when the source Observable emits
	 * notification, it will be immediately scheduled again - this time with scheduler passed to `observeOn`.
	 * An anti-pattern would be calling `observeOn` on Observable that emits lots of values synchronously, to split
	 * that emissions into asynchronous chunks. For this to happen, scheduler would have to be passed into the source
	 * Observable directly (usually into the operator that creates it). `observeOn` simply delays notifications a
	 * little bit more, to ensure that they are emitted at expected moments.
	 *
	 * As a matter of fact, `observeOn` accepts second parameter, which specifies in milliseconds with what delay notifications
	 * will be emitted. The main difference between {@link delay} operator and `observeOn` is that `observeOn`
	 * will delay all notifications - including error notifications - while `delay` will pass through error
	 * from source Observable immediately when it is emitted. In general it is highly recommended to use `delay` operator
	 * for any kind of delaying of values in the stream, while using `observeOn` to specify which scheduler should be used
	 * for notification emissions in general.
	 *
	 * @example <caption>Ensure values in subscribe are called just before browser repaint.</caption>
	 * const intervals = Rx.Observable.interval(10); // Intervals are scheduled
	 *                                               // with async scheduler by default...
	 *
	 * intervals
	 * .observeOn(Rx.Scheduler.animationFrame)       // ...but we will observe on animationFrame
	 * .subscribe(val => {                           // scheduler to ensure smooth animation.
	 *   someDiv.style.height = val + 'px';
	 * });
	 *
	 * @see {@link delay}
	 *
	 * @param {SchedulerLike} scheduler Scheduler that will be used to reschedule notifications from source Observable.
	 * @param {number} [delay] Number of milliseconds that states with what delay every notification should be rescheduled.
	 * @return {Observable<T>} Observable that emits the same notifications as the source Observable,
	 * but with provided scheduler.
	 *
	 * @method observeOn
	 * @owner Observable
	 */
	function observeOn$1(scheduler, delay) {
	    if (delay === void 0) { delay = 0; }
	    return _operators.observeOn(scheduler, delay)(this);
	}
	var observeOn_2 = observeOn$1;


	var observeOn_1 = /*#__PURE__*/Object.defineProperty({
		observeOn: observeOn_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.observeOn = observeOn_1.observeOn;

	/* tslint:enable:max-line-length */
	/**
	 * When any of the provided Observable emits an complete or error notification, it immediately subscribes to the next one
	 * that was passed.
	 *
	 * <span class="informal">Execute series of Observables no matter what, even if it means swallowing errors.</span>
	 *
	 * <img src="./img/onErrorResumeNext.png" width="100%">
	 *
	 * `onErrorResumeNext` is an operator that accepts a series of Observables, provided either directly as
	 * arguments or as an array. If no single Observable is provided, returned Observable will simply behave the same
	 * as the source.
	 *
	 * `onErrorResumeNext` returns an Observable that starts by subscribing and re-emitting values from the source Observable.
	 * When its stream of values ends - no matter if Observable completed or emitted an error - `onErrorResumeNext`
	 * will subscribe to the first Observable that was passed as an argument to the method. It will start re-emitting
	 * its values as well and - again - when that stream ends, `onErrorResumeNext` will proceed to subscribing yet another
	 * Observable in provided series, no matter if previous Observable completed or ended with an error. This will
	 * be happening until there is no more Observables left in the series, at which point returned Observable will
	 * complete - even if the last subscribed stream ended with an error.
	 *
	 * `onErrorResumeNext` can be therefore thought of as version of {@link concat} operator, which is more permissive
	 * when it comes to the errors emitted by its input Observables. While `concat` subscribes to the next Observable
	 * in series only if previous one successfully completed, `onErrorResumeNext` subscribes even if it ended with
	 * an error.
	 *
	 * Note that you do not get any access to errors emitted by the Observables. In particular do not
	 * expect these errors to appear in error callback passed to {@link subscribe}. If you want to take
	 * specific actions based on what error was emitted by an Observable, you should try out {@link catch} instead.
	 *
	 *
	 * @example <caption>Subscribe to the next Observable after map fails</caption>
	 * Rx.Observable.of(1, 2, 3, 0)
	 *   .map(x => {
	 *       if (x === 0) { throw Error(); }
	         return 10 / x;
	 *   })
	 *   .onErrorResumeNext(Rx.Observable.of(1, 2, 3))
	 *   .subscribe(
	 *     val => console.log(val),
	 *     err => console.log(err),          // Will never be called.
	 *     () => console.log('that\'s it!')
	 *   );
	 *
	 * // Logs:
	 * // 10
	 * // 5
	 * // 3.3333333333333335
	 * // 1
	 * // 2
	 * // 3
	 * // "that's it!"
	 *
	 * @see {@link concat}
	 * @see {@link catch}
	 *
	 * @param {...ObservableInput} observables Observables passed either directly or as an array.
	 * @return {Observable} An Observable that emits values from source Observable, but - if it errors - subscribes
	 * to the next passed Observable and so on, until it completes or runs out of Observables.
	 * @method onErrorResumeNext
	 * @owner Observable
	 */
	function onErrorResumeNext$2() {
	    var nextSources = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        nextSources[_i] = arguments[_i];
	    }
	    return _operators.onErrorResumeNext.apply(void 0, nextSources)(this);
	}
	var onErrorResumeNext_2 = onErrorResumeNext$2;


	var onErrorResumeNext_1 = /*#__PURE__*/Object.defineProperty({
		onErrorResumeNext: onErrorResumeNext_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.onErrorResumeNext = onErrorResumeNext_1.onErrorResumeNext;

	/**
	 * Groups pairs of consecutive emissions together and emits them as an array of
	 * two values.
	 *
	 * <span class="informal">Puts the current value and previous value together as
	 * an array, and emits that.</span>
	 *
	 * <img src="./img/pairwise.png" width="100%">
	 *
	 * The Nth emission from the source Observable will cause the output Observable
	 * to emit an array [(N-1)th, Nth] of the previous and the current value, as a
	 * pair. For this reason, `pairwise` emits on the second and subsequent
	 * emissions from the source Observable, but not on the first emission, because
	 * there is no previous value in that case.
	 *
	 * @example <caption>On every click (starting from the second), emit the relative distance to the previous click</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var pairs = clicks.pairwise();
	 * var distance = pairs.map(pair => {
	 *   var x0 = pair[0].clientX;
	 *   var y0 = pair[0].clientY;
	 *   var x1 = pair[1].clientX;
	 *   var y1 = pair[1].clientY;
	 *   return Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
	 * });
	 * distance.subscribe(x => console.log(x));
	 *
	 * @see {@link buffer}
	 * @see {@link bufferCount}
	 *
	 * @return {Observable<Array<T>>} An Observable of pairs (as arrays) of
	 * consecutive values from the source Observable.
	 * @method pairwise
	 * @owner Observable
	 */
	function pairwise$1() {
	    return _operators.pairwise()(this);
	}
	var pairwise_2 = pairwise$1;


	var pairwise_1 = /*#__PURE__*/Object.defineProperty({
		pairwise: pairwise_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.pairwise = pairwise_1.pairwise;

	/**
	 * Splits the source Observable into two, one with values that satisfy a
	 * predicate, and another with values that don't satisfy the predicate.
	 *
	 * <span class="informal">It's like {@link filter}, but returns two Observables:
	 * one like the output of {@link filter}, and the other with values that did not
	 * pass the condition.</span>
	 *
	 * <img src="./img/partition.png" width="100%">
	 *
	 * `partition` outputs an array with two Observables that partition the values
	 * from the source Observable through the given `predicate` function. The first
	 * Observable in that array emits source values for which the predicate argument
	 * returns true. The second Observable emits source values for which the
	 * predicate returns false. The first behaves like {@link filter} and the second
	 * behaves like {@link filter} with the predicate negated.
	 *
	 * @example <caption>Partition click events into those on DIV elements and those elsewhere</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var parts = clicks.partition(ev => ev.target.tagName === 'DIV');
	 * var clicksOnDivs = parts[0];
	 * var clicksElsewhere = parts[1];
	 * clicksOnDivs.subscribe(x => console.log('DIV clicked: ', x));
	 * clicksElsewhere.subscribe(x => console.log('Other clicked: ', x));
	 *
	 * @see {@link filter}
	 *
	 * @param {function(value: T, index: number): boolean} predicate A function that
	 * evaluates each value emitted by the source Observable. If it returns `true`,
	 * the value is emitted on the first Observable in the returned array, if
	 * `false` the value is emitted on the second Observable in the array. The
	 * `index` parameter is the number `i` for the i-th source emission that has
	 * happened since the subscription, starting from the number `0`.
	 * @param {any} [thisArg] An optional argument to determine the value of `this`
	 * in the `predicate` function.
	 * @return {[Observable<T>, Observable<T>]} An array with two Observables: one
	 * with values that passed the predicate, and another with values that did not
	 * pass the predicate.
	 * @method partition
	 * @owner Observable
	 */
	function partition$2(predicate, thisArg) {
	    return _operators.partition(predicate, thisArg)(this);
	}
	var partition_2 = partition$2;


	var partition_1 = /*#__PURE__*/Object.defineProperty({
		partition: partition_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.partition = partition_1.partition;

	/**
	 * Maps each source value (an object) to its specified nested property.
	 *
	 * <span class="informal">Like {@link map}, but meant only for picking one of
	 * the nested properties of every emitted object.</span>
	 *
	 * <img src="./img/pluck.png" width="100%">
	 *
	 * Given a list of strings describing a path to an object property, retrieves
	 * the value of a specified nested property from all values in the source
	 * Observable. If a property can't be resolved, it will return `undefined` for
	 * that value.
	 *
	 * @example <caption>Map every click to the tagName of the clicked target element</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var tagNames = clicks.pluck('target', 'tagName');
	 * tagNames.subscribe(x => console.log(x));
	 *
	 * @see {@link map}
	 *
	 * @param {...string} properties The nested properties to pluck from each source
	 * value (an object).
	 * @return {Observable} A new Observable of property values from the source values.
	 * @method pluck
	 * @owner Observable
	 */
	function pluck$1() {
	    var properties = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        properties[_i] = arguments[_i];
	    }
	    return _operators.pluck.apply(void 0, properties)(this);
	}
	var pluck_2 = pluck$1;


	var pluck_1 = /*#__PURE__*/Object.defineProperty({
		pluck: pluck_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.pluck = pluck_1.pluck;

	/* tslint:enable:max-line-length */
	/**
	 * Returns a ConnectableObservable, which is a variety of Observable that waits until its connect method is called
	 * before it begins emitting items to those Observers that have subscribed to it.
	 *
	 * <img src="./img/publish.png" width="100%">
	 *
	 * @param {Function} [selector] - Optional selector function which can use the multicasted source sequence as many times
	 * as needed, without causing multiple subscriptions to the source sequence.
	 * Subscribers to the given source will receive all notifications of the source from the time of the subscription on.
	 * @return A ConnectableObservable that upon connection causes the source Observable to emit items to its Observers.
	 * @method publish
	 * @owner Observable
	 */
	function publish$1(selector) {
	    return _operators.publish(selector)(this);
	}
	var publish_2 = publish$1;


	var publish_1 = /*#__PURE__*/Object.defineProperty({
		publish: publish_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.publish = publish_1.publish;

	/**
	 * @param value
	 * @return {ConnectableObservable<T>}
	 * @method publishBehavior
	 * @owner Observable
	 */
	function publishBehavior$1(value) {
	    return _operators.publishBehavior(value)(this);
	}
	var publishBehavior_2 = publishBehavior$1;


	var publishBehavior_1 = /*#__PURE__*/Object.defineProperty({
		publishBehavior: publishBehavior_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.publishBehavior = publishBehavior_1.publishBehavior;

	/* tslint:enable:max-line-length */
	/**
	 * @param bufferSize
	 * @param windowTime
	 * @param selectorOrScheduler
	 * @param scheduler
	 * @return {Observable<T> | ConnectableObservable<T>}
	 * @method publishReplay
	 * @owner Observable
	 */
	function publishReplay$1(bufferSize, windowTime, selectorOrScheduler, scheduler) {
	    return _operators.publishReplay(bufferSize, windowTime, selectorOrScheduler, scheduler)(this);
	}
	var publishReplay_2 = publishReplay$1;


	var publishReplay_1 = /*#__PURE__*/Object.defineProperty({
		publishReplay: publishReplay_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.publishReplay = publishReplay_1.publishReplay;

	/**
	 * @return {ConnectableObservable<T>}
	 * @method publishLast
	 * @owner Observable
	 */
	function publishLast$1() {
	    //TODO(benlesh): correct type-flow through here.
	    return _operators.publishLast()(this);
	}
	var publishLast_2 = publishLast$1;


	var publishLast_1 = /*#__PURE__*/Object.defineProperty({
		publishLast: publishLast_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.publishLast = publishLast_1.publishLast;

	/* tslint:enable:max-line-length */
	/**
	 * Returns an Observable that mirrors the first source Observable to emit an item
	 * from the combination of this Observable and supplied Observables.
	 * @param {...Observables} ...observables Sources used to race for which Observable emits first.
	 * @return {Observable} An Observable that mirrors the output of the first Observable to emit an item.
	 * @method race
	 * @owner Observable
	 */
	function race$2() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    return _operators.race.apply(void 0, observables)(this);
	}
	var race_2 = race$2;


	var race_1 = /*#__PURE__*/Object.defineProperty({
		race: race_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.race = race_1.race;

	/* tslint:enable:max-line-length */
	/**
	 * Applies an accumulator function over the source Observable, and returns the
	 * accumulated result when the source completes, given an optional seed value.
	 *
	 * <span class="informal">Combines together all values emitted on the source,
	 * using an accumulator function that knows how to join a new source value into
	 * the accumulation from the past.</span>
	 *
	 * <img src="./img/reduce.png" width="100%">
	 *
	 * Like
	 * [Array.prototype.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce),
	 * `reduce` applies an `accumulator` function against an accumulation and each
	 * value of the source Observable (from the past) to reduce it to a single
	 * value, emitted on the output Observable. Note that `reduce` will only emit
	 * one value, only when the source Observable completes. It is equivalent to
	 * applying operator {@link scan} followed by operator {@link last}.
	 *
	 * Returns an Observable that applies a specified `accumulator` function to each
	 * item emitted by the source Observable. If a `seed` value is specified, then
	 * that value will be used as the initial value for the accumulator. If no seed
	 * value is specified, the first item of the source is used as the seed.
	 *
	 * @example <caption>Count the number of click events that happened in 5 seconds</caption>
	 * var clicksInFiveSeconds = Rx.Observable.fromEvent(document, 'click')
	 *   .takeUntil(Rx.Observable.interval(5000));
	 * var ones = clicksInFiveSeconds.mapTo(1);
	 * var seed = 0;
	 * var count = ones.reduce((acc, one) => acc + one, seed);
	 * count.subscribe(x => console.log(x));
	 *
	 * @see {@link count}
	 * @see {@link expand}
	 * @see {@link mergeScan}
	 * @see {@link scan}
	 *
	 * @param {function(acc: R, value: T, index: number): R} accumulator The accumulator function
	 * called on each source value.
	 * @param {R} [seed] The initial accumulation value.
	 * @return {Observable<R>} An Observable that emits a single value that is the
	 * result of accumulating the values emitted by the source Observable.
	 * @method reduce
	 * @owner Observable
	 */
	function reduce$1(accumulator, seed) {
	    // providing a seed of `undefined` *should* be valid and trigger
	    // hasSeed! so don't use `seed !== undefined` checks!
	    // For this reason, we have to check it here at the original call site
	    // otherwise inside Operator/Subscriber we won't know if `undefined`
	    // means they didn't provide anything or if they literally provided `undefined`
	    if (arguments.length >= 2) {
	        return _operators.reduce(accumulator, seed)(this);
	    }
	    return _operators.reduce(accumulator)(this);
	}
	var reduce_2 = reduce$1;


	var reduce_1 = /*#__PURE__*/Object.defineProperty({
		reduce: reduce_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.reduce = reduce_1.reduce;

	/**
	 * Returns an Observable that repeats the stream of items emitted by the source Observable at most count times.
	 *
	 * <img src="./img/repeat.png" width="100%">
	 *
	 * @param {number} [count] The number of times the source Observable items are repeated, a count of 0 will yield
	 * an empty Observable.
	 * @return {Observable} An Observable that repeats the stream of items emitted by the source Observable at most
	 * count times.
	 * @method repeat
	 * @owner Observable
	 */
	function repeat$1(count) {
	    if (count === void 0) { count = -1; }
	    return _operators.repeat(count)(this);
	}
	var repeat_2 = repeat$1;


	var repeat_1 = /*#__PURE__*/Object.defineProperty({
		repeat: repeat_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.repeat = repeat_1.repeat;

	/**
	 * Returns an Observable that mirrors the source Observable with the exception of a `complete`. If the source
	 * Observable calls `complete`, this method will emit to the Observable returned from `notifier`. If that Observable
	 * calls `complete` or `error`, then this method will call `complete` or `error` on the child subscription. Otherwise
	 * this method will resubscribe to the source Observable.
	 *
	 * <img src="./img/repeatWhen.png" width="100%">
	 *
	 * @param {function(notifications: Observable): Observable} notifier - Receives an Observable of notifications with
	 * which a user can `complete` or `error`, aborting the repetition.
	 * @return {Observable} The source Observable modified with repeat logic.
	 * @method repeatWhen
	 * @owner Observable
	 */
	function repeatWhen$1(notifier) {
	    return _operators.repeatWhen(notifier)(this);
	}
	var repeatWhen_2 = repeatWhen$1;


	var repeatWhen_1 = /*#__PURE__*/Object.defineProperty({
		repeatWhen: repeatWhen_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.repeatWhen = repeatWhen_1.repeatWhen;

	/**
	 * Returns an Observable that mirrors the source Observable with the exception of an `error`. If the source Observable
	 * calls `error`, this method will resubscribe to the source Observable for a maximum of `count` resubscriptions (given
	 * as a number parameter) rather than propagating the `error` call.
	 *
	 * <img src="./img/retry.png" width="100%">
	 *
	 * Any and all items emitted by the source Observable will be emitted by the resulting Observable, even those emitted
	 * during failed subscriptions. For example, if an Observable fails at first but emits [1, 2] then succeeds the second
	 * time and emits: [1, 2, 3, 4, 5] then the complete stream of emissions and notifications
	 * would be: [1, 2, 1, 2, 3, 4, 5, `complete`].
	 * @param {number} count - Number of retry attempts before failing.
	 * @return {Observable} The source Observable modified with the retry logic.
	 * @method retry
	 * @owner Observable
	 */
	function retry$1(count) {
	    if (count === void 0) { count = -1; }
	    return _operators.retry(count)(this);
	}
	var retry_2 = retry$1;


	var retry_1 = /*#__PURE__*/Object.defineProperty({
		retry: retry_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.retry = retry_1.retry;

	/**
	 * Returns an Observable that mirrors the source Observable with the exception of an `error`. If the source Observable
	 * calls `error`, this method will emit the Throwable that caused the error to the Observable returned from `notifier`.
	 * If that Observable calls `complete` or `error` then this method will call `complete` or `error` on the child
	 * subscription. Otherwise this method will resubscribe to the source Observable.
	 *
	 * <img src="./img/retryWhen.png" width="100%">
	 *
	 * @param {function(errors: Observable): Observable} notifier - Receives an Observable of notifications with which a
	 * user can `complete` or `error`, aborting the retry.
	 * @return {Observable} The source Observable modified with retry logic.
	 * @method retryWhen
	 * @owner Observable
	 */
	function retryWhen$1(notifier) {
	    return _operators.retryWhen(notifier)(this);
	}
	var retryWhen_2 = retryWhen$1;


	var retryWhen_1 = /*#__PURE__*/Object.defineProperty({
		retryWhen: retryWhen_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.retryWhen = retryWhen_1.retryWhen;

	/**
	 * Emits the most recently emitted value from the source Observable whenever
	 * another Observable, the `notifier`, emits.
	 *
	 * <span class="informal">It's like {@link sampleTime}, but samples whenever
	 * the `notifier` Observable emits something.</span>
	 *
	 * <img src="./img/sample.png" width="100%">
	 *
	 * Whenever the `notifier` Observable emits a value or completes, `sample`
	 * looks at the source Observable and emits whichever value it has most recently
	 * emitted since the previous sampling, unless the source has not emitted
	 * anything since the previous sampling. The `notifier` is subscribed to as soon
	 * as the output Observable is subscribed.
	 *
	 * @example <caption>On every click, sample the most recent "seconds" timer</caption>
	 * var seconds = Rx.Observable.interval(1000);
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = seconds.sample(clicks);
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link audit}
	 * @see {@link debounce}
	 * @see {@link sampleTime}
	 * @see {@link throttle}
	 *
	 * @param {Observable<any>} notifier The Observable to use for sampling the
	 * source Observable.
	 * @return {Observable<T>} An Observable that emits the results of sampling the
	 * values emitted by the source Observable whenever the notifier Observable
	 * emits value or completes.
	 * @method sample
	 * @owner Observable
	 */
	function sample$1(notifier) {
	    return _operators.sample(notifier)(this);
	}
	var sample_2 = sample$1;


	var sample_1 = /*#__PURE__*/Object.defineProperty({
		sample: sample_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.sample = sample_1.sample;

	/**
	 * Emits the most recently emitted value from the source Observable within
	 * periodic time intervals.
	 *
	 * <span class="informal">Samples the source Observable at periodic time
	 * intervals, emitting what it samples.</span>
	 *
	 * <img src="./img/sampleTime.png" width="100%">
	 *
	 * `sampleTime` periodically looks at the source Observable and emits whichever
	 * value it has most recently emitted since the previous sampling, unless the
	 * source has not emitted anything since the previous sampling. The sampling
	 * happens periodically in time every `period` milliseconds (or the time unit
	 * defined by the optional `scheduler` argument). The sampling starts as soon as
	 * the output Observable is subscribed.
	 *
	 * @example <caption>Every second, emit the most recent click at most once</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.sampleTime(1000);
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link auditTime}
	 * @see {@link debounceTime}
	 * @see {@link delay}
	 * @see {@link sample}
	 * @see {@link throttleTime}
	 *
	 * @param {number} period The sampling period expressed in milliseconds or the
	 * time unit determined internally by the optional `scheduler`.
	 * @param {Scheduler} [scheduler=asyncScheduler] The {@link SchedulerLike} to use for
	 * managing the timers that handle the sampling.
	 * @return {Observable<T>} An Observable that emits the results of sampling the
	 * values emitted by the source Observable at the specified time interval.
	 * @method sampleTime
	 * @owner Observable
	 */
	function sampleTime$1(period, scheduler) {
	    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
	    return _operators.sampleTime(period, scheduler)(this);
	}
	var sampleTime_2 = sampleTime$1;


	var sampleTime_1 = /*#__PURE__*/Object.defineProperty({
		sampleTime: sampleTime_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.sampleTime = sampleTime_1.sampleTime;

	/* tslint:enable:max-line-length */
	/**
	 * Applies an accumulator function over the source Observable, and returns each
	 * intermediate result, with an optional seed value.
	 *
	 * <span class="informal">It's like {@link reduce}, but emits the current
	 * accumulation whenever the source emits a value.</span>
	 *
	 * <img src="./img/scan.png" width="100%">
	 *
	 * Combines together all values emitted on the source, using an accumulator
	 * function that knows how to join a new source value into the accumulation from
	 * the past. Is similar to {@link reduce}, but emits the intermediate
	 * accumulations.
	 *
	 * Returns an Observable that applies a specified `accumulator` function to each
	 * item emitted by the source Observable. If a `seed` value is specified, then
	 * that value will be used as the initial value for the accumulator. If no seed
	 * value is specified, the first item of the source is used as the seed.
	 *
	 * @example <caption>Count the number of click events</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var ones = clicks.mapTo(1);
	 * var seed = 0;
	 * var count = ones.scan((acc, one) => acc + one, seed);
	 * count.subscribe(x => console.log(x));
	 *
	 * @see {@link expand}
	 * @see {@link mergeScan}
	 * @see {@link reduce}
	 *
	 * @param {function(acc: R, value: T, index: number): R} accumulator
	 * The accumulator function called on each source value.
	 * @param {T|R} [seed] The initial accumulation value.
	 * @return {Observable<R>} An observable of the accumulated values.
	 * @method scan
	 * @owner Observable
	 */
	function scan$1(accumulator, seed) {
	    if (arguments.length >= 2) {
	        return _operators.scan(accumulator, seed)(this);
	    }
	    return _operators.scan(accumulator)(this);
	}
	var scan_2 = scan$1;


	var scan_1 = /*#__PURE__*/Object.defineProperty({
		scan: scan_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.scan = scan_1.scan;

	/**
	 * Compares all values of two observables in sequence using an optional comparor function
	 * and returns an observable of a single boolean value representing whether or not the two sequences
	 * are equal.
	 *
	 * <span class="informal">Checks to see of all values emitted by both observables are equal, in order.</span>
	 *
	 * <img src="./img/sequenceEqual.png" width="100%">
	 *
	 * `sequenceEqual` subscribes to two observables and buffers incoming values from each observable. Whenever either
	 * observable emits a value, the value is buffered and the buffers are shifted and compared from the bottom
	 * up; If any value pair doesn't match, the returned observable will emit `false` and complete. If one of the
	 * observables completes, the operator will wait for the other observable to complete; If the other
	 * observable emits before completing, the returned observable will emit `false` and complete. If one observable never
	 * completes or emits after the other complets, the returned observable will never complete.
	 *
	 * @example <caption>figure out if the Konami code matches</caption>
	 * var code = Rx.Observable.from([
	 *  "ArrowUp",
	 *  "ArrowUp",
	 *  "ArrowDown",
	 *  "ArrowDown",
	 *  "ArrowLeft",
	 *  "ArrowRight",
	 *  "ArrowLeft",
	 *  "ArrowRight",
	 *  "KeyB",
	 *  "KeyA",
	 *  "Enter" // no start key, clearly.
	 * ]);
	 *
	 * var keys = Rx.Observable.fromEvent(document, 'keyup')
	 *  .map(e => e.code);
	 * var matches = keys.bufferCount(11, 1)
	 *  .mergeMap(
	 *    last11 =>
	 *      Rx.Observable.from(last11)
	 *        .sequenceEqual(code)
	 *   );
	 * matches.subscribe(matched => console.log('Successful cheat at Contra? ', matched));
	 *
	 * @see {@link combineLatest}
	 * @see {@link zip}
	 * @see {@link withLatestFrom}
	 *
	 * @param {Observable} compareTo The observable sequence to compare the source sequence to.
	 * @param {function} [comparor] An optional function to compare each value pair
	 * @return {Observable} An Observable of a single boolean value representing whether or not
	 * the values emitted by both observables were equal in sequence.
	 * @method sequenceEqual
	 * @owner Observable
	 */
	function sequenceEqual$1(compareTo, comparor) {
	    return _operators.sequenceEqual(compareTo, comparor)(this);
	}
	var sequenceEqual_2 = sequenceEqual$1;


	var sequenceEqual_1 = /*#__PURE__*/Object.defineProperty({
		sequenceEqual: sequenceEqual_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.sequenceEqual = sequenceEqual_1.sequenceEqual;

	/**
	 * Returns a new Observable that multicasts (shares) the original Observable. As long as there is at least one
	 * Subscriber this Observable will be subscribed and emitting data. When all subscribers have unsubscribed it will
	 * unsubscribe from the source Observable. Because the Observable is multicasting it makes the stream `hot`.
	 *
	 * This behaves similarly to .publish().refCount(), with a behavior difference when the source observable emits complete.
	 * .publish().refCount() will not resubscribe to the original source, however .share() will resubscribe to the original source.
	 * Observable.of("test").publish().refCount() will not re-emit "test" on new subscriptions, Observable.of("test").share() will
	 * re-emit "test" to new subscriptions.
	 *
	 * <img src="./img/share.png" width="100%">
	 *
	 * @return {Observable<T>} An Observable that upon connection causes the source Observable to emit items to its Observers.
	 * @method share
	 * @owner Observable
	 */
	function share$1() {
	    return _operators.share()(this);
	}
	var share_2 = share$1;


	var share_1 = /*#__PURE__*/Object.defineProperty({
		share: share_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.share = share_1.share;

	function shareReplay$1(configOrBufferSize, windowTime, scheduler) {
	    if (configOrBufferSize && typeof configOrBufferSize === 'object') {
	        return _operators.shareReplay(configOrBufferSize)(this);
	    }
	    return _operators.shareReplay(configOrBufferSize, windowTime, scheduler)(this);
	}
	var shareReplay_2 = shareReplay$1;


	var shareReplay_1 = /*#__PURE__*/Object.defineProperty({
		shareReplay: shareReplay_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.shareReplay = shareReplay_1.shareReplay;

	/**
	 * Returns an Observable that emits the single item emitted by the source Observable that matches a specified
	 * predicate, if that Observable emits one such item. If the source Observable emits more than one such item or no
	 * such items, notify of an IllegalArgumentException or NoSuchElementException respectively.
	 *
	 * <img src="./img/single.png" width="100%">
	 *
	 * @throws {EmptyError} Delivers an EmptyError to the Observer's `error`
	 * callback if the Observable completes before any `next` notification was sent.
	 * @param {Function} predicate - A predicate function to evaluate items emitted by the source Observable.
	 * @return {Observable<T>} An Observable that emits the single item emitted by the source Observable that matches
	 * the predicate.
	 .
	 * @method single
	 * @owner Observable
	 */
	function single$1(predicate) {
	    return _operators.single(predicate)(this);
	}
	var single_2 = single$1;


	var single_1 = /*#__PURE__*/Object.defineProperty({
		single: single_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.single = single_1.single;

	/**
	 * Returns an Observable that skips the first `count` items emitted by the source Observable.
	 *
	 * <img src="./img/skip.png" width="100%">
	 *
	 * @param {Number} count - The number of times, items emitted by source Observable should be skipped.
	 * @return {Observable} An Observable that skips values emitted by the source Observable.
	 *
	 * @method skip
	 * @owner Observable
	 */
	function skip$1(count) {
	    return _operators.skip(count)(this);
	}
	var skip_2 = skip$1;


	var skip_1 = /*#__PURE__*/Object.defineProperty({
		skip: skip_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.skip = skip_1.skip;

	/**
	 * Skip the last `count` values emitted by the source Observable.
	 *
	 * <img src="./img/skipLast.png" width="100%">
	 *
	 * `skipLast` returns an Observable that accumulates a queue with a length
	 * enough to store the first `count` values. As more values are received,
	 * values are taken from the front of the queue and produced on the result
	 * sequence. This causes values to be delayed.
	 *
	 * @example <caption>Skip the last 2 values of an Observable with many values</caption>
	 * var many = Rx.Observable.range(1, 5);
	 * var skipLastTwo = many.skipLast(2);
	 * skipLastTwo.subscribe(x => console.log(x));
	 *
	 * // Results in:
	 * // 1 2 3
	 *
	 * @see {@link skip}
	 * @see {@link skipUntil}
	 * @see {@link skipWhile}
	 * @see {@link take}
	 *
	 * @throws {ArgumentOutOfRangeError} When using `skipLast(i)`, it throws
	 * ArgumentOutOrRangeError if `i < 0`.
	 *
	 * @param {number} count Number of elements to skip from the end of the source Observable.
	 * @returns {Observable<T>} An Observable that skips the last count values
	 * emitted by the source Observable.
	 * @method skipLast
	 * @owner Observable
	 */
	function skipLast$1(count) {
	    return _operators.skipLast(count)(this);
	}
	var skipLast_2 = skipLast$1;


	var skipLast_1 = /*#__PURE__*/Object.defineProperty({
		skipLast: skipLast_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.skipLast = skipLast_1.skipLast;

	/**
	 * Returns an Observable that skips items emitted by the source Observable until a second Observable emits an item.
	 *
	 * <img src="./img/skipUntil.png" width="100%">
	 *
	 * @param {Observable} notifier - The second Observable that has to emit an item before the source Observable's elements begin to
	 * be mirrored by the resulting Observable.
	 * @return {Observable<T>} An Observable that skips items from the source Observable until the second Observable emits
	 * an item, then emits the remaining items.
	 * @method skipUntil
	 * @owner Observable
	 */
	function skipUntil$1(notifier) {
	    return _operators.skipUntil(notifier)(this);
	}
	var skipUntil_2 = skipUntil$1;


	var skipUntil_1 = /*#__PURE__*/Object.defineProperty({
		skipUntil: skipUntil_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.skipUntil = skipUntil_1.skipUntil;

	/**
	 * Returns an Observable that skips all items emitted by the source Observable as long as a specified condition holds
	 * true, but emits all further source items as soon as the condition becomes false.
	 *
	 * <img src="./img/skipWhile.png" width="100%">
	 *
	 * @param {Function} predicate - A function to test each item emitted from the source Observable.
	 * @return {Observable<T>} An Observable that begins emitting items emitted by the source Observable when the
	 * specified predicate becomes false.
	 * @method skipWhile
	 * @owner Observable
	 */
	function skipWhile$1(predicate) {
	    return _operators.skipWhile(predicate)(this);
	}
	var skipWhile_2 = skipWhile$1;


	var skipWhile_1 = /*#__PURE__*/Object.defineProperty({
		skipWhile: skipWhile_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.skipWhile = skipWhile_1.skipWhile;

	/* tslint:enable:max-line-length */
	/**
	 * Returns an Observable that emits the items you specify as arguments before it begins to emit
	 * items emitted by the source Observable.
	 *
	 * <img src="./img/startWith.png" width="100%">
	 *
	 * @param {...T} values - Items you want the modified Observable to emit first.
	 * @param {Scheduler} [scheduler] - A {@link IScheduler} to use for scheduling
	 * the emissions of the `next` notifications.
	 * @return {Observable} An Observable that emits the items in the specified Iterable and then emits the items
	 * emitted by the source Observable.
	 * @method startWith
	 * @owner Observable
	 */
	function startWith$1() {
	    var array = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        array[_i] = arguments[_i];
	    }
	    return _operators.startWith.apply(void 0, array)(this);
	}
	var startWith_2 = startWith$1;


	var startWith_1 = /*#__PURE__*/Object.defineProperty({
		startWith: startWith_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.startWith = startWith_1.startWith;

	/**
	 * Asynchronously subscribes Observers to this Observable on the specified IScheduler.
	 *
	 * <img src="./img/subscribeOn.png" width="100%">
	 *
	 * @param {Scheduler} scheduler - The IScheduler to perform subscription actions on.
	 * @return {Observable<T>} The source Observable modified so that its subscriptions happen on the specified IScheduler.
	 .
	 * @method subscribeOn
	 * @owner Observable
	 */
	function subscribeOn$1(scheduler, delay) {
	    if (delay === void 0) { delay = 0; }
	    return _operators.subscribeOn(scheduler, delay)(this);
	}
	var subscribeOn_2 = subscribeOn$1;


	var subscribeOn_1 = /*#__PURE__*/Object.defineProperty({
		subscribeOn: subscribeOn_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.subscribeOn = subscribeOn_1.subscribeOn;

	/**
	 * Converts a higher-order Observable into a first-order Observable by
	 * subscribing to only the most recently emitted of those inner Observables.
	 *
	 * <span class="informal">Flattens an Observable-of-Observables by dropping the
	 * previous inner Observable once a new one appears.</span>
	 *
	 * <img src="./img/switch.png" width="100%">
	 *
	 * `switch` subscribes to an Observable that emits Observables, also known as a
	 * higher-order Observable. Each time it observes one of these emitted inner
	 * Observables, the output Observable subscribes to the inner Observable and
	 * begins emitting the items emitted by that. So far, it behaves
	 * like {@link mergeAll}. However, when a new inner Observable is emitted,
	 * `switch` unsubscribes from the earlier-emitted inner Observable and
	 * subscribes to the new inner Observable and begins emitting items from it. It
	 * continues to behave like this for subsequent inner Observables.
	 *
	 * @example <caption>Rerun an interval Observable on every click event</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * // Each click event is mapped to an Observable that ticks every second
	 * var higherOrder = clicks.map((ev) => Rx.Observable.interval(1000));
	 * var switched = higherOrder.switch();
	 * // The outcome is that `switched` is essentially a timer that restarts
	 * // on every click. The interval Observables from older clicks do not merge
	 * // with the current interval Observable.
	 * switched.subscribe(x => console.log(x));
	 *
	 * @see {@link combineAll}
	 * @see {@link concatAll}
	 * @see {@link exhaust}
	 * @see {@link mergeAll}
	 * @see {@link switchMap}
	 * @see {@link switchMapTo}
	 * @see {@link zipAll}
	 *
	 * @return {Observable<T>} An Observable that emits the items emitted by the
	 * Observable most recently emitted by the source Observable.
	 * @method switch
	 * @name switch
	 * @owner Observable
	 */
	function _switch() {
	    return _operators.switchAll()(this);
	}
	var _switch_2 = _switch;


	var _switch_1 = /*#__PURE__*/Object.defineProperty({
		_switch: _switch_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.switch = _switch_1._switch;
	rxjs_1.Observable.prototype._switch = _switch_1._switch;

	/**
	 * Projects each source value to an Observable which is merged in the output
	 * Observable, emitting values only from the most recently projected Observable.
	 *
	 * <span class="informal">Maps each value to an Observable, then flattens all of
	 * these inner Observables using {@link switch}.</span>
	 *
	 * <img src="./img/switchMap.png" width="100%">
	 *
	 * Returns an Observable that emits items based on applying a function that you
	 * supply to each item emitted by the source Observable, where that function
	 * returns an (so-called "inner") Observable. Each time it observes one of these
	 * inner Observables, the output Observable begins emitting the items emitted by
	 * that inner Observable. When a new inner Observable is emitted, `switchMap`
	 * stops emitting items from the earlier-emitted inner Observable and begins
	 * emitting items from the new one. It continues to behave like this for
	 * subsequent inner Observables.
	 *
	 * @example <caption>Rerun an interval Observable on every click event</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.switchMap((ev) => Rx.Observable.interval(1000));
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link concatMap}
	 * @see {@link exhaustMap}
	 * @see {@link mergeMap}
	 * @see {@link switch}
	 * @see {@link switchMapTo}
	 *
	 * @param {function(value: T, ?index: number): ObservableInput} project A function
	 * that, when applied to an item emitted by the source Observable, returns an
	 * Observable.
	 * @return {Observable} An Observable that emits the result of applying the
	 * projection function (and the optional `resultSelector`) to each item emitted
	 * by the source Observable and taking only the values from the most recently
	 * projected inner Observable.
	 * @method switchMap
	 * @owner Observable
	 */
	function switchMap$1(project) {
	    return _operators.switchMap(project)(this);
	}
	var switchMap_2 = switchMap$1;


	var switchMap_1 = /*#__PURE__*/Object.defineProperty({
		switchMap: switchMap_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.switchMap = switchMap_1.switchMap;

	/* tslint:enable:max-line-length */
	/**
	 * Projects each source value to the same Observable which is flattened multiple
	 * times with {@link switch} in the output Observable.
	 *
	 * <span class="informal">It's like {@link switchMap}, but maps each value
	 * always to the same inner Observable.</span>
	 *
	 * <img src="./img/switchMapTo.png" width="100%">
	 *
	 * Maps each source value to the given Observable `innerObservable` regardless
	 * of the source value, and then flattens those resulting Observables into one
	 * single Observable, which is the output Observable. The output Observables
	 * emits values only from the most recently emitted instance of
	 * `innerObservable`.
	 *
	 * @example <caption>Rerun an interval Observable on every click event</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.switchMapTo(Rx.Observable.interval(1000));
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link concatMapTo}
	 * @see {@link switch}
	 * @see {@link switchMap}
	 * @see {@link mergeMapTo}
	 *
	 * @param {ObservableInput} innerObservable An Observable to replace each value from
	 * the source Observable.
	 * @return {Observable} An Observable that emits items from the given
	 * `innerObservable` (and optionally transformed through `resultSelector`) every
	 * time a value is emitted on the source Observable, and taking only the values
	 * from the most recently projected inner Observable.
	 * @method switchMapTo
	 * @owner Observable
	 */
	function switchMapTo$1(innerObservable) {
	    return _operators.switchMapTo(innerObservable)(this);
	}
	var switchMapTo_2 = switchMapTo$1;


	var switchMapTo_1 = /*#__PURE__*/Object.defineProperty({
		switchMapTo: switchMapTo_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.switchMapTo = switchMapTo_1.switchMapTo;

	/**
	 * Emits only the first `count` values emitted by the source Observable.
	 *
	 * <span class="informal">Takes the first `count` values from the source, then
	 * completes.</span>
	 *
	 * <img src="./img/take.png" width="100%">
	 *
	 * `take` returns an Observable that emits only the first `count` values emitted
	 * by the source Observable. If the source emits fewer than `count` values then
	 * all of its values are emitted. After that, it completes, regardless if the
	 * source completes.
	 *
	 * @example <caption>Take the first 5 seconds of an infinite 1-second interval Observable</caption>
	 * var interval = Rx.Observable.interval(1000);
	 * var five = interval.take(5);
	 * five.subscribe(x => console.log(x));
	 *
	 * @see {@link takeLast}
	 * @see {@link takeUntil}
	 * @see {@link takeWhile}
	 * @see {@link skip}
	 *
	 * @throws {ArgumentOutOfRangeError} When using `take(i)`, it delivers an
	 * ArgumentOutOrRangeError to the Observer's `error` callback if `i < 0`.
	 *
	 * @param {number} count The maximum number of `next` values to emit.
	 * @return {Observable<T>} An Observable that emits only the first `count`
	 * values emitted by the source Observable, or all of the values from the source
	 * if the source emits fewer than `count` values.
	 * @method take
	 * @owner Observable
	 */
	function take$1(count) {
	    return _operators.take(count)(this);
	}
	var take_2 = take$1;


	var take_1 = /*#__PURE__*/Object.defineProperty({
		take: take_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.take = take_1.take;

	/**
	 * Emits only the last `count` values emitted by the source Observable.
	 *
	 * <span class="informal">Remembers the latest `count` values, then emits those
	 * only when the source completes.</span>
	 *
	 * <img src="./img/takeLast.png" width="100%">
	 *
	 * `takeLast` returns an Observable that emits at most the last `count` values
	 * emitted by the source Observable. If the source emits fewer than `count`
	 * values then all of its values are emitted. This operator must wait until the
	 * `complete` notification emission from the source in order to emit the `next`
	 * values on the output Observable, because otherwise it is impossible to know
	 * whether or not more values will be emitted on the source. For this reason,
	 * all values are emitted synchronously, followed by the complete notification.
	 *
	 * @example <caption>Take the last 3 values of an Observable with many values</caption>
	 * var many = Rx.Observable.range(1, 100);
	 * var lastThree = many.takeLast(3);
	 * lastThree.subscribe(x => console.log(x));
	 *
	 * @see {@link take}
	 * @see {@link takeUntil}
	 * @see {@link takeWhile}
	 * @see {@link skip}
	 *
	 * @throws {ArgumentOutOfRangeError} When using `takeLast(i)`, it delivers an
	 * ArgumentOutOrRangeError to the Observer's `error` callback if `i < 0`.
	 *
	 * @param {number} count The maximum number of values to emit from the end of
	 * the sequence of values emitted by the source Observable.
	 * @return {Observable<T>} An Observable that emits at most the last count
	 * values emitted by the source Observable.
	 * @method takeLast
	 * @owner Observable
	 */
	function takeLast$1(count) {
	    return _operators.takeLast(count)(this);
	}
	var takeLast_2 = takeLast$1;


	var takeLast_1 = /*#__PURE__*/Object.defineProperty({
		takeLast: takeLast_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.takeLast = takeLast_1.takeLast;

	/**
	 * Emits the values emitted by the source Observable until a `notifier`
	 * Observable emits a value.
	 *
	 * <span class="informal">Lets values pass until a second Observable,
	 * `notifier`, emits a value. Then, it completes.</span>
	 *
	 * <img src="./img/takeUntil.png" width="100%">
	 *
	 * `takeUntil` subscribes and begins mirroring the source Observable. It also
	 * monitors a second Observable, `notifier` that you provide. If the `notifier`
	 * emits a value, the output Observable stops mirroring the source Observable
	 * and completes. If the `notifier` doesn't emit any value and completes
	 * then `takeUntil` will pass all values.
	 *
	 * @example <caption>Tick every second until the first click happens</caption>
	 * var interval = Rx.Observable.interval(1000);
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = interval.takeUntil(clicks);
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link take}
	 * @see {@link takeLast}
	 * @see {@link takeWhile}
	 * @see {@link skip}
	 *
	 * @param {Observable} notifier The Observable whose first emitted value will
	 * cause the output Observable of `takeUntil` to stop emitting values from the
	 * source Observable.
	 * @return {Observable<T>} An Observable that emits the values from the source
	 * Observable until such time as `notifier` emits its first value.
	 * @method takeUntil
	 * @owner Observable
	 */
	function takeUntil$1(notifier) {
	    return _operators.takeUntil(notifier)(this);
	}
	var takeUntil_2 = takeUntil$1;


	var takeUntil_1 = /*#__PURE__*/Object.defineProperty({
		takeUntil: takeUntil_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.takeUntil = takeUntil_1.takeUntil;

	/**
	 * Emits values emitted by the source Observable so long as each value satisfies
	 * the given `predicate`, and then completes as soon as this `predicate` is not
	 * satisfied.
	 *
	 * <span class="informal">Takes values from the source only while they pass the
	 * condition given. When the first value does not satisfy, it completes.</span>
	 *
	 * <img src="./img/takeWhile.png" width="100%">
	 *
	 * `takeWhile` subscribes and begins mirroring the source Observable. Each value
	 * emitted on the source is given to the `predicate` function which returns a
	 * boolean, representing a condition to be satisfied by the source values. The
	 * output Observable emits the source values until such time as the `predicate`
	 * returns false, at which point `takeWhile` stops mirroring the source
	 * Observable and completes the output Observable.
	 *
	 * @example <caption>Emit click events only while the clientX property is greater than 200</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.takeWhile(ev => ev.clientX > 200);
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link take}
	 * @see {@link takeLast}
	 * @see {@link takeUntil}
	 * @see {@link skip}
	 *
	 * @param {function(value: T, index: number): boolean} predicate A function that
	 * evaluates a value emitted by the source Observable and returns a boolean.
	 * Also takes the (zero-based) index as the second argument.
	 * @return {Observable<T>} An Observable that emits the values from the source
	 * Observable so long as each value satisfies the condition defined by the
	 * `predicate`, then completes.
	 * @method takeWhile
	 * @owner Observable
	 */
	function takeWhile$1(predicate) {
	    return _operators.takeWhile(predicate)(this);
	}
	var takeWhile_2 = takeWhile$1;


	var takeWhile_1 = /*#__PURE__*/Object.defineProperty({
		takeWhile: takeWhile_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.takeWhile = takeWhile_1.takeWhile;

	/**
	 * Emits a value from the source Observable, then ignores subsequent source
	 * values for a duration determined by another Observable, then repeats this
	 * process.
	 *
	 * <span class="informal">It's like {@link throttleTime}, but the silencing
	 * duration is determined by a second Observable.</span>
	 *
	 * <img src="./img/throttle.png" width="100%">
	 *
	 * `throttle` emits the source Observable values on the output Observable
	 * when its internal timer is disabled, and ignores source values when the timer
	 * is enabled. Initially, the timer is disabled. As soon as the first source
	 * value arrives, it is forwarded to the output Observable, and then the timer
	 * is enabled by calling the `durationSelector` function with the source value,
	 * which returns the "duration" Observable. When the duration Observable emits a
	 * value or completes, the timer is disabled, and this process repeats for the
	 * next source value.
	 *
	 * @example <caption>Emit clicks at a rate of at most one click per second</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.throttle(ev => Rx.Observable.interval(1000));
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link audit}
	 * @see {@link debounce}
	 * @see {@link delayWhen}
	 * @see {@link sample}
	 * @see {@link throttleTime}
	 *
	 * @param {function(value: T): SubscribableOrPromise} durationSelector A function
	 * that receives a value from the source Observable, for computing the silencing
	 * duration for each source value, returned as an Observable or a Promise.
	 * @param {Object} config a configuration object to define `leading` and `trailing` behavior. Defaults
	 * to `{ leading: true, trailing: false }`.
	 * @return {Observable<T>} An Observable that performs the throttle operation to
	 * limit the rate of emissions from the source.
	 * @method throttle
	 * @owner Observable
	 */
	function throttle$1(durationSelector, config) {
	    if (config === void 0) { config = internal_compatibility_1.defaultThrottleConfig; }
	    return _operators.throttle(durationSelector, config)(this);
	}
	var throttle_2 = throttle$1;


	var throttle_1 = /*#__PURE__*/Object.defineProperty({
		throttle: throttle_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.throttle = throttle_1.throttle;

	/**
	 * Emits a value from the source Observable, then ignores subsequent source
	 * values for `duration` milliseconds, then repeats this process.
	 *
	 * <span class="informal">Lets a value pass, then ignores source values for the
	 * next `duration` milliseconds.</span>
	 *
	 * <img src="./img/throttleTime.png" width="100%">
	 *
	 * `throttleTime` emits the source Observable values on the output Observable
	 * when its internal timer is disabled, and ignores source values when the timer
	 * is enabled. Initially, the timer is disabled. As soon as the first source
	 * value arrives, it is forwarded to the output Observable, and then the timer
	 * is enabled. After `duration` milliseconds (or the time unit determined
	 * internally by the optional `scheduler`) has passed, the timer is disabled,
	 * and this process repeats for the next source value. Optionally takes a
	 * {@link IScheduler} for managing timers.
	 *
	 * @example <caption>Emit clicks at a rate of at most one click per second</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.throttleTime(1000);
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link auditTime}
	 * @see {@link debounceTime}
	 * @see {@link delay}
	 * @see {@link sampleTime}
	 * @see {@link throttle}
	 *
	 * @param {number} duration Time to wait before emitting another value after
	 * emitting the last value, measured in milliseconds or the time unit determined
	 * internally by the optional `scheduler`.
	 * @param {Scheduler} [scheduler=asyncScheduler] The {@link SchedulerLike} to use for
	 * managing the timers that handle the throttling.
	 * @return {Observable<T>} An Observable that performs the throttle operation to
	 * limit the rate of emissions from the source.
	 * @method throttleTime
	 * @owner Observable
	 */
	function throttleTime$1(duration, scheduler, config) {
	    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
	    if (config === void 0) { config = internal_compatibility_1.defaultThrottleConfig; }
	    return _operators.throttleTime(duration, scheduler, config)(this);
	}
	var throttleTime_2 = throttleTime$1;


	var throttleTime_1 = /*#__PURE__*/Object.defineProperty({
		throttleTime: throttleTime_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.throttleTime = throttleTime_1.throttleTime;

	/**
	 * @param scheduler
	 * @return {Observable<TimeInterval<any>>|WebSocketSubject<T>|Observable<T>}
	 * @method timeInterval
	 * @owner Observable
	 */
	function timeInterval$1(scheduler) {
	    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
	    return _operators.timeInterval(scheduler)(this);
	}
	var timeInterval_2 = timeInterval$1;


	var timeInterval_1 = /*#__PURE__*/Object.defineProperty({
		timeInterval: timeInterval_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.timeInterval = timeInterval_1.timeInterval;

	/**
	 *
	 * Errors if Observable does not emit a value in given time span.
	 *
	 * <span class="informal">Timeouts on Observable that doesn't emit values fast enough.</span>
	 *
	 * <img src="./img/timeout.png" width="100%">
	 *
	 * `timeout` operator accepts as an argument either a number or a Date.
	 *
	 * If number was provided, it returns an Observable that behaves like a source
	 * Observable, unless there is a period of time where there is no value emitted.
	 * So if you provide `100` as argument and first value comes after 50ms from
	 * the moment of subscription, this value will be simply re-emitted by the resulting
	 * Observable. If however after that 100ms passes without a second value being emitted,
	 * stream will end with an error and source Observable will be unsubscribed.
	 * These checks are performed throughout whole lifecycle of Observable - from the moment
	 * it was subscribed to, until it completes or errors itself. Thus every value must be
	 * emitted within specified period since previous value.
	 *
	 * If provided argument was Date, returned Observable behaves differently. It throws
	 * if Observable did not complete before provided Date. This means that periods between
	 * emission of particular values do not matter in this case. If Observable did not complete
	 * before provided Date, source Observable will be unsubscribed. Other than that, resulting
	 * stream behaves just as source Observable.
	 *
	 * `timeout` accepts also a Scheduler as a second parameter. It is used to schedule moment (or moments)
	 * when returned Observable will check if source stream emitted value or completed.
	 *
	 * @example <caption>Check if ticks are emitted within certain timespan</caption>
	 * const seconds = Rx.Observable.interval(1000);
	 *
	 * seconds.timeout(1100) // Let's use bigger timespan to be safe,
	 *                       // since `interval` might fire a bit later then scheduled.
	 * .subscribe(
	 *     value => console.log(value), // Will emit numbers just as regular `interval` would.
	 *     err => console.log(err) // Will never be called.
	 * );
	 *
	 * seconds.timeout(900).subscribe(
	 *     value => console.log(value), // Will never be called.
	 *     err => console.log(err) // Will emit error before even first value is emitted,
	 *                             // since it did not arrive within 900ms period.
	 * );
	 *
	 * @example <caption>Use Date to check if Observable completed</caption>
	 * const seconds = Rx.Observable.interval(1000);
	 *
	 * seconds.timeout(new Date("December 17, 2020 03:24:00"))
	 * .subscribe(
	 *     value => console.log(value), // Will emit values as regular `interval` would
	 *                                  // until December 17, 2020 at 03:24:00.
	 *     err => console.log(err) // On December 17, 2020 at 03:24:00 it will emit an error,
	 *                             // since Observable did not complete by then.
	 * );
	 *
	 * @see {@link timeoutWith}
	 *
	 * @param {number|Date} due Number specifying period within which Observable must emit values
	 *                          or Date specifying before when Observable should complete
	 * @param {Scheduler} [scheduler] Scheduler controlling when timeout checks occur.
	 * @return {Observable<T>} Observable that mirrors behaviour of source, unless timeout checks fail.
	 * @method timeout
	 * @owner Observable
	 */
	function timeout$1(due, scheduler) {
	    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
	    return _operators.timeout(due, scheduler)(this);
	}
	var timeout_2 = timeout$1;


	var timeout_1 = /*#__PURE__*/Object.defineProperty({
		timeout: timeout_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.timeout = timeout_1.timeout;

	/* tslint:enable:max-line-length */
	/**
	 *
	 * Errors if Observable does not emit a value in given time span, in case of which
	 * subscribes to the second Observable.
	 *
	 * <span class="informal">It's a version of `timeout` operator that let's you specify fallback Observable.</span>
	 *
	 * <img src="./img/timeoutWith.png" width="100%">
	 *
	 * `timeoutWith` is a variation of `timeout` operator. It behaves exactly the same,
	 * still accepting as a first argument either a number or a Date, which control - respectively -
	 * when values of source Observable should be emitted or when it should complete.
	 *
	 * The only difference is that it accepts a second, required parameter. This parameter
	 * should be an Observable which will be subscribed when source Observable fails any timeout check.
	 * So whenever regular `timeout` would emit an error, `timeoutWith` will instead start re-emitting
	 * values from second Observable. Note that this fallback Observable is not checked for timeouts
	 * itself, so it can emit values and complete at arbitrary points in time. From the moment of a second
	 * subscription, Observable returned from `timeoutWith` simply mirrors fallback stream. When that
	 * stream completes, it completes as well.
	 *
	 * Scheduler, which in case of `timeout` is provided as as second argument, can be still provided
	 * here - as a third, optional parameter. It still is used to schedule timeout checks and -
	 * as a consequence - when second Observable will be subscribed, since subscription happens
	 * immediately after failing check.
	 *
	 * @example <caption>Add fallback observable</caption>
	 * const seconds = Rx.Observable.interval(1000);
	 * const minutes = Rx.Observable.interval(60 * 1000);
	 *
	 * seconds.timeoutWith(900, minutes)
	 *     .subscribe(
	 *         value => console.log(value), // After 900ms, will start emitting `minutes`,
	 *                                      // since first value of `seconds` will not arrive fast enough.
	 *         err => console.log(err) // Would be called after 900ms in case of `timeout`,
	 *                                 // but here will never be called.
	 *     );
	 *
	 * @param {number|Date} due Number specifying period within which Observable must emit values
	 *                          or Date specifying before when Observable should complete
	 * @param {Observable<T>} withObservable Observable which will be subscribed if source fails timeout check.
	 * @param {Scheduler} [scheduler] Scheduler controlling when timeout checks occur.
	 * @return {Observable<T>} Observable that mirrors behaviour of source or, when timeout check fails, of an Observable
	 *                          passed as a second parameter.
	 * @method timeoutWith
	 * @owner Observable
	 */
	function timeoutWith$1(due, withObservable, scheduler) {
	    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
	    return _operators.timeoutWith(due, withObservable, scheduler)(this);
	}
	var timeoutWith_2 = timeoutWith$1;


	var timeoutWith_1 = /*#__PURE__*/Object.defineProperty({
		timeoutWith: timeoutWith_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.timeoutWith = timeoutWith_1.timeoutWith;

	/**
	 * @param scheduler
	 * @return {Observable<Timestamp<any>>|WebSocketSubject<T>|Observable<T>}
	 * @method timestamp
	 * @owner Observable
	 */
	function timestamp$1(scheduler) {
	    if (scheduler === void 0) { scheduler = rxjs_1.asyncScheduler; }
	    return _operators.timestamp(scheduler)(this);
	}
	var timestamp_2 = timestamp$1;


	var timestamp_1 = /*#__PURE__*/Object.defineProperty({
		timestamp: timestamp_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.timestamp = timestamp_1.timestamp;

	/**
	 * Collects all source emissions and emits them as an array when the source completes.
	 *
	 * <span class="informal">Get all values inside an array when the source completes</span>
	 *
	 * <img src="./img/toArray.png" width="100%">
	 *
	 * `toArray` will wait until the source Observable completes
	 * before emitting the array containing all emissions.
	 * When the source Observable errors no array will be emitted.
	 *
	 * @example <caption>Create array from input</caption>
	 * const input = Rx.Observable.interval(100).take(4);
	 *
	 * input.toArray()
	 *   .subscribe(arr => console.log(arr)); // [0,1,2,3]
	 *
	 * @see {@link buffer}
	 *
	 * @return {Observable<any[]>|WebSocketSubject<T>|Observable<T>}
	 * @method toArray
	 * @owner Observable
	 */
	function toArray$1() {
	    return _operators.toArray()(this);
	}
	var toArray_2 = toArray$1;


	var toArray_1 = /*#__PURE__*/Object.defineProperty({
		toArray: toArray_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.toArray = toArray_1.toArray;

	/**
	 * Branch out the source Observable values as a nested Observable whenever
	 * `windowBoundaries` emits.
	 *
	 * <span class="informal">It's like {@link buffer}, but emits a nested Observable
	 * instead of an array.</span>
	 *
	 * <img src="./img/window.png" width="100%">
	 *
	 * Returns an Observable that emits windows of items it collects from the source
	 * Observable. The output Observable emits connected, non-overlapping
	 * windows. It emits the current window and opens a new one whenever the
	 * Observable `windowBoundaries` emits an item. Because each window is an
	 * Observable, the output is a higher-order Observable.
	 *
	 * @example <caption>In every window of 1 second each, emit at most 2 click events</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var interval = Rx.Observable.interval(1000);
	 * var result = clicks.window(interval)
	 *   .map(win => win.take(2)) // each window has at most 2 emissions
	 *   .mergeAll(); // flatten the Observable-of-Observables
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link windowCount}
	 * @see {@link windowTime}
	 * @see {@link windowToggle}
	 * @see {@link windowWhen}
	 * @see {@link buffer}
	 *
	 * @param {Observable<any>} windowBoundaries An Observable that completes the
	 * previous window and starts a new window.
	 * @return {Observable<Observable<T>>} An Observable of windows, which are
	 * Observables emitting values of the source Observable.
	 * @method window
	 * @owner Observable
	 */
	function window$2(windowBoundaries) {
	    return _operators.window(windowBoundaries)(this);
	}
	var window_2 = window$2;


	var window_1 = /*#__PURE__*/Object.defineProperty({
		window: window_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.window = window_1.window;

	/**
	 * Branch out the source Observable values as a nested Observable with each
	 * nested Observable emitting at most `windowSize` values.
	 *
	 * <span class="informal">It's like {@link bufferCount}, but emits a nested
	 * Observable instead of an array.</span>
	 *
	 * <img src="./img/windowCount.png" width="100%">
	 *
	 * Returns an Observable that emits windows of items it collects from the source
	 * Observable. The output Observable emits windows every `startWindowEvery`
	 * items, each containing no more than `windowSize` items. When the source
	 * Observable completes or encounters an error, the output Observable emits
	 * the current window and propagates the notification from the source
	 * Observable. If `startWindowEvery` is not provided, then new windows are
	 * started immediately at the start of the source and when each window completes
	 * with size `windowSize`.
	 *
	 * @example <caption>Ignore every 3rd click event, starting from the first one</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.windowCount(3)
	 *   .map(win => win.skip(1)) // skip first of every 3 clicks
	 *   .mergeAll(); // flatten the Observable-of-Observables
	 * result.subscribe(x => console.log(x));
	 *
	 * @example <caption>Ignore every 3rd click event, starting from the third one</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks.windowCount(2, 3)
	 *   .mergeAll(); // flatten the Observable-of-Observables
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link window}
	 * @see {@link windowTime}
	 * @see {@link windowToggle}
	 * @see {@link windowWhen}
	 * @see {@link bufferCount}
	 *
	 * @param {number} windowSize The maximum number of values emitted by each
	 * window.
	 * @param {number} [startWindowEvery] Interval at which to start a new window.
	 * For example if `startWindowEvery` is `2`, then a new window will be started
	 * on every other value from the source. A new window is started at the
	 * beginning of the source by default.
	 * @return {Observable<Observable<T>>} An Observable of windows, which in turn
	 * are Observable of values.
	 * @method windowCount
	 * @owner Observable
	 */
	function windowCount$1(windowSize, startWindowEvery) {
	    if (startWindowEvery === void 0) { startWindowEvery = 0; }
	    return _operators.windowCount(windowSize, startWindowEvery)(this);
	}
	var windowCount_2 = windowCount$1;


	var windowCount_1 = /*#__PURE__*/Object.defineProperty({
		windowCount: windowCount_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.windowCount = windowCount_1.windowCount;

	function windowTime$1(windowTimeSpan) {
	    var scheduler = rxjs_1.asyncScheduler;
	    var windowCreationInterval = null;
	    var maxWindowSize = Number.POSITIVE_INFINITY;
	    if (internal_compatibility_1.isScheduler(arguments[3])) {
	        scheduler = arguments[3];
	    }
	    if (internal_compatibility_1.isScheduler(arguments[2])) {
	        scheduler = arguments[2];
	    }
	    else if (internal_compatibility_1.isNumeric(arguments[2])) {
	        maxWindowSize = Number(arguments[2]);
	    }
	    if (internal_compatibility_1.isScheduler(arguments[1])) {
	        scheduler = arguments[1];
	    }
	    else if (internal_compatibility_1.isNumeric(arguments[1])) {
	        windowCreationInterval = Number(arguments[1]);
	    }
	    return _operators.windowTime(windowTimeSpan, windowCreationInterval, maxWindowSize, scheduler)(this);
	}
	var windowTime_2 = windowTime$1;


	var windowTime_1 = /*#__PURE__*/Object.defineProperty({
		windowTime: windowTime_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.windowTime = windowTime_1.windowTime;

	/**
	 * Branch out the source Observable values as a nested Observable starting from
	 * an emission from `openings` and ending when the output of `closingSelector`
	 * emits.
	 *
	 * <span class="informal">It's like {@link bufferToggle}, but emits a nested
	 * Observable instead of an array.</span>
	 *
	 * <img src="./img/windowToggle.png" width="100%">
	 *
	 * Returns an Observable that emits windows of items it collects from the source
	 * Observable. The output Observable emits windows that contain those items
	 * emitted by the source Observable between the time when the `openings`
	 * Observable emits an item and when the Observable returned by
	 * `closingSelector` emits an item.
	 *
	 * @example <caption>Every other second, emit the click events from the next 500ms</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var openings = Rx.Observable.interval(1000);
	 * var result = clicks.windowToggle(openings, i =>
	 *   i % 2 ? Rx.Observable.interval(500) : Rx.Observable.empty()
	 * ).mergeAll();
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link window}
	 * @see {@link windowCount}
	 * @see {@link windowTime}
	 * @see {@link windowWhen}
	 * @see {@link bufferToggle}
	 *
	 * @param {Observable<O>} openings An observable of notifications to start new
	 * windows.
	 * @param {function(value: O): Observable} closingSelector A function that takes
	 * the value emitted by the `openings` observable and returns an Observable,
	 * which, when it emits (either `next` or `complete`), signals that the
	 * associated window should complete.
	 * @return {Observable<Observable<T>>} An observable of windows, which in turn
	 * are Observables.
	 * @method windowToggle
	 * @owner Observable
	 */
	function windowToggle$1(openings, closingSelector) {
	    return _operators.windowToggle(openings, closingSelector)(this);
	}
	var windowToggle_2 = windowToggle$1;


	var windowToggle_1 = /*#__PURE__*/Object.defineProperty({
		windowToggle: windowToggle_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.windowToggle = windowToggle_1.windowToggle;

	/**
	 * Branch out the source Observable values as a nested Observable using a
	 * factory function of closing Observables to determine when to start a new
	 * window.
	 *
	 * <span class="informal">It's like {@link bufferWhen}, but emits a nested
	 * Observable instead of an array.</span>
	 *
	 * <img src="./img/windowWhen.png" width="100%">
	 *
	 * Returns an Observable that emits windows of items it collects from the source
	 * Observable. The output Observable emits connected, non-overlapping windows.
	 * It emits the current window and opens a new one whenever the Observable
	 * produced by the specified `closingSelector` function emits an item. The first
	 * window is opened immediately when subscribing to the output Observable.
	 *
	 * @example <caption>Emit only the first two clicks events in every window of [1-5] random seconds</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var result = clicks
	 *   .windowWhen(() => Rx.Observable.interval(1000 + Math.random() * 4000))
	 *   .map(win => win.take(2)) // each window has at most 2 emissions
	 *   .mergeAll(); // flatten the Observable-of-Observables
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link window}
	 * @see {@link windowCount}
	 * @see {@link windowTime}
	 * @see {@link windowToggle}
	 * @see {@link bufferWhen}
	 *
	 * @param {function(): Observable} closingSelector A function that takes no
	 * arguments and returns an Observable that signals (on either `next` or
	 * `complete`) when to close the previous window and start a new one.
	 * @return {Observable<Observable<T>>} An observable of windows, which in turn
	 * are Observables.
	 * @method windowWhen
	 * @owner Observable
	 */
	function windowWhen$1(closingSelector) {
	    return _operators.windowWhen(closingSelector)(this);
	}
	var windowWhen_2 = windowWhen$1;


	var windowWhen_1 = /*#__PURE__*/Object.defineProperty({
		windowWhen: windowWhen_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.windowWhen = windowWhen_1.windowWhen;

	/* tslint:enable:max-line-length */
	/**
	 * Combines the source Observable with other Observables to create an Observable
	 * whose values are calculated from the latest values of each, only when the
	 * source emits.
	 *
	 * <span class="informal">Whenever the source Observable emits a value, it
	 * computes a formula using that value plus the latest values from other input
	 * Observables, then emits the output of that formula.</span>
	 *
	 * <img src="./img/withLatestFrom.png" width="100%">
	 *
	 * `withLatestFrom` combines each value from the source Observable (the
	 * instance) with the latest values from the other input Observables only when
	 * the source emits a value, optionally using a `project` function to determine
	 * the value to be emitted on the output Observable. All input Observables must
	 * emit at least one value before the output Observable will emit a value.
	 *
	 * @example <caption>On every click event, emit an array with the latest timer event plus the click event</caption>
	 * var clicks = Rx.Observable.fromEvent(document, 'click');
	 * var timer = Rx.Observable.interval(1000);
	 * var result = clicks.withLatestFrom(timer);
	 * result.subscribe(x => console.log(x));
	 *
	 * @see {@link combineLatest}
	 *
	 * @param {ObservableInput} other An input Observable to combine with the source
	 * Observable. More than one input Observables may be given as argument.
	 * @param {Function} [project] Projection function for combining values
	 * together. Receives all values in order of the Observables passed, where the
	 * first parameter is a value from the source Observable. (e.g.
	 * `a.withLatestFrom(b, c, (a1, b1, c1) => a1 + b1 + c1)`). If this is not
	 * passed, arrays will be emitted on the output Observable.
	 * @return {Observable} An Observable of projected values from the most recent
	 * values from each input Observable, or an array of the most recent values from
	 * each input Observable.
	 * @method withLatestFrom
	 * @owner Observable
	 */
	function withLatestFrom$1() {
	    var args = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        args[_i] = arguments[_i];
	    }
	    return _operators.withLatestFrom.apply(void 0, args)(this);
	}
	var withLatestFrom_2 = withLatestFrom$1;


	var withLatestFrom_1 = /*#__PURE__*/Object.defineProperty({
		withLatestFrom: withLatestFrom_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.withLatestFrom = withLatestFrom_1.withLatestFrom;

	/* tslint:enable:max-line-length */
	/**
	 * @param observables
	 * @return {Observable<R>}
	 * @method zip
	 * @owner Observable
	 */
	function zipProto() {
	    var observables = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        observables[_i] = arguments[_i];
	    }
	    return this.lift.call(rxjs_1.zip.apply(void 0, [this].concat(observables)));
	}
	var zipProto_1 = zipProto;


	var zip$2 = /*#__PURE__*/Object.defineProperty({
		zipProto: zipProto_1
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.zip = zip$2.zipProto;

	/**
	 * @param project
	 * @return {Observable<R>|WebSocketSubject<T>|Observable<T>}
	 * @method zipAll
	 * @owner Observable
	 */
	function zipAll$1(project) {
	    return _operators.zipAll(project)(this);
	}
	var zipAll_2 = zipAll$1;


	var zipAll_1 = /*#__PURE__*/Object.defineProperty({
		zipAll: zipAll_2
	}, '__esModule', {value: true});

	rxjs_1.Observable.prototype.zipAll = zipAll_1.zipAll;

	var SubscriptionLog = /*@__PURE__*/ (function () {
	    function SubscriptionLog(subscribedFrame, unsubscribedFrame) {
	        if (unsubscribedFrame === void 0) {
	            unsubscribedFrame = Number.POSITIVE_INFINITY;
	        }
	        this.subscribedFrame = subscribedFrame;
	        this.unsubscribedFrame = unsubscribedFrame;
	    }
	    return SubscriptionLog;
	}());

	/** PURE_IMPORTS_START tslib,_Observable,_Subscription,_SubscriptionLoggable,_util_applyMixins PURE_IMPORTS_END */
	var ColdObservable = /*@__PURE__*/ (function (_super) {
	    __extends(ColdObservable, _super);
	    function ColdObservable(messages, scheduler) {
	        var _this = _super.call(this, function (subscriber) {
	            var observable = this;
	            var index = observable.logSubscribedFrame();
	            var subscription = new Subscription();
	            subscription.add(new Subscription(function () {
	                observable.logUnsubscribedFrame(index);
	            }));
	            observable.scheduleMessages(subscriber);
	            return subscription;
	        }) || this;
	        _this.messages = messages;
	        _this.subscriptions = [];
	        _this.scheduler = scheduler;
	        return _this;
	    }
	    ColdObservable.prototype.scheduleMessages = function (subscriber) {
	        var messagesLength = this.messages.length;
	        for (var i = 0; i < messagesLength; i++) {
	            var message = this.messages[i];
	            subscriber.add(this.scheduler.schedule(function (_a) {
	                var message = _a.message, subscriber = _a.subscriber;
	                message.notification.observe(subscriber);
	            }, message.frame, { message: message, subscriber: subscriber }));
	        }
	    };
	    return ColdObservable;
	}(Observable));

	/** PURE_IMPORTS_START tslib,_Subject,_Subscription,_SubscriptionLoggable,_util_applyMixins PURE_IMPORTS_END */
	var HotObservable = /*@__PURE__*/ (function (_super) {
	    __extends(HotObservable, _super);
	    function HotObservable(messages, scheduler) {
	        var _this = _super.call(this) || this;
	        _this.messages = messages;
	        _this.subscriptions = [];
	        _this.scheduler = scheduler;
	        return _this;
	    }
	    HotObservable.prototype._subscribe = function (subscriber) {
	        var subject = this;
	        var index = subject.logSubscribedFrame();
	        var subscription = new Subscription();
	        subscription.add(new Subscription(function () {
	            subject.logUnsubscribedFrame(index);
	        }));
	        subscription.add(_super.prototype._subscribe.call(this, subscriber));
	        return subscription;
	    };
	    HotObservable.prototype.setup = function () {
	        var subject = this;
	        var messagesLength = subject.messages.length;
	        for (var i = 0; i < messagesLength; i++) {
	            (function () {
	                var message = subject.messages[i];
	                subject.scheduler.schedule(function () { message.notification.observe(subject); }, message.frame);
	            })();
	        }
	    };
	    return HotObservable;
	}(Subject));

	/** PURE_IMPORTS_START tslib,_Observable,_Notification,_ColdObservable,_HotObservable,_SubscriptionLog,_scheduler_VirtualTimeScheduler,_scheduler_AsyncScheduler PURE_IMPORTS_END */
	var defaultMaxFrame = 750;
	var TestScheduler = /*@__PURE__*/ (function (_super) {
	    __extends(TestScheduler, _super);
	    function TestScheduler(assertDeepEqual) {
	        var _this = _super.call(this, VirtualAction, defaultMaxFrame) || this;
	        _this.assertDeepEqual = assertDeepEqual;
	        _this.hotObservables = [];
	        _this.coldObservables = [];
	        _this.flushTests = [];
	        _this.runMode = false;
	        return _this;
	    }
	    TestScheduler.prototype.createTime = function (marbles) {
	        var indexOf = marbles.indexOf('|');
	        if (indexOf === -1) {
	            throw new Error('marble diagram for time should have a completion marker "|"');
	        }
	        return indexOf * TestScheduler.frameTimeFactor;
	    };
	    TestScheduler.prototype.createColdObservable = function (marbles, values, error) {
	        if (marbles.indexOf('^') !== -1) {
	            throw new Error('cold observable cannot have subscription offset "^"');
	        }
	        if (marbles.indexOf('!') !== -1) {
	            throw new Error('cold observable cannot have unsubscription marker "!"');
	        }
	        var messages = TestScheduler.parseMarbles(marbles, values, error, undefined, this.runMode);
	        var cold = new ColdObservable(messages, this);
	        this.coldObservables.push(cold);
	        return cold;
	    };
	    TestScheduler.prototype.createHotObservable = function (marbles, values, error) {
	        if (marbles.indexOf('!') !== -1) {
	            throw new Error('hot observable cannot have unsubscription marker "!"');
	        }
	        var messages = TestScheduler.parseMarbles(marbles, values, error, undefined, this.runMode);
	        var subject = new HotObservable(messages, this);
	        this.hotObservables.push(subject);
	        return subject;
	    };
	    TestScheduler.prototype.materializeInnerObservable = function (observable, outerFrame) {
	        var _this = this;
	        var messages = [];
	        observable.subscribe(function (value) {
	            messages.push({ frame: _this.frame - outerFrame, notification: Notification.createNext(value) });
	        }, function (err) {
	            messages.push({ frame: _this.frame - outerFrame, notification: Notification.createError(err) });
	        }, function () {
	            messages.push({ frame: _this.frame - outerFrame, notification: Notification.createComplete() });
	        });
	        return messages;
	    };
	    TestScheduler.prototype.expectObservable = function (observable, subscriptionMarbles) {
	        var _this = this;
	        if (subscriptionMarbles === void 0) {
	            subscriptionMarbles = null;
	        }
	        var actual = [];
	        var flushTest = { actual: actual, ready: false };
	        var subscriptionParsed = TestScheduler.parseMarblesAsSubscriptions(subscriptionMarbles, this.runMode);
	        var subscriptionFrame = subscriptionParsed.subscribedFrame === Number.POSITIVE_INFINITY ?
	            0 : subscriptionParsed.subscribedFrame;
	        var unsubscriptionFrame = subscriptionParsed.unsubscribedFrame;
	        var subscription;
	        this.schedule(function () {
	            subscription = observable.subscribe(function (x) {
	                var value = x;
	                if (x instanceof Observable) {
	                    value = _this.materializeInnerObservable(value, _this.frame);
	                }
	                actual.push({ frame: _this.frame, notification: Notification.createNext(value) });
	            }, function (err) {
	                actual.push({ frame: _this.frame, notification: Notification.createError(err) });
	            }, function () {
	                actual.push({ frame: _this.frame, notification: Notification.createComplete() });
	            });
	        }, subscriptionFrame);
	        if (unsubscriptionFrame !== Number.POSITIVE_INFINITY) {
	            this.schedule(function () { return subscription.unsubscribe(); }, unsubscriptionFrame);
	        }
	        this.flushTests.push(flushTest);
	        var runMode = this.runMode;
	        return {
	            toBe: function (marbles, values, errorValue) {
	                flushTest.ready = true;
	                flushTest.expected = TestScheduler.parseMarbles(marbles, values, errorValue, true, runMode);
	            }
	        };
	    };
	    TestScheduler.prototype.expectSubscriptions = function (actualSubscriptionLogs) {
	        var flushTest = { actual: actualSubscriptionLogs, ready: false };
	        this.flushTests.push(flushTest);
	        var runMode = this.runMode;
	        return {
	            toBe: function (marbles) {
	                var marblesArray = (typeof marbles === 'string') ? [marbles] : marbles;
	                flushTest.ready = true;
	                flushTest.expected = marblesArray.map(function (marbles) {
	                    return TestScheduler.parseMarblesAsSubscriptions(marbles, runMode);
	                });
	            }
	        };
	    };
	    TestScheduler.prototype.flush = function () {
	        var _this = this;
	        var hotObservables = this.hotObservables;
	        while (hotObservables.length > 0) {
	            hotObservables.shift().setup();
	        }
	        _super.prototype.flush.call(this);
	        this.flushTests = this.flushTests.filter(function (test) {
	            if (test.ready) {
	                _this.assertDeepEqual(test.actual, test.expected);
	                return false;
	            }
	            return true;
	        });
	    };
	    TestScheduler.parseMarblesAsSubscriptions = function (marbles, runMode) {
	        var _this = this;
	        if (runMode === void 0) {
	            runMode = false;
	        }
	        if (typeof marbles !== 'string') {
	            return new SubscriptionLog(Number.POSITIVE_INFINITY);
	        }
	        var len = marbles.length;
	        var groupStart = -1;
	        var subscriptionFrame = Number.POSITIVE_INFINITY;
	        var unsubscriptionFrame = Number.POSITIVE_INFINITY;
	        var frame = 0;
	        var _loop_1 = function (i) {
	            var nextFrame = frame;
	            var advanceFrameBy = function (count) {
	                nextFrame += count * _this.frameTimeFactor;
	            };
	            var c = marbles[i];
	            switch (c) {
	                case ' ':
	                    if (!runMode) {
	                        advanceFrameBy(1);
	                    }
	                    break;
	                case '-':
	                    advanceFrameBy(1);
	                    break;
	                case '(':
	                    groupStart = frame;
	                    advanceFrameBy(1);
	                    break;
	                case ')':
	                    groupStart = -1;
	                    advanceFrameBy(1);
	                    break;
	                case '^':
	                    if (subscriptionFrame !== Number.POSITIVE_INFINITY) {
	                        throw new Error('found a second subscription point \'^\' in a ' +
	                            'subscription marble diagram. There can only be one.');
	                    }
	                    subscriptionFrame = groupStart > -1 ? groupStart : frame;
	                    advanceFrameBy(1);
	                    break;
	                case '!':
	                    if (unsubscriptionFrame !== Number.POSITIVE_INFINITY) {
	                        throw new Error('found a second subscription point \'^\' in a ' +
	                            'subscription marble diagram. There can only be one.');
	                    }
	                    unsubscriptionFrame = groupStart > -1 ? groupStart : frame;
	                    break;
	                default:
	                    if (runMode && c.match(/^[0-9]$/)) {
	                        if (i === 0 || marbles[i - 1] === ' ') {
	                            var buffer = marbles.slice(i);
	                            var match = buffer.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /);
	                            if (match) {
	                                i += match[0].length - 1;
	                                var duration = parseFloat(match[1]);
	                                var unit = match[2];
	                                var durationInMs = void 0;
	                                switch (unit) {
	                                    case 'ms':
	                                        durationInMs = duration;
	                                        break;
	                                    case 's':
	                                        durationInMs = duration * 1000;
	                                        break;
	                                    case 'm':
	                                        durationInMs = duration * 1000 * 60;
	                                        break;
	                                }
	                                advanceFrameBy(durationInMs / this_1.frameTimeFactor);
	                                break;
	                            }
	                        }
	                    }
	                    throw new Error('there can only be \'^\' and \'!\' markers in a ' +
	                        'subscription marble diagram. Found instead \'' + c + '\'.');
	            }
	            frame = nextFrame;
	            out_i_1 = i;
	        };
	        var this_1 = this, out_i_1;
	        for (var i = 0; i < len; i++) {
	            _loop_1(i);
	            i = out_i_1;
	        }
	        if (unsubscriptionFrame < 0) {
	            return new SubscriptionLog(subscriptionFrame);
	        }
	        else {
	            return new SubscriptionLog(subscriptionFrame, unsubscriptionFrame);
	        }
	    };
	    TestScheduler.parseMarbles = function (marbles, values, errorValue, materializeInnerObservables, runMode) {
	        var _this = this;
	        if (materializeInnerObservables === void 0) {
	            materializeInnerObservables = false;
	        }
	        if (runMode === void 0) {
	            runMode = false;
	        }
	        if (marbles.indexOf('!') !== -1) {
	            throw new Error('conventional marble diagrams cannot have the ' +
	                'unsubscription marker "!"');
	        }
	        var len = marbles.length;
	        var testMessages = [];
	        var subIndex = runMode ? marbles.replace(/^[ ]+/, '').indexOf('^') : marbles.indexOf('^');
	        var frame = subIndex === -1 ? 0 : (subIndex * -this.frameTimeFactor);
	        var getValue = typeof values !== 'object' ?
	            function (x) { return x; } :
	            function (x) {
	                if (materializeInnerObservables && values[x] instanceof ColdObservable) {
	                    return values[x].messages;
	                }
	                return values[x];
	            };
	        var groupStart = -1;
	        var _loop_2 = function (i) {
	            var nextFrame = frame;
	            var advanceFrameBy = function (count) {
	                nextFrame += count * _this.frameTimeFactor;
	            };
	            var notification = void 0;
	            var c = marbles[i];
	            switch (c) {
	                case ' ':
	                    if (!runMode) {
	                        advanceFrameBy(1);
	                    }
	                    break;
	                case '-':
	                    advanceFrameBy(1);
	                    break;
	                case '(':
	                    groupStart = frame;
	                    advanceFrameBy(1);
	                    break;
	                case ')':
	                    groupStart = -1;
	                    advanceFrameBy(1);
	                    break;
	                case '|':
	                    notification = Notification.createComplete();
	                    advanceFrameBy(1);
	                    break;
	                case '^':
	                    advanceFrameBy(1);
	                    break;
	                case '#':
	                    notification = Notification.createError(errorValue || 'error');
	                    advanceFrameBy(1);
	                    break;
	                default:
	                    if (runMode && c.match(/^[0-9]$/)) {
	                        if (i === 0 || marbles[i - 1] === ' ') {
	                            var buffer = marbles.slice(i);
	                            var match = buffer.match(/^([0-9]+(?:\.[0-9]+)?)(ms|s|m) /);
	                            if (match) {
	                                i += match[0].length - 1;
	                                var duration = parseFloat(match[1]);
	                                var unit = match[2];
	                                var durationInMs = void 0;
	                                switch (unit) {
	                                    case 'ms':
	                                        durationInMs = duration;
	                                        break;
	                                    case 's':
	                                        durationInMs = duration * 1000;
	                                        break;
	                                    case 'm':
	                                        durationInMs = duration * 1000 * 60;
	                                        break;
	                                }
	                                advanceFrameBy(durationInMs / this_2.frameTimeFactor);
	                                break;
	                            }
	                        }
	                    }
	                    notification = Notification.createNext(getValue(c));
	                    advanceFrameBy(1);
	                    break;
	            }
	            if (notification) {
	                testMessages.push({ frame: groupStart > -1 ? groupStart : frame, notification: notification });
	            }
	            frame = nextFrame;
	            out_i_2 = i;
	        };
	        var this_2 = this, out_i_2;
	        for (var i = 0; i < len; i++) {
	            _loop_2(i);
	            i = out_i_2;
	        }
	        return testMessages;
	    };
	    TestScheduler.prototype.run = function (callback) {
	        var prevFrameTimeFactor = TestScheduler.frameTimeFactor;
	        var prevMaxFrames = this.maxFrames;
	        TestScheduler.frameTimeFactor = 1;
	        this.maxFrames = Number.POSITIVE_INFINITY;
	        this.runMode = true;
	        AsyncScheduler.delegate = this;
	        var helpers = {
	            cold: this.createColdObservable.bind(this),
	            hot: this.createHotObservable.bind(this),
	            flush: this.flush.bind(this),
	            expectObservable: this.expectObservable.bind(this),
	            expectSubscriptions: this.expectSubscriptions.bind(this),
	        };
	        try {
	            var ret = callback(helpers);
	            this.flush();
	            return ret;
	        }
	        finally {
	            TestScheduler.frameTimeFactor = prevFrameTimeFactor;
	            this.maxFrames = prevMaxFrames;
	            this.runMode = false;
	            AsyncScheduler.delegate = undefined;
	        }
	    };
	    return TestScheduler;
	}(VirtualTimeScheduler));

	/** PURE_IMPORTS_START  PURE_IMPORTS_END */

	var testing = /*#__PURE__*/Object.freeze({
		__proto__: null,
		TestScheduler: TestScheduler
	});

	var testing_1 = /*@__PURE__*/getAugmentedNamespace(testing);

	/* tslint:disable:no-unused-variable */
	// Subject imported before Observable to bypass circular dependency issue since
	// Subject extends Observable and Observable references Subject in it's
	// definition

	var Observable$1 = rxjs_1.Observable;
	var Subject$1 = rxjs_1.Subject;

	var AnonymousSubject$1 = internal_compatibility_1.AnonymousSubject;
	/* tslint:enable:no-unused-variable */
	var internal_compatibility_2 = internal_compatibility_1;
	var config$1 = internal_compatibility_2.config;
	// statics
	/* tslint:disable:no-use-before-declare */

























	//dom


	//internal/operators






































































































	/* tslint:disable:no-unused-variable */
	var rxjs_2 = rxjs_1;
	var Subscription$1 = rxjs_2.Subscription;
	var ReplaySubject$1 = rxjs_2.ReplaySubject;
	var BehaviorSubject$1 = rxjs_2.BehaviorSubject;
	var Notification$1 = rxjs_2.Notification;
	var EmptyError$1 = rxjs_2.EmptyError;
	var ArgumentOutOfRangeError$1 = rxjs_2.ArgumentOutOfRangeError;
	var ObjectUnsubscribedError$1 = rxjs_2.ObjectUnsubscribedError;
	var UnsubscriptionError$1 = rxjs_2.UnsubscriptionError;
	var pipe$1 = rxjs_2.pipe;

	var TestScheduler$1 = testing_1.TestScheduler;
	var rxjs_3 = rxjs_1;
	var Subscriber$1 = rxjs_3.Subscriber;
	var AsyncSubject$1 = rxjs_3.AsyncSubject;
	var ConnectableObservable$1 = rxjs_3.ConnectableObservable;
	var TimeoutError$1 = rxjs_3.TimeoutError;
	var VirtualTimeScheduler$1 = rxjs_3.VirtualTimeScheduler;

	var AjaxResponse$1 = ajax_1.AjaxResponse;
	var AjaxError$1 = ajax_1.AjaxError;
	var AjaxTimeoutError$1 = ajax_1.AjaxTimeoutError;
	var rxjs_4 = rxjs_1;
	var internal_compatibility_3 = internal_compatibility_1;
	var internal_compatibility_4 = internal_compatibility_1;
	var TimeInterval$1 = internal_compatibility_4.TimeInterval;
	var Timestamp$1 = internal_compatibility_4.Timestamp;

	var operators$1 = _operators;
	/* tslint:enable:no-unused-variable */
	/**
	 * @typedef {Object} Rx.Scheduler
	 * @property {Scheduler} queue Schedules on a queue in the current event frame
	 * (trampoline scheduler). Use this for iteration operations.
	 * @property {Scheduler} asap Schedules on the micro task queue, which is the same
	 * queue used for promises. Basically after the current job, but before the next
	 * job. Use this for asynchronous conversions.
	 * @property {Scheduler} async Schedules work with `setInterval`. Use this for
	 * time-based operations.
	 * @property {Scheduler} animationFrame Schedules work with `requestAnimationFrame`.
	 * Use this for synchronizing with the platform's painting
	 */
	var Scheduler$1 = {
	    asap: rxjs_4.asapScheduler,
	    queue: rxjs_4.queueScheduler,
	    animationFrame: rxjs_4.animationFrameScheduler,
	    async: rxjs_4.asyncScheduler
	};
	var Scheduler_1 = Scheduler$1;
	/**
	 * @typedef {Object} Rx.Symbol
	 * @property {Symbol|string} rxSubscriber A symbol to use as a property name to
	 * retrieve an "Rx safe" Observer from an object. "Rx safety" can be defined as
	 * an object that has all of the traits of an Rx Subscriber, including the
	 * ability to add and remove subscriptions to the subscription chain and
	 * guarantees involving event triggering (can't "next" after unsubscription,
	 * etc).
	 * @property {Symbol|string} observable A symbol to use as a property name to
	 * retrieve an Observable as defined by the [ECMAScript "Observable" spec](https://github.com/zenparsing/es-observable).
	 * @property {Symbol|string} iterator The ES6 symbol to use as a property name
	 * to retrieve an iterator from an object.
	 */
	var Symbol$1 = {
	    rxSubscriber: internal_compatibility_3.rxSubscriber,
	    observable: internal_compatibility_3.observable,
	    iterator: internal_compatibility_3.iterator
	};
	var _Symbol = Symbol$1;


	var Rx = /*#__PURE__*/Object.defineProperty({
		Observable: Observable$1,
		Subject: Subject$1,
		AnonymousSubject: AnonymousSubject$1,
		config: config$1,
		Subscription: Subscription$1,
		ReplaySubject: ReplaySubject$1,
		BehaviorSubject: BehaviorSubject$1,
		Notification: Notification$1,
		EmptyError: EmptyError$1,
		ArgumentOutOfRangeError: ArgumentOutOfRangeError$1,
		ObjectUnsubscribedError: ObjectUnsubscribedError$1,
		UnsubscriptionError: UnsubscriptionError$1,
		pipe: pipe$1,
		TestScheduler: TestScheduler$1,
		Subscriber: Subscriber$1,
		AsyncSubject: AsyncSubject$1,
		ConnectableObservable: ConnectableObservable$1,
		TimeoutError: TimeoutError$1,
		VirtualTimeScheduler: VirtualTimeScheduler$1,
		AjaxResponse: AjaxResponse$1,
		AjaxError: AjaxError$1,
		AjaxTimeoutError: AjaxTimeoutError$1,
		TimeInterval: TimeInterval$1,
		Timestamp: Timestamp$1,
		operators: operators$1,
		Scheduler: Scheduler_1,
		Symbol: _Symbol
	}, '__esModule', {value: true});

	var Rx$1 = createCommonjsModule(function (module, exports) {
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	__export(Rx);

	});

	/* ############################################################################
	The MIT License (MIT)

	Copyright (c) 2019 Van Schroeder
	Copyright (c) 2019 Webfreshener, LLC

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	############################################################################ */

	const _observers = new WeakMap();

	class TxBehaviorSubject {
	    /**
	     * @constructor
	     */
	    constructor() {
	        _observers.set(this, {
	            onNext: new Rx$1.BehaviorSubject(null).skip(1),
	            onError: new Rx$1.BehaviorSubject(null).skip(1),
	            onComplete: new Rx$1.BehaviorSubject(null).skip(1),
	        });
	    }

	    /**
	     * Creates BehaviorSubjects
	     * @returns {TxBehaviorSubject}
	     */
	    static create() {
	        return new TxBehaviorSubject();
	    }

	    /**
	     * Calls next on Next Subject
	     */
	    next(value) {
	        const _o = _observers.get(this);
	        if (_o !== null) {
	            _o.onNext.next(value);
	        }
	    }

	    /**
	     * Calls next on Error Subject
	     * @param error
	     */
	    error(error) {
	        const _o = _observers.get(this);
	        if (_o !== null) {
	            _o.onError.next(error);
	        }
	    }

	    /**
	     * Calls next on Complete Subject
	     */
	    complete() {
	        const _o = _observers.get(this);
	        if (_o !== null) {
	            _o.onComplete.next();
	            // calls complete on all Subjects
	            Object.keys(_o).forEach(_ => _o[_].complete());
	        }
	    }

	    /**
	     * Subscribes handler method to property observer
	     * @param handler
	     * @returns {object|boolean}
	     */
	    subscribe(handler) {
	        const _o = _observers.get(this);
	        // references to subscriptions for Observable
	        const _subRefs = [];

	        // creates an extensible object to hold our unsubscribe method
	        // and adds unsubscribe calls to the Proto object
	        const _subs = class { };

	        if ((typeof handler) === "function") {
	            // if is raw function, we pass straight in as `next`
	            _subRefs.push(_o.onNext.subscribe(handler));
	        } else {
	            // inits observer handlers if defined on passed `func` object
	            [
	                {call: "onNext", func: "next"},
	                {call: "onError", func: "error"},
	                {call: "onComplete", func: "complete"},
	            ].forEach((obs) => {
	                // use of braces is due to unreliability of `hasOwnProperty`
	                if (handler[obs.func]) {
	                    // if the notification type handler is present, subscribe to it
	                    _subRefs.push(_o[obs.call].subscribe(handler[obs.func]));
	                }
	            });
	        }

	        // adds unsubscribe to the Proto object
	        _subs.prototype.unsubscribe = () => {
	            _subRefs.forEach((sub) => sub.unsubscribe());
	        };

	        return new _subs();
	    }
	}

	var TxArgs = {
	    $id: "http://schemas.webfreshener.com/v1/tx-args#",
	    $schema: "http://json-schema.org/draft-07/schema#",
	    definitions: {
	        Config: {
	            $id: "#/definitions/Config",
	            type: "object",
	            allOf: [{
	                required: ["schemas"],
	                additionalProperties: false,
	                type: "object",
	                properties: {
	                    schemas: {
	                        $ref: "#/definitions/Schemas",
	                    },
	                    meta: {
	                        $ref: "#/definitions/Schemas",
	                    },
	                    use: {
	                        type: "string",
	                    },
	                },
	            }]
	        },
	        Schemas: {
	            $id: "#/definitions/Schemas",
	            type: "array",
	            items: {
	                allOf: [
	                    {
	                        type: "object"
	                    }, {
	                        $ref: "#/definitions/Schema",
	                    }
	                ]

	            },
	            minItems: 1,
	            maxItems: 2,
	        },
	        Schema: {
	            $id: "#/definitions/Schema",
	            type: "object",
	            properties: {
	                $id: {
	                    type: "string",
	                },
	                $schema: {
	                    type: "string",
	                },
	                type: {
	                    type: ["string", "array"],
	                },
	                exec: {
	                    not: {},
	                },
	                execute: {
	                    not: {},
	                },
	                iterate: {
	                    not: {},
	                },
	                loop: {
	                    not: {},
	                },
	                schemas: {
	                    not: {},
	                },
	                meta: {
	                    not: {},
	                },
	                use: {
	                    not: {},
	                },
	            },
	        },
	    },
	    anyOf: [
	        {$ref: "#/definitions/Config"},
	        {$ref: "#/definitions/Schema"},
	        {$ref: "#/definitions/Schemas"},
	    ],
	};

	var DefaultVOSchema = {
	    $id: "http://schemas.webfreshener.com/v1/default-vo#",
	    $schema: "http://json-schema.org/draft-07/schema#",
	    oneOf: [
	        {
	            type: "object",
	        },
	        {
	            type: "array",
	        },
	        {
	            type: "string",
	        },
	        {
	            type: "boolean",
	        },
	        {
	            type: "number",
	        },
	    ]
	};

	/* ############################################################################
	The MIT License (MIT)

	Copyright (c) 2019 Van Schroeder
	Copyright (c) 2019 Webfreshener, LLC

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	############################################################################ */
	const _models = new WeakMap();
	const _validators$1 = new WeakMap();
	const _observers$1 = new WeakMap();

	const argsValidator = new AjvWrapper({schemas: [TxArgs]});

	class TxValidator {
	    /**
	     *
	     * @param schemas
	     * @returns {boolean}
	     */
	    static validateSchemas(schemas) {
	        if (schemas["schema"]) {
	            if (typeof schemas.schema === "string") {
	                return argsValidator.exec(TxArgs.$id, schemas);
	            }
	            return false;
	        }
	        if (schemas["schemas"]) {
	            return argsValidator.exec(TxArgs.$id, schemas.schemas);
	        }

	        return argsValidator.exec(TxArgs.$id, schemas);
	    }

	    /**
	     *
	     * @param schemasOrConfig
	     * @returns {Object|null|*|undefined}
	     */
	    static deriveSchema(schemasOrConfig) {
	        if ((typeof schemasOrConfig) === "object" && !schemasOrConfig.schemas) {
	            return schemasOrConfig;
	        }

	        if (schemasOrConfig.use) {
	            return schemasOrConfig.schemas.find((_) => _.$id === schemasOrConfig.use).schema;
	        }

	        return schemasOrConfig.schemas.length ? schemasOrConfig.schemas[schemasOrConfig.schemas.length - 1] : null;
	    }

	    /**
	     * Accepts one `json-schema` or `tx-config` per instance and an (optional) Ajv config
	     * @param schemaOrConfig
	     * @param options (optional)
	     */
	    constructor(schemaOrConfig, options) {
	        if (!schemaOrConfig) {
	            throw "Schema or Schema Config required";
	        }
	        if (!TxValidator.validateSchemas(schemaOrConfig)) {
	            throw `Unable to process schema: ${JSON.stringify(argsValidator.$ajv.errors)}`;
	        }

	        if (!schemaOrConfig["schemas"]) {
	            schemaOrConfig = {
	                schemas: Array.isArray(schemaOrConfig) ? schemaOrConfig : [schemaOrConfig],
	            };
	        }

	        Object.defineProperty(this, "schema", {
	            value: TxValidator.deriveSchema(schemaOrConfig) || {schemas:[DefaultVOSchema]},
	            enumerable: true,
	        });

	        const _baseSchema = schemaOrConfig.schemas[schemaOrConfig.schemas.length - 1] || DefaultVOSchema;

	        // this is just a quick guess at our default data type (object|array)
	        _models.set(this, _baseSchema.hasOwnProperty("items") ? [] : {});

	        _observers$1.set(this, new TxBehaviorSubject());

	        _validators$1.set(this, new AjvWrapper(schemaOrConfig, options || {}));
	    }

	    /**
	     * Applies Object.freeze to model and triggers complete notification for pipe
	     * @returns {TxValidator}
	     */
	    freeze() {
	        _models.set(this, Object.freeze(_models.get(this)));
	        _observers$1.get(this).complete();
	        return this;
	    }

	    /**
	     * Getter for Object.isFrozen status of this node and it's ancestors
	     * @returns {boolean}
	     */
	    get isFrozen() {
	        return Object.isFrozen(_models.get(this));
	    }

	    /**
	     * Getter for validation errors incurred from model setter
	     * @returns {*}
	     */
	    get errors() {
	        return _validators$1.get(this).$ajv.errors;
	    }

	    /**
	     * Registers notification handler to observable
	     * @param handler
	     * @returns {*}
	     */
	    subscribe(handler) {
	        return _observers$1.get(this).subscribe(handler);
	    }

	    /**
	     * Performs schema validation of value
	     * @param value
	     */
	    validate(value) {
	        const $id = AjvWrapper.getSchemaID(this.schema[0] || this.schema);
	        const __ = _validators$1.get(this).exec($id, value);
	        if (this.errors) {
	            _observers$1.get(this).error({
	                error: this.errors,
	                data: value,
	            });
	        }
	        return __;
	    }

	    /**
	     * Setter for validator data value
	     * @param data
	     */
	    set model(data) {
	        if (this.isFrozen) {
	            return;
	        }

	        const _t = this.validate(data);
	        if (_t === true) {
	            _models.set(this, data);
	            _observers$1.get(this).next(data);
	        } else {
	            if (_t === false) {
	                _observers$1.get(this).error({
	                    error: this.errors,
	                    data: data,
	                });
	            } else {
	                _observers$1.get(this).error({
	                    error: _t,
	                    data: data,
	                });
	            }
	        }
	    }

	    /**
	     * Getter for validator data value
	     * @returns {{}|[]}
	     */
	    get model() {
	        const _d = _models.get(this);
	        return Array.isArray(_d) ? [..._d] : Object.assign({}, _d);
	    }

	    /**
	     * Provides model value as JSON
	     * @returns {{}|*[]}
	     */
	    toJSON() {
	        return this.model;
	    }

	    /**
	     * Overrides toString. Provides model value as String
	     * @returns {string}
	     */
	    toString() {
	        return JSON.stringify(this.model);
	    }

	    /**
	     * Overrides valueOf. Provides model value as JSON
	     * @returns {{}|*[]}
	     */
	    valueOf() {
	        return this.model;
	    }
	}

	const _iterators = new WeakMap();
	const _pipes = new WeakMap();

	class TxIterator {
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
	            throw {
	                error: {
	                    message: "iterators accept iterable values only"
	                },
	                data: records,
	            }
	        }

	        let _res = [];
	        records.forEach(
	            (__) => {
	                const _it = _pipes.get(this).txYield(__);
	                let _done = false;
	                let _value = __;
	                while (!_done) {
	                    try {
	                        let {done, value} = _it.next(_value);
	                        if (!(_done = done)) {
	                            _value = value;
	                        }
	                    } catch (e) {
	                        _value = void 0;
	                    }
	                }

	                if (_value !== void 0) {
	                    _res[_res.length] = _value;
	                }
	            });

	        return _res;
	    }
	}

	/* ############################################################################
	The MIT License (MIT)

	Copyright (c) 2019 Van Schroeder
	Copyright (c) 2019 Webfreshener, LLC

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	############################################################################ */

	/**
	 * provides default schema and pass through execution
	 * @type {{schema: {$schema: string, $id: string}, exec: (function(*): *)}}
	 */
	const DefaultPipeTx = {
	    schema: DefaultVOSchema,
	    exec: (d) => d,
	};

	/**
	 * Fills array to enforce 2 callback minimum
	 * @param arr
	 * @param value
	 * @param min
	 * @returns {any[]}
	 */
	const fill = (arr, value = ((d) => d), min = 2) => {
	    arr = [...arr];
	    if (arr.length >= min) {
	        return arr;
	    }
	    return [
	        ...(arr = arr || []),
	        ...(Array(min - arr.length).fill(value, 0))
	    ];
	};

	/**
	 *
	 * @param obj
	 * @returns {{exec: function}|TxIterator|TxPipe|TxValidator}
	 */
	const castToExec = (obj) => {
	    if (!obj) {
	        return DefaultPipeTx;
	    }

	    if ((!(obj instanceof TxIterator) && !Array.isArray(obj)) && obj["loop"]) {
	        obj = new TxIterator(...obj);
	    }

	    if (Array.isArray(obj)) {
	        let _k = 0;
	        obj.forEach((o) => {
	            if (TxValidator.validateSchemas(o)) {
	                obj[_k] = new TxValidator(o);
	            }
	            _k++;
	        });
	        obj = new TxIterator(...obj);

	    }

	    if (obj instanceof TxIterator) {
	        return new TxPipe({
	            exec: (d) => obj.loop(d),
	        });
	    }

	    // -- if is pipe config item, we normalize for intake
	    if ((typeof obj) === "function") {
	        return Object.assign({}, DefaultPipeTx, {exec: obj});
	    }

	    // -- if is pipe norm,normalized config item, we pass in for intake
	    if ((typeof obj.exec) === "function") {
	        return Object.assign({}, DefaultPipeTx, obj);
	    }

	    // -- if TxPipe, our work here is already done
	    if (obj instanceof TxPipe) {
	        return obj;
	    }

	    // -- if is JSON-Schema, cast as TxValidator instance
	    if (TxValidator.validateSchemas(obj)) {
	        obj = new TxValidator(obj);
	    }

	    // -- wraps Validators as executable
	    if ((typeof obj["validate"]) === "function") {
	        return Object.defineProperties({}, {
	            exec: {
	                value: (d) => {
	                    obj["validate"](d);
	                    if (obj.errors) {
	                        throw obj.errors;
	                    }

	                    return d;
	                },
	                enumerable: true,
	                configurable: false,
	            },
	            schema: {
	                get: () => obj.schema,
	                enumerable: true,
	                configurable: false,
	            },
	            errors: {
	                get: () => obj.errors,
	                enumerable: true,
	                configurable: false,
	            },
	        });
	    }

	    // attempts to map to Tx-able object
	    return Object.assign({}, DefaultPipeTx, obj);
	};

	/**
	 *
	 * @param cb
	 * @returns {function(*): any}
	 */
	const handleAsync = (cb) => (
	    async (d) => await new Promise(
	        (resolve) => d.then((_) => resolve(cb(_)))
	            .catch((e) => {
	                throw e;
	            })
	    ).catch((e) => { throw e; })
	);

	/**
	 *
	 * @param cb
	 * @returns {Function}
	 */
	const wrapCallback = (cb) => ((dataOrPromise) => {
	    if (dataOrPromise instanceof Promise) {
	        // delegates Promise
	        return handleAsync(dataOrPromise);
	    }

	    return cb(dataOrPromise)
	});

	/**
	 *
	 * @param args
	 * @returns {*[]|{schema: {schema, anyOf, $id}, exec: (function(*): *)}[]}
	 */
	const mapArgs = (...args) => {
	    if (!args.length) {
	        return [DefaultPipeTx, DefaultPipeTx];
	    }

	    // normalizes args list and wraps in txPipe Protocol
	    return [...args].map(castToExec);
	};

	/* ############################################################################
	The MIT License (MIT)

	Copyright (c) 2019 Van Schroeder
	Copyright (c) 2019 Webfreshener, LLC

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	############################################################################ */

	class TxExecutor {
	    /**
	     *
	     * @param callbacks
	     * @param data
	     * @returns {*}
	     * @private
	     */
	    static exec(callbacks, data) {
	        let _value;
	        const _it = _cbIterator(callbacks);
	        let _done = false;
	        _value = data;
	        while (!_done) {
	            let {done, value} = _it.next(_value);
	            if (!(_done = done)) {
	                _value = value;
	            }
	        }

	        return _value;
	    };
	}

	/**
	 * Promise-safe callback iterator for pipe transactions
	 * @param callbacks
	 * @returns {{next: (function(*=): *)}}
	 * @private
	 */
	const _cbIterator = (callbacks) => {
	    let _idx = -1;
	    if (Array.isArray(callbacks[0])) {
	        callbacks = callbacks[0];
	    }

	    return {
	        next: (data) => {
	            return (_idx++ < (callbacks.length - 1)) ? {
	                value: (wrapCallback(callbacks[_idx] || ((__) => __)))(data),
	                done: false,
	            } : {
	                value: data || false,
	                done: true,
	            };
	        },
	    };
	};

	/* ############################################################################
	The MIT License (MIT)

	Copyright (c) 2019 Van Schroeder
	Copyright (c) 2019 Webfreshener, LLC

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	############################################################################ */

	/**
	 *
	 */
	class TxProperties {
	    static init(txPipe, properties) {
	        const {callbacks, inSchema, outSchema, txSchemas, vo, pOS, _pipes} = properties;
	        const _txP = {};
	        return Object.defineProperties(_txP, {
	            callbacks: {
	                value: callbacks,
	                enumerable: true,
	                configurable: false,
	            },
	            rate: {
	                value: 1,
	                enumerable: true,
	                configurable: true,
	            },
	            links: {
	                value: new WeakMap(),
	                enumerable: true,
	                configurable: false,
	            },
	            exec: {
	                value: (data) => {
	                    try {
	                        return TxExecutor.exec(callbacks, data);
	                    } catch (e) {
	                        _observers$1.get(_txP.out).error({
	                            error: e,
	                            data: data,
	                        });
	                    }
	                },
	                enumerable: false,
	                configurable: false,
	            },
	            out: {
	                value: (() => {
	                    const _txV = new TxValidator(outSchema);
	                    // unsubscribe all observers on complete notification (freeze/close)
	                    _txV.subscribe({
	                        complete: () => {
	                            _pipes.get(txPipe).listeners.forEach((_) => _.unsubscribe());
	                            _pipes.get(txPipe).listeners = [];
	                        },
	                    });
	                    return _txV;
	                })(),
	                enumerable: true,
	                configurable: false,
	            },
	            schema: {
	                value: [inSchema, outSchema],
	                enumerable: true,
	                configurable: false,
	            },
	            txSchemas: {
	                // enforces 2 schema minimum (in/out)
	                value: txSchemas.length < 2 ? [...txSchemas, ...txSchemas] : txSchemas,
	                enumerable: true,
	                configurable: false,
	            },

	            vo: {
	                get: () => vo,
	                enumerable: true,
	                configurable: false,
	            },
	            pOS: {
	                value: pOS,
	                enumerable: false,
	                configurable: false,
	            }
	        });
	    }
	}

	/* ############################################################################
	The MIT License (MIT)

	Copyright (c) 2019 Van Schroeder
	Copyright (c) 2019 Webfreshener, LLC

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	############################################################################ */

	const _pipes$1 = new WeakMap();
	const _cache = new WeakMap();

	/**
	 * TxPipe Class
	 */
	class TxPipe {
	    static getExecs(..._pvs) {
	        return _pvs.map((_p) => {
	            _p = Array.isArray(_p) ? _p[0] : _p;
	            return (d) => {
	                const _exec = ((typeof _p === "function") ? _p : void 0) ||
	                    // is pipe or implements pipe api
	                    (_p["exec"]) ||
	                    // is validator or implements validator api
	                    (_p["validate"] ? ((d) => _p["validate"](d) ? d : false) : void 0) ||
	                    // default
	                    ((_) => _);
	                return (_exec).apply(null, [d]);
	            };
	        });
	    }

	    /**
	     *
	     * @param pipesOrVOsOrSchemas
	     */
	    constructor(...pipesOrVOsOrSchemas) {
	        _pipes$1.set(this, {});
	        _cache.set(this, []);

	        // TODO: solve this issue with async methods to remove kludge
	        if (pipesOrVOsOrSchemas[0] instanceof Function) {
	            // tests async for nodejs then for Browser JS
	            if ((typeof (pipesOrVOsOrSchemas[0]()).then === "function") ||
	                pipesOrVOsOrSchemas[0].constructor.name === "AsyncFunction") {
	                pipesOrVOsOrSchemas.splice(0, 0, {
	                    $id: "root#",
	                    $schema: "http://json-schema.org/draft-07/schema#",
	                    type: "object",
	                    properties: {},
	                });
	            }
	        }

	        pipesOrVOsOrSchemas = mapArgs(...pipesOrVOsOrSchemas);

	        // enforces 2 callback minimum for `reduce` by appending pass-thru callbacks
	        const _callbacks = fill(TxPipe.getExecs(...pipesOrVOsOrSchemas));

	        const _inPipe = (
	            Array.isArray(pipesOrVOsOrSchemas) && pipesOrVOsOrSchemas.length
	        ) ? pipesOrVOsOrSchemas[0] : pipesOrVOsOrSchemas.length ?
	            pipesOrVOsOrSchemas : {
	                schema: [DefaultVOSchema, DefaultVOSchema],
	                exec: (d) => d,
	            };

	        const _pSchemas = [...pipesOrVOsOrSchemas]
	            .filter((_p) => {
	                // filters array for validators and valid schemas
	                return (
	                    // returns true if TxValidator
	                    (_p instanceof TxValidator) ||
	                    // returns true if has `schema` attribute and is a valid `json-schema`
	                    _p["schema"] && TxValidator.validateSchemas(_p.schema)
	                );
	            }).map(_ => _.schema);

	        const _getInSchema = () => {
	            if (_pSchemas.length) {
	                return (_pSchemas[0] instanceof TxValidator) ?
	                    _pSchemas[0].schema : _pSchemas[0];
	            }
	            return DefaultVOSchema;
	        };

	        const _inSchema = _getInSchema();
	        const _outSchema = _pSchemas.length > 1 ? _pSchemas[_pSchemas.length - 1] : _inSchema;

	        if (!_pSchemas.length) {
	            _pSchemas.splice(0, 0, {schemas: [DefaultVOSchema]}, {schemas: [DefaultVOSchema]});
	        }

	        // stores config & state
	        _pipes$1.set(this,
	            TxProperties.init(this, {
	                vo: (_inPipe instanceof TxValidator) ? _inPipe : new TxValidator(_inSchema),
	                callbacks: _callbacks,
	                txSchemas: _pSchemas,
	                inSchema: _inSchema,
	                outSchema: _outSchema,
	                pOS: pipesOrVOsOrSchemas,
	                _pipes: _pipes$1,
	            }),
	        );

	        _pipes$1.get(this).ivl = 0;
	        _pipes$1.get(this).ivlVal = 0;
	        _pipes$1.get(this).listeners = [new PipeListener(this)];

	        // define exec in constructor to ensure method visibility
	        Object.defineProperty(this, "exec", {
	            // value: (data) => _pipes.get(this).exec(data),
	            value: (data) => {
	                try {
	                    return _pipes$1.get(this).exec(data);
	                } catch (e) {
	                    console.error(e);
	                }
	            },
	            enumerable: true,
	            configurable: false,
	        });
	    }

	    /**
	     * Creates new `txPipe` segment
	     * @param pipesOrSchemas
	     * @returns {TxPipe}
	     */
	    txPipe(...pipesOrSchemas) {
	        return new TxPipe([_pipes$1.get(this).out, ...pipesOrSchemas]);
	    }

	    /**
	     * Returns arr
	     * @returns {*[]}
	     */
	    get schema() {
	        return [
	            _pipes$1.get(this).vo.schema,
	            _pipes$1.get(this).out.schema
	        ];
	    }

	    /**
	     * links pipe segment to direct output to target pipe
	     * @param target
	     * @param callbacks function[]
	     * @returns {TxPipe}
	     */
	    txLink(target, ...callbacks) {
	        if (!(target instanceof TxPipe)) {
	            throw `item for "target" was not a TxPipe`;
	        }

	        // allow for array literal in place of inline assignment
	        if (Array.isArray(callbacks[0])) {
	            callbacks = callbacks[0];
	        }

	        callbacks = fill(callbacks || []);

	        // creates observer and stores it to links map for `txPipe`
	        const _sub = this.subscribe({
	            next: (data) => {
	                const _res = TxExecutor.exec(callbacks, data.toJSON ? data.toJSON() : data);
	                if (_res instanceof Promise) {
	                    return _res.then((_) => target.txWrite(_));
	                }

	                target.txWrite(_res);
	            },
	            error: (e) => {
	                console.error(e);
	            },
	            // handles unlink & cleanup on complete
	            complete: () => this.txUnlink(target)
	        });

	        _pipes$1.get(this).links.set(target, _sub);
	        return this;
	    }

	    /**
	     * Unlink `txPipe` segment from target `txPipe`
	     * @param target
	     * @returns {TxPipe}
	     */
	    txUnlink(target) {
	        if (!(target instanceof TxPipe)) {
	            throw `item for "target" was not a TxPipe`;
	        }

	        const _sub = _pipes$1.get(this).links.get(target);

	        if (_sub) {
	            _sub.unsubscribe();
	            _pipes$1.get(this).links.delete(target);
	        }

	        return this;
	    }

	    /**
	     * Returns validation errors
	     * @returns {*}
	     */
	    get txErrors() {
	        return _pipes$1.get(this).vo.errors;
	    }

	    /**
	     * Returns JSON-SCHEMA for `txPipe` output
	     * @returns {object}
	     */
	    get txSchemas() {
	        return [..._pipes$1.get(this).txSchemas];
	    }

	    /**
	     * Creates array of new `txPipe` segments that run in parallel
	     * @param schemasOrPipes
	     * @returns {*}
	     */
	    txSplit(schemasOrPipes) {
	        return schemasOrPipes.map((_) => this.txPipe(_));
	    }

	    /**
	     * Iterates pipe callbacks via generator function
	     * @param data
	     * @returns {generator}
	     */
	    txYield(data) {
	        let _fill = _pipes$1.get(this).pOS.map((_) => _.exec || ((_) => _));

	        if (!_fill.length) {
	            _fill[0] = (d) => d;
	        }

	        const _f = new Function("$scope", "$cb",
	            [
	                "return (function* (data) { ",
	                "try {",
	                Object.keys(_fill)
	                    .map((_) => `yield data=($cb[${_}].bind($scope))(data)`)
	                    .join("; "),
	                "} catch (e) { $scope.error(e); }",
	                "}).bind($scope);",
	            ].join(" ")
	        );

	        return _f(this, _fill)(data);
	    }

	    /**
	     * Merges multiple pipes into single output
	     * @param pipeOrPipes
	     * @param pipeOrSchema
	     * @returns {TxPipe}
	     */
	    txMerge(pipeOrPipes, pipeOrSchema = {schemas: [DefaultVOSchema]}) {
	        const _out = new TxPipe(pipeOrSchema);
	        _pipes$1.get(this).listeners = [
	            ..._pipes$1.get(this).listeners,
	            // -- feeds output of map to listeners array
	            ...(Array.isArray(pipeOrPipes) ? pipeOrPipes : [pipeOrPipes])
	                .filter((_p) => ((typeof _p.subscribe) === "function"))
	                .map((_p) => {
	                    _p.subscribe((d) => {
	                        // -- all pipes now write to output tx
	                        _out.txWrite(d.toJSON ? d.toJSON() : d);
	                    });
	                    return _p;
	                })
	        ];
	        // -- returns output tx for observation
	        return _out;
	    }

	    /**
	     * Writes data to pipe segment
	     * @param data
	     * @returns {TxPipe}
	     */
	    txWrite(data) {
	        _pipes$1.get(this).vo.model = data;
	        return this;
	    }

	    /**
	     * Creates clone of current `txPipe` segment
	     * @returns {TxPipe}
	     */
	    txClone() {
	        const $ref = _pipes$1.get(this);
	        const _cz = class extends TxPipe {
	            constructor() {
	                super();
	                _pipes$1.set(this, $ref);
	                _pipes$1.get(this).listeners = [...$ref.listeners];
	            }
	        };
	        return new _cz();
	    }

	    /**
	     * Terminates input on `txPipe` segment. This is irrevocable
	     * @returns {TxPipe}
	     */
	    txClose() {
	        _pipes$1.get(this).out.freeze();
	        return this;
	    }

	    /**
	     * Returns write status of `txPipe`
	     * @returns {boolean}
	     */
	    get txWritable() {
	        return !_pipes$1.get(this).out.isFrozen;
	    }

	    /**
	     * Informs `txPipe` to rate limit notifications based on time interval
	     * @param rate
	     * @returns {TxPipe}
	     */
	    txThrottle(rate) {
	        const _ivl = _pipes$1.get(this).tO;

	        if (_ivl) {
	            _ivl.clearInterval();
	        }

	        if (rate >= 0) {
	            _pipes$1.get(this).tO = setInterval(
	                () => {
	                    if (_cache.get(this).length) {
	                        const _func = _cache.get(this).pop();
	                        if ((typeof _func) === "function") {
	                            _pipes$1.get(this).out.model = _func();
	                        }
	                    }
	                    delete _pipes$1.get(this).tO;
	                },
	                parseInt(rate, 10)
	            );
	        }
	        return this;
	    }

	    /**
	     * Returns product of Nth occurrence of `txPipe` execution
	     * @param nth
	     * @returns {TxPipe}
	     */
	    txSample(nth) {
	        _pipes$1.get(this).ivl = nth;
	        return this;
	    }

	    /**
	     * Subscribes to `txPipe` output notifications
	     * @param handler
	     * @returns {Observable}
	     */
	    subscribe(handler) {
	        if (!(typeof handler).match(/^(function|object)$/)) {
	            throw "handler required for TxPipe::subscribe";
	        }

	        return _pipes$1.get(this).out.subscribe(handler);
	    }

	    /**
	     * Provides current state of `txPipe` output. alias for toJSON
	     * @returns {Object|Array}
	     */
	    txTap() {
	        return this.toJSON();
	    }

	    /**
	     * Convenience Method for Promise based flows.
	     * Writes data to `txPipe` and wraps observer in Promise
	     *
	     * @param data
	     * @returns {Promise<TxPipe>}
	     */
	    async txPromise(data) {
	        return await new Promise((resolve, reject) => {
	            this.subscribe({
	                next: (d) => {
	                    resolve(d);
	                },
	                error: (e) => {
	                    reject(e);
	                }
	            });
	            this.txWrite(data);
	        });
	    }

	    /**
	     * Overrides Object's toString method
	     * @override
	     * @returns {String}
	     */
	    toString() {
	        return JSON.stringify(this.toJSON());
	    }

	    /**
	     * Provides current state of `txPipe` output.
	     * @override
	     * @returns {Object|Array}
	     */
	    toJSON() {
	        return _pipes$1.get(this).out.toJSON();
	    }
	}

	class PipeListener {
	    /**
	     *
	     * @param target
	     */
	    constructor(target) {
	        const _self = this;
	        _pipes$1.set(_self, target);
	        this.vo.subscribe({
	            next: (d) => _self.next(d),
	            error: (e) => _self.error(e),
	            complete: () => _self.complete(),
	        });
	    }

	    /**
	     *
	     * @returns {TxPipe}
	     */
	    get target() {
	        return _pipes$1.get(this);
	    }

	    /**
	     *
	     * @returns {TxValidator}
	     */
	    get vo() {
	        return _pipes$1.get(this.target).vo;
	    }

	    /**
	     *
	     * @returns {TxValidator}
	     */
	    get out() {
	        return _pipes$1.get(this.target).out;
	    }

	    /**
	     *
	     * @param e
	     */
	    error(e) {
	        // sends error notification through out validator's observable
	        console.log("error via error method  in txpipe");
	        _observers$1.get(this.out).error(e);
	    }

	    /**
	     * closes `pipe` on complete notification
	     */
	    complete() {
	        this.target.txClose();
	    }

	    /**
	     *
	     * @param data
	     * @returns {Promise<void | never>}
	     */
	    next(data) {
	        // enforces JSON formatting if feature is present
	        data = data && data.toJSON ? data.toJSON() : data;
	        const _target = _pipes$1.get(this);
	        // tests for presence of rate-limit timeout
	        if (_pipes$1.get(_target).tO) {
	            // caches operation for later execution. ordering is FIFO
	            _cache.get(_target).splice(0, 0, () => _pipes$1.get(_target).cb(data));
	            // cancels current execution
	            return void 0;
	        }

	        // tests for interval (ivl)
	        if (_pipes$1.get(_target).ivl !== 0) {
	            // tics the counter and tests if count is fulfilled
	            if ((++_pipes$1.get(_target).ivlVal) !== _pipes$1.get(_target).ivl) {
	                // count is not fulfilled. stops the execution
	                return void 0;
	            } else {
	                // resets the count and lets the operation proceed
	                _pipes$1.get(_target).ivlVal = 0;
	            }
	        }

	        let _t, _type;

	        // capture output of callback
	        try {
	            _t = _pipes$1.get(this).exec(data); //_pipes.get(_pipes.get(this)).exec(data);
	            _type = typeof _t;
	        } catch (e) {
	            console.log("error via try/catch in txpipe");
	            return _observers$1.get(this.out).error({
	                error: e,
	                data: data,
	            });
	        }

	        // tests if object and if object is writable
	        if ((_t instanceof Promise) || ((_type === "function") || (_type === "object")) && _target.txWritable) {
	            const _out = (_) => {
	                // else we set the model for validation
	                try {
	                    this.out.model = _.toJSON ? _.toJSON() : _;
	                } catch (e) {
	                    _observers$1.get(this.out).error({
	                        error: e,
	                        data: data,
	                    });
	                }
	            };

	            if (_t instanceof Promise) {
	                return _t.then((_) => {
	                    _out(_);
	                })
	                    .catch((e) => {
	                        _observers$1.get(this.out).error({
	                            error: e,
	                            data: data,
	                        });
	                    });
	            }

	            if (_type === "function") {
	                const __ = _t();
	                if (__ instanceof Promise) {
	                    return __.then((_) => {
	                        _out(_);
	                    })
	                        .catch((e) => {
	                            _observers$1.get(this.out).error({
	                                error: e,
	                                data: data,
	                            });
	                        });
	                }
	            }

	            _out(_t);
	        } else {
	            /*
	                string values are treated as error messages
	                boolean & numeric values get safely ignored
	             */
	            if ((typeof _t) === "string") {
	                _observers$1.get(this.out).error({
	                    error: _t,
	                    data: data,
	                });
	            }
	        }
	    }

	    subscribe(handler) {
	        _observers$1.get(this.out).subscribe(handler);
	    }
	}

	exports.TxPipe = TxPipe;
	exports.TxValidator = TxValidator;

	Object.defineProperty(exports, '__esModule', { value: true });

	return exports;

}({}));

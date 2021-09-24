"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCLang3File = exports.ILT = exports.FileType = void 0;
const { getCacheLocation } = require("!io");
const path = __importStar(require("path"));
const fs_1 = require("fs");
const CompileTimeError_1 = require("./CompileTimeError");
const hashString_1 = require("./util/hashString");
const fileCache_1 = require("./fileCache");
const tokenizer_1 = require("./tokenizer");
const Consumer_1 = require("./Consumer");
const ScriptableLanguage_1 = require("./ScriptableLanguage");
const builder_1 = require("./builder");
const CachableArgument_1 = require("./args/CachableArgument");
const logger = require("!logger");
const cache_location = getCacheLocation("lang-mc3");
function clean(o) {
    const seen = new Set();
    async function _clean(o, unsafe = false) {
        if (typeof o != "object" || !o || (seen.has(o) && !unsafe))
            return o;
        const keys = Object.keys(o);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (o[key] instanceof Promise) {
                const res = await _clean(await o[key]);
                //@ts-ignore
                seen.add(res);
                o[key] = res;
            }
            else {
                let safe = seen.has(o[key]);
                seen.add(o[key]);
                await _clean(o[key], !safe);
            }
        }
        return o;
    }
    return _clean(o);
}
var FileType;
(function (FileType) {
    FileType[FileType["MC"] = 0] = "MC";
    FileType[FileType["MCM"] = 1] = "MCM";
})(FileType = exports.FileType || (exports.FileType = {}));
class ILT {
    constructor(token, value, parent) {
        this.token = token;
        this.value = value;
        this.parent = parent;
    }
}
exports.ILT = ILT;
function mergeTokens(list) {
    let result = [];
    let start = -1;
    let acc = [];
    for (let i = 0; i < list.length; i++) {
        const parent = list[i].parent;
        if (parent instanceof Block) {
            if (start === -1 || parent.line === start) {
                acc.push(list[i]);
                start = parent.last_line;
            }
            else {
                if (acc.length > 0) {
                    result.push(new ILT(acc[0].token, acc.map(_ => _.value).join(" "), acc[0].parent));
                    acc = [];
                    start = -1;
                    i--;
                }
            }
        }
        else if (parent instanceof tokenizer_1.Token) {
            if (start === -1 || parent.line === start) {
                acc.push(list[i]);
                start = parent.line;
            }
            else {
                if (acc.length > 0) {
                    result.push(new ILT(acc[0].token, acc.map(_ => _.value).join(" "), acc[0].parent));
                    acc = [];
                    start = -1;
                    i--;
                }
            }
        }
    }
    if (acc.length > 0) {
        result.push(new ILT(acc[0].token, acc.map(_ => _.value).join(" "), acc[0].parent));
    }
    return result;
}
class Block {
    constructor(tokens, file, validate = true) {
        var _a;
        this.file = file;
        this.tokens = [];
        const start = tokens.shift();
        this.start = start;
        let lbracket = tokens.shift();
        if ((lbracket === null || lbracket === void 0 ? void 0 : lbracket.value) !== "{" && validate) {
            throw new CompileTimeError_1.CompileTimeError(CompileTimeError_1.CompileTimeError.Errors.EXPECTED_TOKEN_OPEN_LEFT_CURLY_BRACKET, `Expected '{' got '${(lbracket === null || lbracket === void 0 ? void 0 : lbracket.value) || "NOTHING"}'`);
        }
        while (tokens.length && tokens[0].value !== "}") {
            if (tokens.length && ((_a = tokens[1]) === null || _a === void 0 ? void 0 : _a.value) === "{") {
                this.tokens.push(new Block(tokens, file));
            }
            else {
                this.tokens.push(tokens.shift());
            }
        }
        // this.tokens = mergeTokens(this.tokens);
        const end = tokens.shift();
        this.line = (start === null || start === void 0 ? void 0 : start.line) || -1;
        this.last_line = (end === null || end === void 0 ? void 0 : end.line) || -1;
        if ((end === null || end === void 0 ? void 0 : end.value) !== "}") {
            throw new CompileTimeError_1.CompileTimeError(CompileTimeError_1.CompileTimeError.Errors.EXPECTED_TOKEN_OPEN_RIGHT_CURLY_BRACKET, `Expected '}' got '${(end === null || end === void 0 ? void 0 : end.value) || "NOTHING"}'`);
        }
    }
    toIL(id, start, IL) {
        var _a;
        const MY_ID = `${start + id}`;
        IL[MY_ID] = this.tokens
            .filter((item) => item != undefined)
            .map((_, i) => _.toIL(i, start + id + "_", IL));
        IL[MY_ID] = mergeTokens(IL[MY_ID]);
        return new ILT(this.start, `${(_a = this.start) === null || _a === void 0 ? void 0 : _a.value.trim()} _block ${start + id}`, this);
    }
}
class MCLang3File {
    constructor(file_path) {
        this.dependencies = new Set();
        this.dependents = new Set();
        this.data = "";
        this.raw_lines = [];
        this.file_path = "";
        this.hash = null;
        this.exports = new Map();
        this.handlers = new Map();
        this.type = file_path.endsWith(".mc") ? FileType.MC : FileType.MCM;
        this.file_path = file_path;
        this.blocks = {};
    }
    getBlock(name) {
        return this.blocks[name];
    }
    addExport(name, callable) {
        this.exports.set(name, callable);
    }
    async execute(type, ilc, source, addToBlock = null) {
        var _a;
        CompileTimeError_1.CompileTimeError.push_stack({
            file: this.file_path,
            line: ilc.token.line,
        });
        CachableArgument_1.CacheableArgument.reset();
        let cmd = ilc.value;
        if (source.replacements && source.replacements.length > 0) {
            source.replacements.forEach(([target, val]) => {
                cmd = cmd.replace(target, val);
            });
        }
        const line = await ScriptableLanguage_1.ScriptableLanguage.evaluateInlineBlocks(cmd, source.env, addToBlock);
        let res = line;
        try {
            res = (await ((_a = this.handlers.get(type)) === null || _a === void 0 ? void 0 : _a.executeAsync(res, source))) || res;
        }
        catch (e) { }
        CompileTimeError_1.CompileTimeError.pop_stack();
        return res;
    }
    async init(file_path) {
        this.file_path = file_path;
        CompileTimeError_1.CompileTimeError.push_stack({
            file: file_path,
            line: 0,
            special: "IMPORTS",
        });
        this.raw_lines = this.data.split("\n");
        let using_statements = [];
        for (let i = 0; i < this.raw_lines.length; i++) {
            CompileTimeError_1.CompileTimeError.push_stack({
                file: file_path,
                line: i,
            });
            const line = this.raw_lines[i].trim();
            if (line.startsWith("using ")) {
                const target = line.substr(6).trim();
                const local_location = path.resolve(this.file_path, "..", target);
                const module_location = path.resolve(cache_location, target + ".mcm");
                if (fs_1.existsSync(local_location)) {
                    using_statements.push(local_location);
                }
                else if (fs_1.existsSync(module_location)) {
                    using_statements.push(module_location);
                }
                else {
                    throw new CompileTimeError_1.CompileTimeError(CompileTimeError_1.CompileTimeError.Errors.INVALID_IMPORT, `Invalid using statement '${line}'`);
                }
            }
            else if (line) {
                CompileTimeError_1.CompileTimeError.pop_stack();
                break;
            }
            CompileTimeError_1.CompileTimeError.pop_stack();
        }
        this.dependencies = new Set();
        for (let i = 0; i < using_statements.length; i++) {
            let dep = await this.load(using_statements[i]);
            this.dependencies.add(dep);
        }
        this.dependencies.forEach((dependency) => dependency.addDependent(this));
        CompileTimeError_1.CompileTimeError.pop_stack();
    }
    async load(file_path) {
        var _a;
        if (!fileCache_1.fileCache.has(file_path)) {
            fileCache_1.fileCache.set(file_path, new MCLang3File(file_path));
        }
        await ((_a = fileCache_1.fileCache.get(file_path)) === null || _a === void 0 ? void 0 : _a.update());
        return fileCache_1.fileCache.get(file_path);
    }
    async update(force = false) {
        this.data = fs_1.readFileSync(this.file_path, "utf8");
        let hash = hashString_1.hashString(this.data);
        const isSame = hash === this.hash;
        await this.init(this.file_path);
        if (isSame && !force) {
            CompileTimeError_1.CompileTimeError.pop_stack();
            return;
        }
        this.hash = hash;
        this.clean();
        await this.build(force);
    }
    clean() {
        this.exports = new Map();
    }
    async build(force) {
        CompileTimeError_1.CompileTimeError.push_stack({
            line: 0,
            file: this.file_path,
            special: "COMPILE",
        });
        CompileTimeError_1.CompileTimeError.push_stack({
            line: 0,
            file: this.file_path,
            special: "GET_CONSUMERS",
        });
        this.handlers = Consumer_1.gather(this);
        CompileTimeError_1.CompileTimeError.pop_stack();
        const tokens = tokenizer_1.tokenize(this.file_path, fs_1.readFileSync(this.file_path, "utf-8"));
        ScriptableLanguage_1.ScriptableLanguage.setFile(this);
        let _blocks = [];
        while (tokens.length) {
            if (!tokens[0].value.startsWith("using"))
                _blocks.push(new Block(tokens, this, false));
            else
                _blocks.push(tokens.shift());
        }
        const IL = {};
        const ROOT = [];
        for (let i = 0; i < _blocks.length; i++) {
            if (_blocks[i])
                ROOT[i] = _blocks[i].toIL(i, "block_", IL);
        }
        IL.root = ROOT;
        this.blocks = IL;
        const something = [];
        for (let i = 0; i < ROOT.length; i++) {
            let c = await this.execute("top", ROOT[i], { env: ScriptableLanguage_1.ScriptableLanguage.baseEnv }, null);
            something.push(...(await Promise.all(Array.isArray(c) ? c : [c])));
        }
        const cleaned = await clean(something);
        if (this.type === FileType.MC) {
            builder_1.reset_builder(this);
            cleaned.forEach((element) => {
                if (typeof element !== "string") {
                    builder_1.builder(element);
                }
            });
        }
        // require("fs").writeFileSync(
        //   `./tree.${
        //     path.parse(this.file_path).name + "_" + path.parse(this.file_path).ext
        //   }.json`,
        //   JSON.stringify(something, null, 2)
        // );
        CompileTimeError_1.CompileTimeError.pop_stack();
        CompileTimeError_1.CompileTimeError.push_stack({
            line: 0,
            file: this.file_path,
            special: "BUILD_DEPENDENTS",
        });
        const toBuild = Array.from(this.dependents.keys());
        this.dependents = new Set();
        if (toBuild.length > 0) {
            logger.log(`building ${toBuild.length} additional file${toBuild.length === 1 ? "" : "s"}...`);
            await Promise.all(toBuild.map((file) => file.update(true)));
        }
        CompileTimeError_1.CompileTimeError.pop_stack();
    }
    addDependent(file) {
        this.dependents.add(file);
    }
    getMacros() {
        const macros = {};
        this.dependencies.forEach((dep) => dep.exports.forEach((val, name) => {
            let _val = val;
            if (_val.type === "macro") {
                macros[name] = _val.execute;
            }
        }));
        return macros;
    }
}
exports.MCLang3File = MCLang3File;

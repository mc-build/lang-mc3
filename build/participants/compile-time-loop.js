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
exports.bind = void 0;
const CompileTimeError_1 = require("../CompileTimeError");
const B = __importStar(require("@mc-build/brigadier"));
const ScriptableLanguage_1 = require("../ScriptableLanguage");
const ScriptArgument_1 = require("../args/ScriptArgument");
const BlockArgument_1 = require("../args/BlockArgument");
const bind = ({ get, file, }) => {
    const Loop = (target) => B.literal("LOOP").then(B.argument("var_name", B.string())
        .then(B.literal("value").then(B.argument("count", B.string()).then(
    //@ts-ignore-next-line
    B.argument("block", new BlockArgument_1.BlockArgument(file, false, false)).executes(async (ctx) => {
        const source = ctx.getSource();
        let min = 0;
        let max = ctx.getArgument("count");
        let value = max;
        if (max.includes("..")) {
            [min, max] = max.split("..").map((_) => parseInt(_));
        }
        if (min >= max) {
            throw new CompileTimeError_1.CompileTimeError(CompileTimeError_1.ErrorType.CUSTOM, `Invalid loop value(s) (${value})`);
        }
        const var_name = ctx.getArgument("var_name");
        const { block } = ctx.getArgument("block");
        const result = [];
        let i;
        for (i = min; i < max; i++) {
            for (let command of block) {
                result.push(await file.execute(target, command, {
                    ...source,
                    env: {
                        ...source.env,
                        [var_name]: i,
                    }
                }));
            }
        }
        return result;
    }))))
        .then(B.literal("script").then(B.argument("value", new ScriptArgument_1.ScriptArgument(false)).then(
    //@ts-ignore-next-line
    B.argument("block", new BlockArgument_1.BlockArgument(file, false, false)).executes(async (ctx) => {
        const source = ctx.getSource();
        const in_value = await ScriptableLanguage_1.ScriptableLanguage.evaluateCode(`return ${ctx.getArgument("value").script}`, source.env);
        const var_name = ctx.getArgument("var_name");
        const { block } = ctx.getArgument("block");
        const result = [];
        if (Array.isArray(in_value)) {
            for (const item of in_value) {
                for (let command of block) {
                    result.push(await file.execute(target, command, {
                        //@ts-ignore-next-line
                        ...source,
                        env: {
                            ...source.env,
                            [var_name]: item,
                        }
                    }));
                }
            }
        }
        else if (typeof in_value === "object") {
            for (const key in in_value) {
                const value = in_value[key];
                for (let command of block) {
                    result.push(await file.execute("generic", command, {
                        ...source,
                        env: {
                            ...source.env,
                            [var_name]: { key, value },
                        }
                    }));
                }
            }
        }
        return result;
    })))));
    get("generic").register(Loop("generic"));
    get("top").register(Loop("top"));
};
exports.bind = bind;

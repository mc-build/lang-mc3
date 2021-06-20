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
const B = __importStar(require("@mc-build/brigadier"));
const ScriptArgument_1 = require("../args/ScriptArgument");
const BlockArgument_1 = require("../args/BlockArgument");
const ScriptableLanguage_1 = require("../ScriptableLanguage");
const asyncMap_1 = require("../util/asyncMap");
const bind = ({ get, file, }) => {
    const Host = get("generic");
    const compileTimeIfStatement = async (ctx) => {
        var _a;
        debugger;
        const source = ctx.getSource();
        let h2;
        try {
            h2 = (_a = ctx.getArgument("block2")) === null || _a === void 0 ? void 0 : _a.getHistory();
        }
        catch (e) { }
        const block = [...ctx.getArgument("block").getHistory(), ...(h2 || [])];
        const conditions = ctx.getArgument("script").getHistory();
        for (let i = 0; i < block.length; i++) {
            if (i >= conditions.length ||
                await ScriptableLanguage_1.ScriptableLanguage.evaluateCode(`return ${conditions[i].script}`, source.env)) {
                return await asyncMap_1.asyncMap(block[i].block, async (command) => {
                    let res = await file.execute("generic", command, source);
                    return res || command.value;
                });
            }
        }
        return [];
    };
    const IF = Host.register(B.literal("IF"));
    Host.register(B.literal("IF").then(B.argument("script", new ScriptArgument_1.ScriptArgument()).then(B.argument("block", new BlockArgument_1.BlockArgument(file))
        .executes(compileTimeIfStatement)
        .then(B.literal("ELSE")
        .then(B.literal("_block").then(B.argument("block2", new BlockArgument_1.BlockArgument(file, true)).executes(compileTimeIfStatement)))
        //@ts-ignore-next-line
        .then(B.literal("IF").forward(IF))))));
};
exports.bind = bind;

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
const jsx_1 = require("../jsx");
const asyncMap_1 = require("../util/asyncMap");
const bind = ({ get, file, }) => {
    const Host = get("generic");
    Host.register(B.literal("block").then(B.literal("_block").then(B.argument("block", B.string()).executes(async (ctx) => {
        const block = ctx.getArgument("block");
        const src = ctx.getSource();
        let res = await (jsx_1.jsx(jsx_1.Raw, null,
            "function ",
            jsx_1.jsx(jsx_1.Func, null, asyncMap_1.asyncMap(file.getBlock(block), async (ilc) => {
                let result = [];
                result.push(await file.execute("generic", ilc, src, (item) => {
                    result.push(item);
                }));
                return result;
            }))));
        return res;
    }))));
};
exports.bind = bind;

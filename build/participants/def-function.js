"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bind = void 0;
const brigadier_1 = require("@mc-build/brigadier");
const MCLang3File_1 = require("../MCLang3File");
const jsx_1 = require("../jsx");
const asyncMap_1 = require("../util/asyncMap");
const bind = ({ get, file, }) => {
    if (file.type === MCLang3File_1.FileType.MC) {
        get("top").register(brigadier_1.literal("function").then(brigadier_1.argument("name", brigadier_1.string()).then(brigadier_1.literal("_block").then(brigadier_1.argument("block", brigadier_1.string()).executes(async (ctx) => {
            const name = ctx.getArgument("name");
            const block = ctx.getArgument("block");
            const src = ctx.getSource();
            let res = [];
            asyncMap_1.asyncMap(file.getBlock(block), async (ilc) => {
                return file.execute("generic", ilc, src, v => res.push(v));
            });
            return (jsx_1.jsx(jsx_1.Func, { name: name }, res));
        })))));
    }
};
exports.bind = bind;

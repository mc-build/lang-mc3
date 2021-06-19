"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bind = void 0;
const brigadier_1 = require("@mc-build/brigadier");
const jsx_1 = require("../jsx");
const asyncMap_1 = require("../util/asyncMap");
const bind = ({ get, file, }) => {
    get("top").register(brigadier_1.literal("dir").then(brigadier_1.argument("name", brigadier_1.string()).then(brigadier_1.literal("_block").then(brigadier_1.argument("block", brigadier_1.string()).executes(async (ctx) => {
        const name = ctx.getArgument("name");
        const block = ctx.getArgument("block");
        const src = ctx.getSource();
        return (jsx_1.jsx(jsx_1.Dir, { name: name }, asyncMap_1.asyncMap(file.getBlock(block), async (ilc) => {
            return file.execute("top", ilc, src);
        })));
    })))));
};
exports.bind = bind;

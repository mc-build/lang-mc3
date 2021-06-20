"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bind = void 0;
const brigadier_1 = require("@mc-build/brigadier");
const MCLang3File_1 = require("../MCLang3File");
const asyncMap_1 = require("../util/asyncMap");
const bind = (a) => {
    const { get, file, expose } = a;
    if (file.type === MCLang3File_1.FileType.MCM) {
        get("top").register(brigadier_1.literal("macro").then(brigadier_1.argument("name", brigadier_1.string()).then(brigadier_1.literal("_block").then(
        //@ts-ignore
        brigadier_1.argument("block", brigadier_1.string()).executes((ctx) => {
            const name = ctx.getArgument("name");
            const block = ctx.getArgument("block");
            expose(name, {
                type: "macro",
                execute: async (ctx2) => {
                    let args = [];
                    try {
                        args = ctx2.getArgument("args").split(" ");
                    }
                    catch (e) {
                    }
                    const src = ctx2.getSource();
                    const replacements = [];
                    for (let i = 0; i < args.length; i++) {
                        if (args[i] === "_block") {
                            args[i] += " " + args[i] + 1;
                            args.splice(i + 1, 1);
                            replacements.push([new RegExp("\\$\\$" + i, "g"), args[i]]);
                        }
                        else {
                            replacements.push([new RegExp("\\$\\$" + i, "g"), args[i]]);
                        }
                    }
                    return asyncMap_1.asyncMap(file.getBlock(block), async (ILCMD) => {
                        return file.execute("generic", ILCMD, {
                            ...src,
                            replacements: replacements.reverse(),
                        });
                    });
                },
            });
        })))));
    }
};
exports.bind = bind;

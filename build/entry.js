"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CompileTimeError_1 = require("./CompileTimeError");
const fileCache_1 = require("./fileCache");
const MCLang3File_1 = require("./MCLang3File");
const tags = require("!lang/shared-tags");
console.log(tags);
require("./languages/JavaScript");
require("./participants/dummy");
require("./participants/def-function");
exports.default = (registry) => {
    const file_handler = async (file_path) => {
        var _a;
        tags.tags.reset(file_path);
        try {
            if (!fileCache_1.fileCache.has(file_path)) {
                fileCache_1.fileCache.set(file_path, new MCLang3File_1.MCLang3File(file_path));
            }
            await ((_a = fileCache_1.fileCache.get(file_path)) === null || _a === void 0 ? void 0 : _a.update());
            tags.tags.save();
        }
        catch (e) {
            tags.tags.restore();
            CompileTimeError_1.CompileTimeError.reset();
            if (e instanceof CompileTimeError_1.CompileTimeError) {
                console.log(e.toString());
            }
            else {
                throw e;
            }
        }
    };
    registry.set(".mc", file_handler);
    registry.set(".mcm", file_handler);
    return { exported: {} };
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bind = void 0;
const brigadier_1 = require("@mc-build/brigadier");
const jsx_1 = require("../jsx");
const bind = ({ get, file, }) => {
    get("generic").register(brigadier_1.literal("dummy").then(brigadier_1.argument("name", brigadier_1.string()).executes(async (ctx) => {
        const a = jsx_1.ref();
        return (jsx_1.jsx(jsx_1.Raw, null,
            "function ",
            jsx_1.jsx(jsx_1.Func, { ref: a },
                jsx_1.jsx(jsx_1.Raw, null,
                    "function ",
                    a))));
    })));
};
exports.bind = bind;

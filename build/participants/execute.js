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
const BracketString_1 = require("../args/BracketString");
const jsx_1 = require("../jsx");
const asyncMap_1 = require("../util/asyncMap");
const bind = ({ get, file, }) => {
    const GenericHost = get("generic");
    let id = 0;
    const execute = GenericHost.register(B.literal("execute"));
    function dummy(template) {
        // let base = _base || B.literal(template.shift());
        const item = template[0];
        if (Array.isArray(template[0])) {
            return template[0].map((item) => dummy(item));
        }
        let node;
        if (item === null) {
            //@ts-ignore
            node = B.argument(id, B.word());
        }
        else if (typeof item === "string") {
            node = B.literal(item);
        }
        else {
            //@ts-ignore
            node = B.argument(id, item);
        }
        const rest = template.slice(1);
        if (rest.length > 0) {
            let res = dummy(rest);
            if (!Array.isArray(res)) {
                res = [res];
            }
            res.forEach((item) => node.then(item));
        }
        else {
            node.redirect(execute);
        }
        return node;
        // let temp = base;
        // let tmp;
        // let fwd = true;
        // while (template.length) {
        //   let id = "arg_" + (gid++).toString(36);
        //   let item = template.shift();
        //   if (Array.isArray(item)) {
        //     item.forEach((alternatives) => {
        //       let abase = null;
        //       let _item = alternatives.shift();
        //       if (_item === null) {
        //         abase = B.argument(id, B.word());
        //       } else if (typeof _item === "string") {
        //         abase = B.literal(_item);
        //       } else {
        //         abase = B.argument(id, _item);
        //       }
        //       temp.then(dummy(alternatives, abase));
        //     });
        //     fwd = false;
        //   } else {
        //     fwd = true;
        //     if (item === null) {
        //       tmp = B.argument(id, B.word());
        //     } else if (typeof item === "string") {
        //       tmp = B.literal(item);
        //     } else {
        //       tmp = B.argument(id, item);
        //     }
        //     temp.then(tmp);
        //     temp = tmp;
        //   }
        // }
        // //   try {
        // if (fwd) temp.then(B.literal("execute").redirect(execute));
        // //   } catch (e) {}
        // return base;
    }
    function addArguments(root) {
        function conditional(root) {
            //block
            root.then(dummy(["block", null, null, null, new BracketString_1.BracketString()]));
            //blocks
            root.then(dummy([
                "blocks",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
            ]));
            //data
            root.then(dummy(["data", "block", null, null, null, new BracketString_1.BracketString()]));
            root.then(dummy(["data", "entity", new BracketString_1.BracketString(), new BracketString_1.BracketString()]));
            root.then(dummy(["data", "storage", null, new BracketString_1.BracketString()]));
            //entity
            root.then(dummy(["entity", new BracketString_1.BracketString()]));
            //predicate
            root.then(dummy(["predicate", null]));
            //score
            root.then(dummy(["score", new BracketString_1.BracketString(), null, "matches", null]));
            for (let op of ["<", "<=", "=", ">=", ">"]) {
                root.then(dummy([
                    "score",
                    new BracketString_1.BracketString(),
                    null,
                    op,
                    new BracketString_1.BracketString(),
                    null,
                ]));
            }
            return root;
        }
        //if
        //@ts-ignore
        root.then(conditional(B.literal("if")));
        //unless
        //@ts-ignore
        root.then(conditional(B.literal("unless")));
        //align
        root.then(dummy(["align", null]));
        //anchored
        root.then(dummy(["anchored", null]));
        //as
        root.then(dummy(["as", new BracketString_1.BracketString()]));
        //at
        root.then(dummy(["at", new BracketString_1.BracketString()]));
        //facing
        root.then(dummy([
            "facing",
            [
                [null, null, null],
                ["entity", new BracketString_1.BracketString()],
            ],
        ]));
        //in
        root.then(dummy(["in", null]));
        //positioned
        root.then(dummy(["positioned", null, null, null]));
        //rotated
        root.then(dummy([
            "rotated",
            [
                [null, null],
                ["as", new BracketString_1.BracketString()],
            ],
        ]));
        //store
        return root;
    }
    const c = B.literal("execute").then(B.literal("run").then(B.argument("command", B.greedyString()).executes((ctx) => {
        const cmd = ctx.getArgument("command");
        const input = ctx.getInput();
        if (cmd.startsWith("_block")) {
            const source = ctx.getSource();
            const name = cmd.split("_block").pop().trim();
            const executeCommand = input.substr(0, input.length - cmd.length - 1);
            return jsx_1.jsx(jsx_1.Raw, null,
                executeCommand,
                " function ",
                jsx_1.jsx(jsx_1.Func, null, asyncMap_1.asyncMap(file.getBlock(name), (async (item) => file.execute("generic", item, ctx.getSource())))));
            // MCF.join(
            //   executeCommand,
            //   " function ",
            //   new MCF(
            //     source.meta.groups[cmd.substr(6)].map((cmd: any) =>
            //       api.dispatch("generic", cmd, source, true)
            //     ),
            //     source.meta.func.generated
            //   )
            // );
        }
        else {
            return [input];
        }
    })));
    addArguments(c);
    GenericHost.register(c);
};
exports.bind = bind;

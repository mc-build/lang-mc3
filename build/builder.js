"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.builder = exports.reset_builder = void 0;
// @ts-ignore
const _io_1 = require("!io");
const path_1 = __importDefault(require("path"));
let gid = 0;
let seen, ns_data, directory_stack, file_path;
function findNamespaceFromFilepath(fp) {
    const segments = fp.replace(/\..+$/, "").split(path_1.default.sep);
    segments.splice(0, segments.lastIndexOf("src") + 1);
    const ns = segments.shift();
    return { namespace: ns, base: [...segments.slice(1)] };
}
function reset_builder(host) {
    seen = new Set();
    ns_data = findNamespaceFromFilepath(host.file_path);
    directory_stack = [];
    gid = 0;
    file_path = host.file_path;
}
exports.reset_builder = reset_builder;
function builder(item) {
    debugger;
    if (typeof item === "string")
        return item;
    const children = item.children.flat(Infinity);
    const attributes = item.attributes || {};
    switch (item.type) {
        default:
            debugger;
            break;
        case "ref":
            let { name, generated } = item.target.attributes;
            let _name = name || (gid++).toString();
            if (!name) {
                attributes.generated = true;
                generated = true;
            }
            attributes.name = _name;
            const complete = [...ns_data.base, generated ? "generated" : null, ...directory_stack, _name].filter(Boolean).join("/");
            return `${ns_data.namespace}:${complete}`;
        case "func": {
            let { name, generated } = attributes;
            const f = new _io_1.File();
            let _name = name || (gid++).toString();
            attributes.name = _name;
            if (!name) {
                attributes.generated = true;
                generated = true;
            }
            const complete = [...ns_data.base, generated ? "generated" : null, ...directory_stack, _name].filter(Boolean).join("/");
            f.setPath(path_1.default.resolve(process.cwd(), `data/${ns_data.namespace}/functions/${complete}.mcfunction`));
            f.setContents(children.map(builder).join("\n"));
            f.confirm(file_path);
            return `${ns_data.namespace}:${complete}`;
        }
        case "dir": {
            debugger;
            directory_stack.push(item.attributes.name);
            children.forEach((item) => {
                builder(item);
            });
            directory_stack.pop();
        }
        case "raw": {
            return children.map(builder).join("");
        }
    }
}
exports.builder = builder;

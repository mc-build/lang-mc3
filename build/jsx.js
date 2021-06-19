"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = exports.Dir = exports.Func = exports.Raw = exports.jsx = exports.ref = void 0;
function ref() {
    return {
        type: "ref",
        isRef: true,
        target: null,
        children: []
    };
}
exports.ref = ref;
async function jsx(name, props, ...children) {
    let res = {
        type: name,
        attributes: props,
        children: await Promise.all(children.flat(Infinity)),
    };
    if (typeof res.type === "function") {
        res = await res.type({ ...props, children: res.children });
    }
    if (props === null || props === void 0 ? void 0 : props.ref) {
        //@ts-ignore
        props.ref.target = res;
    }
    return res;
}
exports.jsx = jsx;
exports.Raw = "raw";
exports.Func = "func";
exports.Dir = "dir";
async function Command({ children, }) {
    return Promise.all(Array.isArray(children) ? children : [children]).then((res) => res.join(""));
}
exports.Command = Command;

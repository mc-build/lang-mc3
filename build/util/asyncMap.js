"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncMap = void 0;
const USE_ASYNC = false;
async function asyncMap(arr, fn) {
    let next = [];
    for (let i = 0; i < arr.length; i++) {
        if (USE_ASYNC)
            next.push(await fn(arr[i], i, arr));
        else
            next.push(fn(arr[i], i, arr));
    }
    return next;
}
exports.asyncMap = asyncMap;

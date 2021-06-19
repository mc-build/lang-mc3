"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashString = void 0;
const crypto_1 = require("crypto");
function hashString(str) {
    return crypto_1.createHash("md5").update(str).digest("hex");
}
exports.hashString = hashString;

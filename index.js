"use strict";

const MemoryAdapter = require("./lib/memory");
const DirectoryAdapter = require("./lib/directory");

module.exports = {
    MemoryAdapter: MemoryAdapter,
    DirectoryAdapter: DirectoryAdapter,
};

"use strict";

const Promise = require("bluebird");

const streamBuffers = require("stream-buffers");
const ReadableStreamBuffer = streamBuffers.ReadableStreamBuffer;
const WritableStreamBuffer = streamBuffers.WritableStreamBuffer;

module.exports = MemoryAdapter;

/**
 * Construct a new MemoryAdapter.
 *
 * @param {Object.<string, Buffer>} initialFiles The files already in this
 *     virtual directory.
 * @constructor
 */
function MemoryAdapter(initialFiles) {
    if (!(this instanceof MemoryAdapter)) {
        return new MemoryAdapter(initialFiles);
    }

    this.entries = new Map();

    // load initial file buffers
    if (typeof initialFiles === "object" && initialFiles) {
        Object.keys(initialFiles).forEach((fileName) => {
            const buf = Buffer.from(initialFiles[fileName]);
            this.entries.set(fileName, buf);
        });
    }
}

MemoryAdapter.prototype._ensureExists = function (fileName) {
    // throw ENOENT when file not found
    if (!this.entries.has(fileName)) {
        const err = new Error();
        err.code = "ENOENT";
        throw err;
    }
};

/**
 * Initialize this adapter.
 *
 * @return {Promise} A Promise for when initialization is done.
 */
MemoryAdapter.prototype.init = function () {
    // do nothing
    return Promise.resolve();
};

/**
 * Obtain a list of file names accessible through this adapter.
 *
 * @return {Promise<string[]>} A Promise that resolves to a file name array.
 */
MemoryAdapter.prototype.listFiles = function () {
    return Promise.resolve(Array.from(this.entries.keys()));
};

/**
 * Create a read stream for the given file name.
 *
 * @param {string} fileName The name of the file to read.
 * @return {stream.Readable} A readable stream for the file.
 */
MemoryAdapter.prototype.createReadStream = function (fileName) {
    this._ensureExists(fileName);

    const stream = new ReadableStreamBuffer();
    stream.put(this.entries.get(fileName));
    stream.stop();

    return stream;
};

/**
 * Create a write stream for the given file name.
 *
 * @param {string} fileName The name of the file to write.
 * @return {stream.Writable} A writable stream for the file.
 */
MemoryAdapter.prototype.createWriteStream = function (fileName) {
    const stream = new WritableStreamBuffer();
    stream.on("finish", () => {
        this.entries.set(fileName, stream.getContents());
    });
    return stream;
};

/**
 * Rename a file.
 *
 * @param {string} fileName The old file name.
 * @param {string} newFileName The new file name.
 * @return {Promise} A Promise that resolves when done, or rejects on error.
 */
MemoryAdapter.prototype.rename = function (fileName, newFileName) {
    return new Promise((resolve) => {
        this._ensureExists(fileName);
        this.entries.set(newFileName, this.entries.get(fileName));
        this.entries.delete(fileName);

        resolve();
    });
};

/**
 * Delete a file.
 *
 * @param {string} fileName The name of the file to delete.
 * @return {Promise} A Promise that resolves when done, or rejects on error.
 */
MemoryAdapter.prototype.delete = function (fileName) {
    return new Promise((resolve) => {
        this._ensureExists(fileName);
        this.entries.delete(fileName);

        resolve();
    });
};

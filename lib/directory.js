"use strict";

const Promise = require("bluebird");

const path = require("path");

const fs = require("fs");
const fsMkdir = Promise.promisify(fs.mkdir);
const fsAccess = Promise.promisify(fs.access);
const fsReaddir = Promise.promisify(fs.readdir);
const fsRename = Promise.promisify(fs.rename);
const fsUnlink = Promise.promisify(fs.unlink);

class DirectoryAdapter {
    /**
     * Construct a new DirectoryAdapter.
     *
     * @param {string} directory The path to the directory.
     */
    constructor (directory) {
        this.directory = directory;
    }

    _resolve (fileName) {
        if (path.isAbsolute(fileName)) {
            throw new Error("file name must be relative");
        }
        const abs = path.join(this.directory, fileName);
        const rel = path.relative(this.directory, abs);
        if (!rel) {
            // denotes the base directory
            throw new Error("trying to access base directory");
        }
        if (rel.indexOf("..") === 0 || path.isAbsolute(rel)) {
            // navigates outside the base directory
            throw new Error("trying to navigate outside base directory");
        }
        return abs;
    }

    /**
     * Initialize this adapter.
     *
     * @return {Promise} A Promise for when initialization is done.
     */
    init () {
        return fsMkdir(this.directory).catch((err) => {
            // ignore existing directory
            if (err.code !== "EEXIST") {
                throw err;
            }
        });
    }

    /**
     * Obtain a list of file names accessible through this adapter.
     *
     * @return {Promise<string[]>} A Promise that resolves to a file name array.
     */
    listFiles () {
        return fsReaddir(this.directory).catch((err) => {
            // ignore missing directory, simply return empty array
            if (err.code !== "ENOENT") {
                throw err;
            }
            return [];
        });
    }

    /**
     * Checks whether the given file name exists.
     *
     * @param {string} fileName The name of the file to check.
     * @return {Promise<boolean>} A promise returning whether or not this file exists.
     */
    exists (fileName) {
        return new Promise((fulfill) =>
            fsAccess(this._resolve(fileName), (fs.constants || fs).F_OK)
                .then(() => fulfill(true))
                .catch(() => fulfill(false)));
    }

    /**
     * Create a read stream for the given file name.
     *
     * @param {string} fileName The name of the file to read.
     * @return {stream.Readable} A readable stream for the file.
     */
    createReadStream (fileName) {
        return fs.createReadStream(this._resolve(fileName));
    }

    /**
     * Create a write stream for the given file name.
     *
     * @param {string} fileName The name of the file to write.
     * @return {stream.Writable} A writable stream for the file.
     */
    createWriteStream (fileName) {
        return fs.createWriteStream(this._resolve(fileName));
    }

    /**
     * Rename a file.
     *
     * @param {string} fileName The old file name.
     * @param {string} newFileName The new file name.
     * @return {Promise} A Promise that resolves when done, or rejects on error.
     */
    rename (fileName, newFileName) {
        return new Promise((fulfill) => {
            const from = this._resolve(fileName);
            const to = this._resolve(newFileName);

            fulfill(fsRename(from, to));
        });
    }

    /**
     * Delete a file.
     *
     * @param {string} fileName The name of the file to delete.
     * @return {Promise} A Promise that resolves when done, or rejects on error.
     */
    delete (fileName) {
        return new Promise((fulfill) => {
            const resolved = this._resolve(fileName);

            fulfill(fsUnlink(resolved));
        });
    }
}

module.exports = DirectoryAdapter;

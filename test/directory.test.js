"use strict";

const chai = require("chai");
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const path = require("path");

const RESOURCES_DIR = path.join(__dirname, "res");

const DirectoryAdapter = require("../lib/directory.js");

describe("lib/directory.js", function () {

    describe("constructor", function () {

        it("instantiates when invoked as a function", function () {
            expect(DirectoryAdapter(RESOURCES_DIR))
                .to.be.instanceOf(DirectoryAdapter);
        });

    });

    describe("#_resolve()", function () {

        it("throws when resolving to base directory itself", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            expect(() => obj._resolve("")).to.throw();
            expect(() => obj._resolve(".")).to.throw();
            expect(() => obj._resolve("./")).to.throw();
            expect(() => obj._resolve("foo/..")).to.throw();
            expect(() => obj._resolve("foo/../")).to.throw();
            expect(() => obj._resolve(RESOURCES_DIR)).to.throw();
        });

        it("throws when resolving to a parent directory", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            expect(() => obj._resolve("..")).to.throw();
            expect(() => obj._resolve("../../")).to.throw();
        });

        it("throws when resolving some other file", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            expect(() => obj._resolve("../directory.test.js")).to.throw();
            expect(() => obj._resolve("foo/../../directory.test.js")).to.throw();
        });

        it("throws when resolving an absolute path", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            expect(() => obj._resolve(RESOURCES_DIR + "/foo.bin")).to.throw();
        });

    });

    describe("#init()", function () {

        it("returns a Promise", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            return expect(obj.init()).to.eventually.be.fulfilled;
        });

    });

    describe("#listFiles()", function () {

        it("resolves to an array", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            return expect(obj.listFiles()).to.eventually.be.an("array");
        });

        it("includes existing files", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            return expect(obj.listFiles()).to.eventually.be.an("array")
                .that.includes("test.txt");
        });

    });

    describe("#createReadStream()", function () {

        it("throws for missing files", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            return expect(() => obj.createReadStream("doesnotexist.txt")).to.throw;
        });

        it("obtains readable streams for existing files", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            return expect(obj.createReadStream("test.txt"))
                .to.be.an("object")
                .with.property("read").that.is.a("function");
        });

        it("reads data", function (done) {
            const expected = Buffer.from("hello world", "utf8");
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            const stream = obj.createReadStream("test.txt");
            stream.on("data", function (chunk) {
                expect(chunk).to.satisfy((c) => expected.equals(c));
                done();
            });
        });

    });

    describe("#createWriteStream()", function () {

        it("returns writable streams", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            return expect(obj.createWriteStream("foo.bin"))
                .to.be.an("object")
                .with.property("write").that.is.a("function");
        });

        it("writes data", function (done) {
            const data = Buffer.from("t" + Date.now(), "utf8");
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            const stream = obj.createWriteStream("foo.bin");
            stream.on("finish", function () {
                const read = obj.createReadStream("foo.bin");
                read.on("data", function (chunk) {
                    expect(chunk).to.satisfy((c) => data.equals(c));
                    done();
                });
            });
            stream.end(data);
        });

    });

    describe("#rename()", function () {

        it("rejects for nonexistent files", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            return expect(obj.rename("doesnotexist.txt", "bar.txt"))
                .to.eventually.be.rejected;
        });

        it("succeeds for existing files", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            return expect(obj.rename("foo.bin", "foo.bin"))
                .to.eventually.be.fulfilled;
        });

    });

    describe("#delete()", function () {

        it("rejects for nonexistent files", function () {
            const obj = new DirectoryAdapter(RESOURCES_DIR);
            return expect(obj.delete("doesnotexist.txt"))
                .to.eventually.be.rejected;
        });

    });

});

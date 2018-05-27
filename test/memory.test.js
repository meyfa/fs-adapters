"use strict";

const chai = require("chai");
chai.use(require("chai-as-promised"));
const expect = chai.expect;

const MemoryAdapter = require("../lib/memory.js");

describe("lib/memory.js", function () {

    describe("constructor", function () {

        it("instantiates when invoked as a function", function () {
            expect(MemoryAdapter()).to.be.instanceOf(MemoryAdapter);
        });

    });

    describe("#init()", function () {

        it("returns a Promise", function () {
            const obj = new MemoryAdapter();
            return expect(obj.init()).to.eventually.be.fulfilled;
        });

    });

    describe("#listFiles()", function () {

        it("resolves to an array", function () {
            const obj = new MemoryAdapter();
            return expect(obj.listFiles()).to.eventually.be.an("array");
        });

        it("includes initial files", function () {
            const obj = new MemoryAdapter({
                "foo": Buffer.alloc(0),
                "bar.tmp": Buffer.alloc(0),
                "baz": Buffer.alloc(0),
            });
            return expect(obj.listFiles()).to.eventually.be.an("array")
                .with.members(["foo", "bar.tmp", "baz"]);
        });

    });

    describe("#createReadStream()", function () {

        it("throws for missing files", function () {
            const obj = new MemoryAdapter();
            return expect(() => obj.createReadStream("foo")).to.throw;
        });

        it("obtains readable streams for existing files", function () {
            const obj = new MemoryAdapter({
                "foo": Buffer.alloc(0),
            });
            return expect(obj.createReadStream("foo"))
                .to.be.an("object")
                .with.property("read").that.is.a("function");
        });

        it("reads data", function (done) {
            const data = Buffer.from("hello world", "utf8");
            const obj = new MemoryAdapter({
                "foo": data,
            });
            const stream = obj.createReadStream("foo");
            stream.on("data", function (chunk) {
                expect(chunk).to.satisfy((c) => data.equals(c));
                done();
            });
        });

    });

    describe("#createWriteStream()", function () {

        it("returns writable streams", function () {
            const obj = new MemoryAdapter();
            return expect(obj.createWriteStream("foo"))
                .to.be.an("object")
                .with.property("write").that.is.a("function");
        });

        it("writes data", function (done) {
            const obj = new MemoryAdapter();
            const stream = obj.createWriteStream("foo");
            stream.on("finish", function () {
                const read = obj.createReadStream("foo");
                read.on("data", function (chunk) {
                    const expected = Buffer.from("hello world", "utf8");
                    expect(chunk).to.satisfy((c) => expected.equals(c));
                    done();
                });
            });
            stream.end("hello world", "utf8");
        });

        it("adds to the list of files", function (done) {
            const obj = new MemoryAdapter();
            const stream = obj.createWriteStream("foo");
            stream.on("finish", function () {
                expect(obj.listFiles()).to.eventually.be.an("array")
                    .with.members(["foo"])
                    .notify(done);
            });
            stream.end();
        });

    });

    describe("#rename()", function () {

        it("rejects for nonexistent files", function () {
            const obj = new MemoryAdapter();
            return expect(obj.rename("foo", "bar")).to.eventually.be.rejected;
        });

        it("renames files", function () {
            const obj = new MemoryAdapter({
                "foo": Buffer.alloc(0),
            });
            return obj.rename("foo", "bar").then(() => {
                return expect(obj.listFiles())
                    .to.eventually.include("bar").but.not.include("foo");
            });
        });

        it("keeps contents", function (done) {
            const data = Buffer.from("hello world", "utf8");
            const obj = new MemoryAdapter({
                "foo": data,
            });
            obj.rename("foo", "bar").then(() => {
                const read = obj.createReadStream("bar");
                read.on("data", function (chunk) {
                    expect(chunk).to.satisfy((c) => data.equals(c));
                    done();
                });
            });
        });

    });

    describe("#delete()", function () {

        it("rejects for nonexistent files", function () {
            const obj = new MemoryAdapter();
            return expect(obj.delete("foo")).to.eventually.be.rejected;
        });

        it("deletes files", function () {
            const obj = new MemoryAdapter({
                "foo": Buffer.alloc(0),
            });
            return obj.delete("foo").then(() => {
                return expect(obj.listFiles()).to.eventually.not.include("foo");
            });
        });

    });

});

'use strict'

const chai = require('chai')
chai.use(require('chai-as-promised'))
const expect = chai.expect

const Adapter = require('../lib/base.js')
const MemoryAdapter = require('../lib/memory.js')
const DirectoryAdapter = require('../lib/directory.js')

const index = require('../index.js')

describe('index.js', function () {
  describe('#Adapter', function () {
    it('exists', function () {
      expect(index.Adapter).to.exist
    })

    it('is the Adapter constructor', function () {
      expect(index.Adapter).to.equal(Adapter)
    })
  })

  describe('#MemoryAdapter', function () {
    it('exists', function () {
      expect(index.MemoryAdapter).to.exist
    })

    it('is the MemoryAdapter constructor', function () {
      expect(index.MemoryAdapter).to.equal(MemoryAdapter)
    })
  })

  describe('#DirectoryAdapter', function () {
    it('exists', function () {
      expect(index.DirectoryAdapter).to.exist
    })

    it('is the DirectoryAdapter constructor', function () {
      expect(index.DirectoryAdapter).to.equal(DirectoryAdapter)
    })
  })
})

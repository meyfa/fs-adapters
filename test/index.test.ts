import { Adapter } from '../src/adapter'
import { MemoryAdapter } from '../src/memory-adapter'
import { DirectoryAdapter } from '../src/directory-adapter'

import * as index from '../src/index'

import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

describe('index.ts', function () {
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

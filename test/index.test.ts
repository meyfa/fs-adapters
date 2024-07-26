import assert from 'node:assert'
import { Adapter } from '../src/adapter.js'
import { MemoryAdapter } from '../src/memory-adapter.js'
import { DirectoryAdapter } from '../src/directory-adapter.js'
import * as index from '../src/index.js'

describe('index.ts', function () {
  describe('#Adapter', function () {
    it('exists', function () {
      assert.ok(index.Adapter != null)
    })

    it('is the Adapter constructor', function () {
      assert.strictEqual(index.Adapter, Adapter)
    })
  })

  describe('#MemoryAdapter', function () {
    it('exists', function () {
      assert.ok(index.MemoryAdapter != null)
    })

    it('is the MemoryAdapter constructor', function () {
      assert.strictEqual(index.MemoryAdapter, MemoryAdapter)
    })
  })

  describe('#DirectoryAdapter', function () {
    it('exists', function () {
      assert.ok(index.DirectoryAdapter != null)
    })

    it('is the DirectoryAdapter constructor', function () {
      assert.strictEqual(index.DirectoryAdapter, DirectoryAdapter)
    })
  })
})

'use strict'

const Adapter = require('./lib/base')
const MemoryAdapter = require('./lib/memory')
const DirectoryAdapter = require('./lib/directory')

module.exports = {
  Adapter,
  MemoryAdapter,
  DirectoryAdapter
}

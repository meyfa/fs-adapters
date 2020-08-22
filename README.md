# fs-adapters

[![Build Status](https://travis-ci.com/meyfa/fs-adapters.svg?branch=master)](https://travis-ci.com/meyfa/fs-adapters)
[![Test Coverage](https://api.codeclimate.com/v1/badges/82c10c63edb8ba33bfdb/test_coverage)](https://codeclimate.com/github/meyfa/fs-adapters/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/82c10c63edb8ba33bfdb/maintainability)](https://codeclimate.com/github/meyfa/fs-adapters/maintainability)

Minimal JavaScript interfaces for file system abstraction


## Install

```
npm i fs-adapters
```


## Specification

### `async init()`

Initialize the adapter. This would create the underlying directory, for example,
or connect to the storage API, etc.

**Returns:** `Promise` A Promise for when initialization is done.

### `async listFiles()`

Obtain a list of file names accessible through the adapter.

**Returns:** `Promise<string[]>` A Promise that resolves to a file name array.

### `async exists(fileName)`

Checks whether the given file name exists.

**Parameter `fileName`:** The name of the file to check.<br />
**Returns:** `Promise<boolean>` A promise returning whether or not this file exists.

### `async rename(fileName, newFileName)`

Rename a file.

**Parameter `fileName`:** The old file name.<br />
**Parameter `newFileName`:** The new file name.<br />
**Returns:** `Promise` A Promise that resolves when done, or rejects on error.

### `async delete(fileName)`

Delete a file.

**Parameter `fileName`:** The name of the file to delete.<br />
**Returns:** `Promise` A Promise that resolves when done, or rejects on error.

### `createReadStream(fileName)`

Create a read stream for the given file name.

**Parameter `fileName`:** The name of the file to read.<br />
**Returns:** `stream.Readable` A readable stream for the file.

### `createWriteStream(fileName)`

Create a write stream for the given file name.

**Parameter `fileName`:** The name of the file to write.<br />
**Returns:** `stream.Readable` A writable stream for the file.


## Implementations

### MemoryAdapter

This adapter implements the above specification by storing all data and metadata
in the process memory. It is therefore not dependent on the actual file system
and highly suitable for test scenarios, for example.

#### Constructor

```javascript
new MemoryAdapter(initialFiles)
```

**Parameter `initialFiles`:** (optional) An object mapping file names to their
contents (instances of `Buffer`).

#### Usage Example

```javascript
const MemoryAdapter = require('fs-adapters').MemoryAdapter

const adapter = new MemoryAdapter({
  'foo.txt': Buffer.from('hello world', 'utf8'),
  'empty.bin': Buffer.alloc(0)
})

adapter.init().then(() => {
  adapter.listFiles().then((files) => {
    console.log(files) // ['foo.txt', 'empty.bin']
  })
})
```

### DirectoryAdapter

This adapter reads from and writes to a specific base directory. All file names
are interpreted as relative to the base directory, and navigating outside that
directory (e.g. via `..`) or accessing the directory itself (e.g. via `.`)
results in an error.

#### Constructor

```javascript
new DirectoryAdapter(directory)
```

**Parameter `directory`:** The absolute path to the base directory.

#### Usage Example

```javascript
const DirectoryAdapter = require('fs-adapters').DirectoryAdapter
const path = require('path')

const directory = path.join(__dirname, 'data')
const adapter = new DirectoryAdapter(directory)

adapter.init().then(() => {
  // do something with adapter
})
```


## Extending

This is a loose specification, and JavaScript is a weakly typed language. As
such, creating a new adapter is as simple as writing a class with the specified
methods.

Yet, to facilitate implementation and ensure perfect interoperability between
adapters, it is recommended for adapter implementations to extend the common
subclass `Adapter`. Example:

```js
const FSAdapter = require('fs-adapters').Adapter

class CustomAdapter extends FSAdapter {
  // implement methods here
}
```

The default implementations supplied within this package all extend `Adapter`.

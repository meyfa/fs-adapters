# fs-adapters

[![CI](https://github.com/meyfa/fs-adapters/actions/workflows/main.yml/badge.svg)](https://github.com/meyfa/fs-adapters/actions/workflows/main.yml)
[![Test Coverage](https://api.codeclimate.com/v1/badges/82c10c63edb8ba33bfdb/test_coverage)](https://codeclimate.com/github/meyfa/fs-adapters/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/82c10c63edb8ba33bfdb/maintainability)](https://codeclimate.com/github/meyfa/fs-adapters/maintainability)

This package provides minimal JavaScript interfaces for file system abstraction.
It tries to include enough to be comfortable for users, without being a burden
on implementers.

The main use case is test instrumentation via dependency injection.
Production code could use the directory adapter for persistent storage, while
unit tests might use the memory adapter instead.

Still, at its heart this is just an interface, and can be implemented to fit any
number of backends. Creating custom adapter types might enable you to swap cloud
with local storage on the fly, for example.


## Install

```
npm i fs-adapters
```


## Specification

### `async init()`

Initialize the adapter. This would create the underlying directory, for example,
or connect to the storage API, etc.

- Returns: `<Promise>` A Promise for when initialization is done.


### `async listFiles()`

Obtain a list of file names accessible through the adapter.

- Returns: `<Promise<string[]>>` A Promise resolving to a file name array.


### `async exists(fileName)`

Checks whether the given file name exists.

- **`fileName`** `<string>`: The name of the file to check.
- Returns: `<Promise<boolean>>` A promise resolving to whether or not this file
    exists.


### `async rename(fileName, newFileName)`

Rename a file.

- **`fileName`** `<string>`: The old file name.
- **`newFileName`** `<string>`: The new file name.
- Returns: `<Promise>` A Promise that resolves when done, or rejects on error.


### `async delete(fileName)`

Delete a file.

- **`fileName`** `<string>` The name of the file to delete.
- Returns: `<Promise>` A Promise that resolves when done, or rejects on error.


### `createReadStream(fileName)`

Create a read stream for the given file name. This should be preferred over
`read()` when the file is potentially large or does not need to be in memory all
at once.

- **`fileName`** `<string>` The name of the file to read.
- Returns: `<stream.Readable>` A readable stream for the file.


### `createWriteStream(fileName)`

Create a write stream for the given file name.

- **`fileName`** `<string>` The name of the file to write.
- Returns: `<stream.Readable>` A writable stream for the file.


## `async read(fileName[, options])`

Read the file whole, resolving to its contents as a Buffer. If an encoding is
specified, this will convert the buffer to a string and resolve to that.

- **`fileName`** `<string>` The name of the file to read.
- **`options`** `<object|string>`
  - **`encoding`** `<string|null>`: encoding to use for string conversion.
      Default: `null`
- Returns: `<Promise<Buffer|string>>` A Promise that resolves to the file
    contents, or rejects on error.

If options is a string, it is treated as the encoding.


## `async write(fileName, data[, options])`

Write to the given file name in one go.

- **`fileName`** `<string>` The name of the file to read.
- **`data`** `<Buffer|string>` The file contents to write.
- **`options`** `<object|string>`
  - **`encoding`** `<string>`: encoding to use if data is a string.
      Default: `'utf8'`
- Returns: `<Promise>` A Promise that resolves when done, or rejects on error.

If options is a string, it is treated as the encoding.


## Implementations

### MemoryAdapter

This adapter implements the above specification by storing all data and metadata
in the process memory. It is therefore not dependent on the actual file system
and highly suitable for test scenarios, for example.

#### Constructors

```javascript
new MemoryAdapter()
new MemoryAdapter(initialFiles)
```

- **`initialFiles`** `<object | Map | Array[]>` (optional) A mapping from file
  names to their contents (instances of `Buffer` or string data).

#### Usage Example

```javascript
const { MemoryAdapter } = require('fs-adapters')

const adapter = new MemoryAdapter({
  'foo.txt': Buffer.from('hello world', 'utf8'),
  'empty.bin': Buffer.alloc(0)
})

// alternatively:
new MemoryAdapter(new Map([
  ['foo.txt', Buffer.from('hello world', 'utf8')],
  ['empty.bin', Buffer.alloc(0)]
]))

// or even:
new MemoryAdapter([
  ['foo.txt', 'hello world'],
  ['empty.bin', Buffer.alloc(0)]
])

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

#### Constructors

```javascript
new DirectoryAdapter(directory)
```

- **`directory`** `<string>` The absolute path to the base directory.

#### Usage Example

```javascript
const { DirectoryAdapter } = require('fs-adapters')
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
adapters, it is recommended that implementers extend the common superclass
`Adapter`. All implementations supplied with this package (MemoryAdapter,
DirectoryAdapter) do this. Example:

```js
const FSAdapter = require('fs-adapters').Adapter

class CustomAdapter extends FSAdapter {
  // implement methods here
}
```

The `Adapter` class provides default implementations for the following methods:

- `init()`: does nothing by default
- `read(...)`: creates a read stream and wraps it into a promise
- `write(...)`: creates a write stream and wraps it into a promise

It is recommended that implementers override these default implementations when
they can provide something more efficient.

# Changelog

## [7.0.0](https://github.com/meyfa/fs-adapters/compare/v6.2.0...v7.0.0) (2023-06-24)


### ⚠ BREAKING CHANGES

* Drop support for Node.js older than v18.16.1 ([#156](https://github.com/meyfa/fs-adapters/issues/156))

### Bug Fixes

* Fix linter warnings ([#155](https://github.com/meyfa/fs-adapters/issues/155)) ([c48908c](https://github.com/meyfa/fs-adapters/commit/c48908ce60da9b06fbc6268f063e263235de8dfb))
* Simplify getErrorCode() using TypeScript 4.9's "in" inference ([#113](https://github.com/meyfa/fs-adapters/issues/113)) ([54bea82](https://github.com/meyfa/fs-adapters/commit/54bea82dd6e4bafa630cb963f513a15328d083ce))


### Miscellaneous Chores

* Drop support for Node.js older than v18.16.1 ([#156](https://github.com/meyfa/fs-adapters/issues/156)) ([4c330e6](https://github.com/meyfa/fs-adapters/commit/4c330e64e3a292b44ecba8edec136a38d708527f))

## [6.2.0](https://github.com/meyfa/fs-adapters/compare/v6.1.0...v6.2.0) (2022-09-02)


### Features

* **types:** Export ReadWriteOptions ([#89](https://github.com/meyfa/fs-adapters/issues/89)) ([e258a17](https://github.com/meyfa/fs-adapters/commit/e258a1721407b9058d2babe1ac2ed9ac4b682b65))


### Bug Fixes

* Use file extensions in imports ([#74](https://github.com/meyfa/fs-adapters/issues/74)) ([13f3db6](https://github.com/meyfa/fs-adapters/commit/13f3db6e7b6020f02aab91cf5eb9a01fb1bf90e5))

## [6.1.0](https://github.com/meyfa/fs-adapters/compare/v6.0.2...v6.1.0) (2022-06-12)

* fix: Use override keyword for additional inheritance safety ([#39](https://github.com/meyfa/fs-adapters/pull/39))
* refactor: Move all source code into 'src/' ([#64](https://github.com/meyfa/fs-adapters/pull/64))
* docs: Remove type annotations from JSDoc comments ([#65](https://github.com/meyfa/fs-adapters/pull/65))
* chore: Use c8 for coverage instead of nyc ([#63](https://github.com/meyfa/fs-adapters/pull/63))
* ci: Test on Node.js 18 ([#56](https://github.com/meyfa/fs-adapters/pull/56))
* chore(deps): pin dependencies ([#19](https://github.com/meyfa/fs-adapters/pull/19))
* Lots of dev dependency updates


## [6.0.2](https://github.com/meyfa/fs-adapters/compare/v6.0.1...v6.0.2) (2021-11-16)

* chore(test): Replace ts-mocha with ts-node ([#15](https://github.com/meyfa/fs-adapters/pull/15))
* chore(ci): Run 'tsc --noEmit' during linting ([#16](https://github.com/meyfa/fs-adapters/pull/16))
* refactor: Update lint dependencies and improve catch type safety ([#17](https://github.com/meyfa/fs-adapters/pull/17))


## [6.0.1](https://github.com/meyfa/fs-adapters/compare/v6.0.0...v6.0.1) (2021-07-07)

* fix: TypeScript types were exported incorrectly


## [6.0.0](https://github.com/meyfa/fs-adapters/compare/v5.0.0...v6.0.0) (2021-07-06)

**Note: This release is broken, please use a later version.**

### Features

* Completely written in **TypeScript** from now on (definitions are included in the package, of course!) ([#9](https://github.com/meyfa/fs-adapters/pull/9), [#12](https://github.com/meyfa/fs-adapters/pull/12), [#13](https://github.com/meyfa/fs-adapters/pull/13))

### Enhancements

* Explicitly forbid sub-directories in DirectoryAdapter ([#11](https://github.com/meyfa/fs-adapters/pull/11))

### Backend Work

* Set Node engine to 12 or later ([#10](https://github.com/meyfa/fs-adapters/pull/10))
* Update dependencies ([#4](https://github.com/meyfa/fs-adapters/pull/4), [#5](https://github.com/meyfa/fs-adapters/pull/5), [#6](https://github.com/meyfa/fs-adapters/pull/6), [#7](https://github.com/meyfa/fs-adapters/pull/7), [#9](https://github.com/meyfa/fs-adapters/pull/9))
* Use GitHub Actions ([#8](https://github.com/meyfa/fs-adapters/pull/8))


## [5.0.0](https://github.com/meyfa/fs-adapters/compare/v4.0.0...v5.0.0) (2020-09-28)

### Features

* Allow options to be a string for easier specification of encoding in `read`/`write` ([360e2aa](https://github.com/meyfa/fs-adapters/commit/360e2aa049cfa3c6d0fe868d7390e5232fa44223))

### Backend work

* Stop building on Node 13 ([f000564](https://github.com/meyfa/fs-adapters/commit/f00056479b86d0b7be0e104887c15eaebb08bb81))
* Add introduction text to README.md ([56757b6](https://github.com/meyfa/fs-adapters/commit/56757b6c291e7f8edaced243cba70cca2d9e6a91))


## [4.0.0](https://github.com/meyfa/fs-adapters/compare/v3.0.0...v4.0.0) (2020-09-11)

### Features

* Add common `Adapter` parent class ([f0fc48d](https://github.com/meyfa/fs-adapters/commit/f0fc48d7fe84b1a2cbd818c440a5242f2f0bb730))
* Add async `read()` and `write()` methods ([2183996](https://github.com/meyfa/fs-adapters/commit/2183996310d8432a6ebfc4f3ee0de5ceca0fe6da), [b9ee3a6](https://github.com/meyfa/fs-adapters/commit/b9ee3a609cf9aba575397083fd42579a50701e56), [14ef597](https://github.com/meyfa/fs-adapters/commit/14ef5971bf39955c3139811a8404613c5fedc441), [66116dc](https://github.com/meyfa/fs-adapters/commit/66116dc02b59dbbd9f7827bf09f20e82db4c2fbe))
  - encoding support ([9642bd8](https://github.com/meyfa/fs-adapters/commit/9642bd8f880639125c41f8f720fa7a9d0a679dab))
* Add MemoryAdapter constructor for Map/Array ([ccdec38](https://github.com/meyfa/fs-adapters/commit/ccdec384fcb633e0f7fd0ebc66ba144fca127e70))

### Enhancements

* Ensure `DirectoryAdapter::init` actually creates the directory ([5f6118b](https://github.com/meyfa/fs-adapters/commit/5f6118b51799957f94f7f9b73d7d376c1b9ea562))
* Check file name validity in `MemoryAdapter` ([208f3fd](https://github.com/meyfa/fs-adapters/commit/208f3fdd0950c19827c3130c96bde8bb0023dc5c))

### Backend Work

* Set Node engine to 10 or later ([e57a875](https://github.com/meyfa/fs-adapters/commit/e57a87598f72be2615127541519199b9ef976878))
* Overhaul unit tests ([69badda](https://github.com/meyfa/fs-adapters/commit/69badda34a460dc7bed953d56b45af31286ce89a), [5e8c12d](https://github.com/meyfa/fs-adapters/commit/5e8c12d4ed6cde8e17766631ca0e1d3ab37b40b0), [1799155](https://github.com/meyfa/fs-adapters/commit/17991554afc3bdd09937713d7f0ebf7022a0c23a), [09a83b2](https://github.com/meyfa/fs-adapters/commit/09a83b274d03879fbc6d522f4fd20e680a5fbde1), [1c58994](https://github.com/meyfa/fs-adapters/commit/1c58994adcbc8401ae4a9d6aaa30ffa9cc6ce89d), [81412f0](https://github.com/meyfa/fs-adapters/commit/81412f0edb541e3fa953d582bfe86d553f59bc84), [5ad69b1](https://github.com/meyfa/fs-adapters/commit/5ad69b17daad0ae1c95db1ba29c2a3742eeccfe7), [2b49e38](https://github.com/meyfa/fs-adapters/commit/2b49e38cdd5780155ebddea2d79cfeacae25d48c), [7a85cfc](https://github.com/meyfa/fs-adapters/commit/7a85cfc894df526cff4c722f42423ed7d752dbe0))
* Improve documentation ([8c66c75](https://github.com/meyfa/fs-adapters/commit/8c66c754ab766f762ccdf4a72a3902cf82fe8584))
* Update .gitignore to include all of /test/res/ ([08e67dd](https://github.com/meyfa/fs-adapters/commit/08e67dd5f40650c9c5db1ca9f855f1186b89be7c))
* Update dependencies ([bd81a5b](https://github.com/meyfa/fs-adapters/commit/bd81a5b0a96f4733da21d9c03396f672358d0061), [6439f5f](https://github.com/meyfa/fs-adapters/commit/6439f5f0fba932df9e2b574d39f8a3e3858bc0c0))


## [3.0.0](https://github.com/meyfa/fs-adapters/compare/v2.0.1...v3.0.0) (2020-03-21)

* Update dependencies, require Node 10 or later ([7c4a934](https://github.com/meyfa/fs-adapters/commit/7c4a93465e1d5c793cc83096b478538d733ba068))
* Use JS standard style with ESLint ([1ae2234](https://github.com/meyfa/fs-adapters/commit/1ae2234de1f914e444f4ac2a20dff9b223f23ccd))
* Remove bluebird dependency ([7f0d2c0](https://github.com/meyfa/fs-adapters/commit/7f0d2c0670bdcf0157dadda36f0075c19c130179))
* Use async instead of explicit promises ([59bfc04](https://github.com/meyfa/fs-adapters/commit/59bfc0425bf8a1ddf13553fcaa1e7f22ffad0fed))
* Update README.md ([bcaa7e6](https://github.com/meyfa/fs-adapters/commit/bcaa7e6cb7819375d1ce3dd56e4aa170be93b2cf))
* Fix MemoryAdapter deleting file with same-name rename ([27d4a13](https://github.com/meyfa/fs-adapters/commit/27d4a133db35b6984443326f08edda1d2175772f))
* Remove .codeclimate.yml, add .npmignore ([4cf832c](https://github.com/meyfa/fs-adapters/commit/4cf832c98042efc7b76f1b155a8c0beee73d1c80))


## [2.0.1](https://github.com/meyfa/fs-adapters/compare/v2.0.0...v2.0.1) (2020-02-03)

* Fix missing argument in `DirectoryAdapter#delete()` ([96b9f00](https://github.com/meyfa/fs-adapters/commit/96b9f0045b41612d0c0b05fe623c444083da6683))
* Update dependencies ([1a620ff](https://github.com/meyfa/fs-adapters/commit/1a620ff0fa78da2c4b53961a7b06455301f4fb69))


## [2.0.0](https://github.com/meyfa/fs-adapters/compare/v1.0.0...v2.0.0) (2019-11-17)

See commit: [39cd31c](https://github.com/meyfa/fs-adapters/commit/39cd31c2b7c3e320da140a4651f2e538ef229ea3)

- Require Node version 8 or higher
- Use ES6 classes
- Update dependencies


## [1.0.0](https://github.com/meyfa/fs-adapters/compare/v0.1.1...v1.0.0) (2018-06-03)

- Add `adapter.exists(fileName)` ([#2](https://github.com/meyfa/fs-adapters/pull/2)) ([d5b9472](https://github.com/meyfa/fs-adapters/commit/d5b947269d3b8464426e7b155961fce76ece7572), [54a1508](https://github.com/meyfa/fs-adapters/commit/54a1508261e4da285a8c26b9cb414177d187f61d), [61d70fd](https://github.com/meyfa/fs-adapters/commit/61d70fd2c1f106707326450798f9da8f3919e556))
- Setup CodeClimate test coverage ([640d5cb](https://github.com/meyfa/fs-adapters/commit/640d5cb2d6ec4cca77e300aad8f8cb7c65028130))


## [0.1.1](https://github.com/meyfa/fs-adapters/compare/aa8df8e6eb48530866a44cb836e68193f0723081...v0.1.1) (2018-05-27)

Initial release

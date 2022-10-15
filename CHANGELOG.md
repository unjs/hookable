# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [5.4.1](https://github.com/unjs/hookable/compare/v5.4.0...v5.4.1) (2022-10-15)


### Bug Fixes

* accept any hookable ([#53](https://github.com/unjs/hookable/issues/53)) ([0eac02c](https://github.com/unjs/hookable/commit/0eac02cc6f975990ca458a587007f3bfd33e8a95))
* allow parallel hooks with unique time strings ([#55](https://github.com/unjs/hookable/issues/55)) ([ee64dc8](https://github.com/unjs/hookable/commit/ee64dc8299d15367eb2c62806c5b96eb1f88db32))
* handle case where hook adds debugger ([#54](https://github.com/unjs/hookable/issues/54)) ([f6d4475](https://github.com/unjs/hookable/commit/f6d4475166a5941f6fba16f836c2c8e91971b974))

## [5.4.0](https://github.com/unjs/hookable/compare/v5.3.0...v5.4.0) (2022-10-13)


### Features

* add `createDebugger` utility ([#51](https://github.com/unjs/hookable/issues/51)) ([021eb34](https://github.com/unjs/hookable/commit/021eb34d999b61d8189cc1c10116252588dba34f))

## [5.3.0](https://github.com/unjs/hookable/compare/v5.2.2...v5.3.0) (2022-09-02)


### Features

* allow registering a hook without showing deprecated message ([0fcd787](https://github.com/unjs/hookable/commit/0fcd787fd2fd0fd8b660dda8706b90cc4bf14ba8))


### Bug Fixes

* show deprecation warning only once ([526e4dc](https://github.com/unjs/hookable/commit/526e4dc821e6edae51245f0cd44f0ba938719776))

### [5.2.2](https://github.com/unjs/hookable/compare/v5.2.1...v5.2.2) (2022-08-23)


### Bug Fixes

* only specify return type for `callHook`/`callHookParallel` ([ed0d6a8](https://github.com/unjs/hookable/commit/ed0d6a82d8aa11044851888ab5c71ccbe4369c69))

### [5.2.1](https://github.com/unjs/hookable/compare/v5.2.0...v5.2.1) (2022-08-23)


### Bug Fixes

* ensure calling hooks always returns a promise ([44679c8](https://github.com/unjs/hookable/commit/44679c890f7b3b92331bd5dffeac95b61eab2858))

## [5.2.0](https://github.com/unjs/hookable/compare/v5.1.2...v5.2.0) (2022-08-23)


### Features

* add `beforeEach` and `afterEach` spies ([#46](https://github.com/unjs/hookable/issues/46)) ([949d8b7](https://github.com/unjs/hookable/commit/949d8b76817dfc47e6b1ce4ed09204e7c33d0ec1))


### Bug Fixes

* deprecate hooks doesn't have to be passed all hooks ([#48](https://github.com/unjs/hookable/issues/48)) ([0c4fef0](https://github.com/unjs/hookable/commit/0c4fef0d39ccd123efca29a9506854f01ae685f7))

### [5.1.2](https://github.com/unjs/hookable/compare/v5.1.1...v5.1.2) (2022-08-23)


### Bug Fixes

* handle deprecated hooks after being registred ([23d9ff4](https://github.com/unjs/hookable/commit/23d9ff4f1313148942990e5e078d91838f78e8c2))

### [5.1.1](https://github.com/unjs/hookable/compare/v5.1.0...v5.1.1) (2021-12-21)


### Bug Fixes

* always return caller result ([e9c51df](https://github.com/unjs/hookable/commit/e9c51df612a2eb5f42cf7c2f2c3f61b2539bcfae))

## [5.1.0](https://github.com/unjs/hookable/compare/v5.0.0...v5.1.0) (2021-12-20)


### Features

* `callHookParallel` and `callHookWith` ([#35](https://github.com/unjs/hookable/issues/35)) ([4a8cc53](https://github.com/unjs/hookable/commit/4a8cc538a4fb938bfdf13d70a9158714b3d603b9))

## [5.0.0](https://github.com/unjs/hookable/compare/v5.0.0-2...v5.0.0) (2021-09-01)


### Bug Fixes

* type nested/namespaced hooks ([#32](https://github.com/unjs/hookable/issues/32)) ([a0d9146](https://github.com/unjs/hookable/commit/a0d9146c40fb9767842564225444c6c5a7dce70f))

## [5.0.0-2](https://github.com/unjs/hookable/compare/v5.0.0-1...v5.0.0-2) (2021-08-27)


### Bug Fixes

* allow type inference for `hook`, `hookOnce` and `removeHook` ([#29](https://github.com/unjs/hookable/issues/29)) ([22b74d3](https://github.com/unjs/hookable/commit/22b74d30805f35000709ba32220e6e4e059f4cc5))

## [5.0.0-1](https://github.com/unjs/hookable/compare/v5.0.0-0...v5.0.0-1) (2021-08-27)


### Bug Fixes

* allow nested hooks type to omit some hooks ([#28](https://github.com/unjs/hookable/issues/28)) ([75f2a05](https://github.com/unjs/hookable/commit/75f2a057a526d018b9cf39f01ddfd2a3d2a6bbc1))

## [5.0.0-0](https://github.com/unjs/hookable/compare/v4.4.1...v5.0.0-0) (2021-08-26)


### ⚠ BREAKING CHANGES

* You should directly handle errors with callHook
* use named exports and expose createHooks
* remove mergehooks from Hookable prototype
* drop browser build and use exports field
* improve type checking

### Features

* drop browser build and use exports field ([b626770](https://github.com/unjs/hookable/commit/b626770192a62b23acc1be16b4e4eac2383e9136))
* drop logger and global error handler ([ee6ea87](https://github.com/unjs/hookable/commit/ee6ea87ad0e15a52252389b9b3112060bd411330))
* improve type checking ([c2e1e22](https://github.com/unjs/hookable/commit/c2e1e223d16e7bf87117cd8d72ad3ba211a333d8))
* use named exports and expose createHooks ([fadfcbd](https://github.com/unjs/hookable/commit/fadfcbd07c3e2fa6905d0e31deabc37fc55d8317))


* remove mergehooks from Hookable prototype ([d50af59](https://github.com/unjs/hookable/commit/d50af595d3cb05be8fb5060374f4e28b3d6259fa))

### [4.4.1](https://github.com/unjs/hookable/compare/v4.4.0...v4.4.1) (2021-02-26)


### Bug Fixes

* avoid creating extra wrapper when merging hooks ([790c1c4](https://github.com/unjs/hookable/commit/790c1c4dbbd1f7b9cb1995b40baeecead5346ed0))

## [4.4.0](https://github.com/unjs/hookable/compare/v4.3.1...v4.4.0) (2021-01-21)


### Features

* **pkg:** expose module format ([2987b09](https://github.com/unjs/hookable/commit/2987b0901e292eb4570f8141ca51cfd9d2d3f94f))

### [4.3.1](https://github.com/unjs/hookable/compare/v4.3.0...v4.3.1) (2020-11-06)


### Bug Fixes

* expose types ([0ffbaff](https://github.com/unjs/hookable/commit/0ffbaffa91d38e333e0818cd73a084cf1e8657c8))

## [4.3.0](https://github.com/unjs/hookable/compare/v4.2.0...v4.3.0) (2020-11-06)


### Features

* `mergeHooks` helper ([#26](https://github.com/unjs/hookable/issues/26)) ([8c52d03](https://github.com/unjs/hookable/commit/8c52d034aa1a40bafb13d0b847c72593c51fcba5))

## [4.2.0](https://github.com/unjs/hookable/compare/v4.1.2...v4.2.0) (2020-10-23)


### Features

* hookOnce ([225fa8a](https://github.com/unjs/hookable/commit/225fa8af85e1a504916c357f57b047143b6bc5ab))


### Bug Fixes

* typecheck for flatHooks ([7800190](https://github.com/unjs/hookable/commit/7800190feb82134be5dd089ca184a18a6644da19))

### [4.1.2](https://github.com/unjs/hookable/compare/v4.1.1...v4.1.2) (2020-08-24)


### Bug Fixes

* **build:** exclude regenerator and update target to ie 11 ([48acfc5](https://github.com/unjs/hookable/commit/48acfc5c0a4b0fb8edc6e9790b37ad336c966215))

### [4.1.1](https://github.com/unjs/hookable/compare/v4.1.0...v4.1.1) (2020-04-28)


### Bug Fixes

* **pkg:** typo in types entry name (fixes [#19](https://github.com/unjs/hookable/issues/19)) ([b9ba90f](https://github.com/unjs/hookable/commit/b9ba90fbc725097e41c430d7df4205985c2faaec))

## [4.1.0](https://github.com/unjs/hookable/compare/v4.0.0...v4.1.0) (2020-04-17)


### Features

* **types:** implement strict types ([823cdca](https://github.com/unjs/hookable/commit/823cdcac728d189b802f75faa9a361ac5ea4883d))

## [4.0.0](https://github.com/unjs/hookable/compare/v3.0.0...v4.0.0) (2020-04-17)


### ⚠ BREAKING CHANGES

* only dist and types getting published

### Features

* allow disabling logger ([f8fb742](https://github.com/unjs/hookable/commit/f8fb74224f1277ec7f7d5a37bd312af7514fc962))
* allow removing registered hooks ([#16](https://github.com/unjs/hookable/issues/16)) ([4134c31](https://github.com/unjs/hookable/commit/4134c31c44256cc82cac3a7a3610ece9252431dc))
* migrate to typescript ([d63ea3e](https://github.com/unjs/hookable/commit/d63ea3e408ebea74ea3855af0c6e51880ebf9cac))

## [3.0.0](https://github.com/unjs/hookable/compare/v2.3.0...v3.0.0) (2020-02-25)


### Bug Fixes

* revert back hooks ([07f52dc](https://github.com/unjs/hookable/commit/07f52dc))


### Features

* advanced deprecation ([5b88628](https://github.com/unjs/hookable/commit/5b88628))
* bundle package ([53a2a0e](https://github.com/unjs/hookable/commit/53a2a0e))

# [2.3.0](https://github.com/unjs/hookable/compare/v2.2.1...v2.3.0) (2019-09-01)


### Features

* hide deprecate warnings on production builds ([0861df3](https://github.com/unjs/hookable/commit/0861df3))



## [2.2.1](https://github.com/unjs/hookable/compare/v2.2.0...v2.2.1) (2019-08-21)



# [2.2.0](https://github.com/unjs/hookable/compare/v2.1.0...v2.2.0) (2019-08-21)


### Features

* deprecateHooks ([62f2d38](https://github.com/unjs/hookable/commit/62f2d38))



# [2.1.0](https://github.com/unjs/hookable/compare/v2.0.1...v2.1.0) (2019-08-21)


### Features

* optional fatal support for logger ([7c7355d](https://github.com/unjs/hookable/commit/7c7355d))



## [2.0.1](https://github.com/unjs/hookable/compare/v2.0.0...v2.0.1) (2019-08-21)



# [2.0.0](https://github.com/unjs/hookable/compare/v1.0.1...v2.0.0) (2019-08-21)


### Features

* custom logger ([ada6e37](https://github.com/unjs/hookable/commit/ada6e37))


### BREAKING CHANGES

* console is replaced by consola by default



## [1.0.1](https://github.com/unjs/hookable/compare/v1.0.0...v1.0.1) (2019-03-16)


### Bug Fixes

* fix package.json (2) ([7ff4ce9](https://github.com/unjs/hookable/commit/7ff4ce9))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/unjs/hookable/compare/v0.0.7...v1.0.0) (2019-02-11)


### Features

* rewrite for 1.0.0 ([88decae](https://github.com/unjs/hookable/commit/88decae))


### BREAKING CHANGES

* api change



<a name="0.0.7"></a>
## [0.0.7](https://github.com/pi0/hookable/compare/v0.0.6...v0.0.7) (2018-01-28)


### Bug Fixes

* hook with array or falsy key ([7e90de1](https://github.com/pi0/hookable/commit/7e90de1))


### Performance Improvements

* use for in for hookObj ([3c8e2e7](https://github.com/pi0/hookable/commit/3c8e2e7))



<a name="0.0.6"></a>
## [0.0.6](https://github.com/pi0/hookable/compare/v0.0.5...v0.0.6) (2018-01-26)


### Performance Improvements

* reduce transpiled dist size ([df607cf](https://github.com/pi0/hookable/commit/df607cf))



<a name="0.0.5"></a>
## [0.0.5](https://github.com/pi0/hookable/compare/v0.0.4...v0.0.5) (2018-01-26)


### Bug Fixes

* **package:** lib ~> dist ([34a8d5c](https://github.com/pi0/hookable/commit/34a8d5c))



<a name="0.0.4"></a>
## [0.0.4](https://github.com/pi0/hookable/compare/v0.0.3...v0.0.4) (2018-01-26)


### Performance Improvements

* handle fn as array faster ([ec35edc](https://github.com/pi0/hookable/commit/ec35edc))



<a name="0.0.3"></a>
## [0.0.3](https://github.com/pi0/hookable/compare/v0.0.2...v0.0.3) (2018-01-26)


### Bug Fixes

* bind hookObj to this context ([6f6f7bc](https://github.com/pi0/hookable/commit/6f6f7bc))


### Performance Improvements

* minor refactor ([e4083aa](https://github.com/pi0/hookable/commit/e4083aa))



<a name="0.0.2"></a>
## 0.0.2 (2018-01-26)

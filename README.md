# Hookable

[![CircleCI](https://img.shields.io/circleci/project/github/jsless/hookable.svg?style=flat-square)](https://circleci.com/gh/jsless/hookable)
[![Codecov](https://img.shields.io/codecov/c/github/jsless/hookable.svg?style=flat-square)](https://codecov.io/gh/jsless/hookable)
[![npm](https://img.shields.io/npm/v/hookable.svg?style=flat-square)](https://www.npmjs.com/package/hookable)
[![npm](https://img.shields.io/npm/dt/hookable.svg?style=flat-square)](https://www.npmjs.com/package/hookable)
[![size](http://img.badgesize.io/https://unpkg.com/hookable/dist/hookable.cjs.min.js?compression=gzip&style=flat-square)](https://unpkg.com/hookable)

> Awaitable hooks for Node.js

## Install

Using yarn:

```bash
yarn add hookable
```

Using npm:

```bash
npm install hookable
```

## Usage

**Extend your base class from Hookable:**

```js
import Hookable from 'hookable'

export default class Foo extends Hookable {
  constructor() {
    // Call to parent to initialize
    super()
    // Initialize Hookable with custom logger
    // super(consola)
  }

  async someFunction() {
    // Call and wait for `hook1` hooks (if any) sequential
    await this.callHook('hook1')
  }
}
```

**Inside plugins, register for any hook:**

```js
const lib = newFooLib()

// Register a handler for `hook2`
lib.hook('hook2', async () => { /* ... */ })

// Register multiply handlers at once
lib.hookObj({
  hook1: async () => { /* ... */ },
  hook2: [ /* can be also an array */ ]
})
```

## Hookable class

### `constructor(logger)`

Custom logger. Default logger is `console` but you can use your own or [consola](https://github.com/nuxt/consola).

It should be an object implementing following functions:
- warn
- error
- fatal (optional)

### `hook (name, fn)`

Register a handler for a specific hook. `fn` can be a single function or an array.

### `addHooks(configHooks)`

Flatten and register hooks object.

Example:

```js
hookable.addHooks({
  test: {
    before: () => {},
    after: () => {}
  }
})

```

This registers `test:before` and `test:after` hooks at bulk.

### `async callHook (name, ...args)`

Used by class itself to **sequentially** call handlers of a specific hook.

### `deprecateHook (old, name)`

Deprecate hook called `old` in favor of `name` hook.

### `deprecateHooks (deprecatedHooks)`

Deprecate all hooks from an object (keys are old and values or newer ones).

### `clearHook (name)`

Clear all hooks for a specific hook.

### `clearHooks ()`

Clear all hooks registered in the class.

### `flatHooks (hooksObj)`

Register many hooks using an object.

## Credits

Extracted from [Nuxt.js](github.com/nuxt/nuxt.js) hooks system

Original author [Sébastien Chopin](https://github.com/Atinux)

Thanks to [Joe Paice](https://github.com/RGBboy) for donating [hookable](https://www.npmjs.com/package/hookable) package name

## License

MIT

# Hookable

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![packagephobia][packagephobia-src]][packagephobia-href]
[![Github Actions CI][github-actions-ci-src]][github-actions-ci-href]
[![Codecov][codecov-src]][codecov-href]
[![Dependencies][david-dm-src]][david-dm-href]

> Awaitable hooks for Node.js and Browser

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
lib.addHooks({
  hook1: async () => { /* ... */ },
  hook2: [ /* can be also an array */ ]
})
```

**Unregistering hooks:**

```js
const lib = newFooLib()

const hook0 = async () => { /* ... */ }
const hook1 = async () => { /* ... */ }
const hook2 = async () => { /* ... */ }

// The hook() method returns an "unregister" function
const unregisterHook0 = lib.hook('hook0', hook0)
const unregisterHooks1and2 lib.addHooks({ hook1, hook2 })

/* ... */

unregisterHook0()
unregisterHooks1and2()

// or

lib.removeHooks({ hook0, hook1 })
lib.removeHook('hook2', hook2)
```

**Triggering a hook handler once:**

```js
const lib = newFooLib()

const unregister = lib.hook('hook0', async () => {
  // Unregister as soon as the hook is executed
  unregister()

  /* ... */
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

Register a handler for a specific hook. `fn` must be a function.

Returns an `unregister` function that, when called, will remove the registered handler.

### `hookOnce (name, fn)`

Similar to `hook` but unregisters hook once called.

Returns an `unregister` function that, when called, will remove the registered handler before first call.

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

Returns an `unregister` function that, when called, will remove all the registered handlers.

### `async callHook (name, ...args)`

Used by class itself to **sequentially** call handlers of a specific hook.

### `deprecateHook (old, name)`

Deprecate hook called `old` in favor of `name` hook.

### `deprecateHooks (deprecatedHooks)`

Deprecate all hooks from an object (keys are old and values or newer ones).

### `removeHook (name, fn)`

Remove a particular hook handler, if the `fn` handler is present.

### `removeHooks (configHooks)`

Remove multiple hook handlers.

Example:

```js
const handler = async () => { /* ... */ }

hookable.hook('test:before', handler)
hookable.addHooks({ test: { after: handler } })

// ...

hookable.removeHooks({
  test: {
    before: handler,
    after: handler
  }
})
```

## Credits

Extracted from [Nuxt.js](https://github.com/nuxt/nuxt.js) hooks system

Original author [Sébastien Chopin](https://github.com/Atinux)

Thanks to [Joe Paice](https://github.com/RGBboy) for donating [hookable](https://www.npmjs.com/package/hookable) package name

## License

MIT - Made with 💖 by Nuxt.js team!

<!-- Badges -->
[npm-version-src]: https://flat.badgen.net/npm/dt/hookable
[npm-version-href]: https://npmjs.com/package/hookable

[npm-downloads-src]: https://flat.badgen.net/npm/v/hookable
[npm-downloads-href]: https://npmjs.com/package/hookable

[github-actions-ci-src]: https://github.com/nuxt-contrib/hookable/workflows/ci/badge.svg
[github-actions-ci-href]: https://github.com/nuxt-contrib/hookable/actions?query=workflow%3Aci

[codecov-src]: https://flat.badgen.net/codecov/c/github/nuxt-contrib/hookable
[codecov-href]: https://codecov.io/gh/nuxt-contrib/hookable

[david-dm-src]: https://flat.badgen.net/david/dep/nuxt-contrib/hookable
[david-dm-href]: https://david-dm.org/nuxt-contrib/hookable

[packagephobia-src]: https://flat.badgen.net/packagephobia/install/hookable
[packagephobia-href]: https://packagephobia.now.sh/result?p=hookable

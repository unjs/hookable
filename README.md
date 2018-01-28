# Hable

[![CircleCI](https://img.shields.io/circleci/project/github/pi0/hable.svg?style=flat-square)](https://circleci.com/gh/pi0/hable)
[![Codecov](https://img.shields.io/codecov/c/github/pi0/hable.svg?style=flat-square)](https://codecov.io/gh/pi0/hable)
[![npm](https://img.shields.io/npm/v/hable.svg?style=flat-square)](https://www.npmjs.com/package/hable)
[![npm](https://img.shields.io/npm/dt/hable.svg?style=flat-square)](https://www.npmjs.com/package/hable)

> A simpler tapable alternative, which can be used to create hooks for plugins.

## Install

Using yarn:

```bash
yarn add hable
```

Using npm:

```bash
npm install hable
```

## Usage

**Extend your base class from Hable:**

```js
import Hookable from 'hable'

export default class Foo extends Hookable {
  constructor() {
    // Call to parent to initialize
    super()
  }

  async someFunction() {
    // Call and wait for `hook1` hooks (if any) sequential
    await this.callHook('hook1')

    // Call and wait for `hook2` hooks (if any) in paraller
    await this.callHookAsync('hook2')
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

**private functions**

* `async callHook(name, ...args)`: Used by class itself to **sequentially** call handlers of a specific hook.
* `async callHookAsync(name, ...args)`: Same as `callHook` but calls handlers in **parallel**.

**public functions**

* `hook(name, fn)`: Used by plugins to register a handler for an specific hook. `fn` can be a single function or an array.
* `hookObj(hooksObj)`: Register many hooks using an object.

**private attributes**

* `$hooks`: An object which maps from each hook name to it's handlers.

## Credits

Extracted from [Nuxt.js](github.com/nuxt/nuxt.js) hooks system. Original author: [Sébastien Chopin](https://github.com/Atinux).

## License

MIT

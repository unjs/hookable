# Hable

[![npm](https://img.shields.io/npm/v/hable.svg?style=flat-square)](https://www.npmjs.com/package/hable)

> A simpler tapable alternative, which can be used to create hooks for plugins.

## Install

```bash
>_ yarn add hable
>_ npm install hable
```

## Usage

**Extend your base class from Hable:**

```js
import Hookable from 'hable'

export default class MyLib extends Hookable {
  constructor() {
    // Call to parent to initialize
    super()
  }

  async someFunction() {
    // Call and wait for `foo` hooks (if any) sequential
    await this.callHook('foo')

    // Call and wait for `bar` hooks (if any) in paraller
    await this.callHookAsync('bar')
  }
}
```

**Inside plugins, register for any hook:**

```js
const lib = new MyLib()

// Register a handler for `foo`
lib.hook('foo', async () => { /* ... */ })

// Register multiply handlers at once
lib.hookObj({
  foo: async () => { /* ... */ },
  bar: [ /* can be also an array */ ]
})
```

## API

### Class functions

* `async callHook(name, ...args)`: Used by class itself to **sequentially** call handlers of a specific hook.
* `async callHookAsync(name, ...args)`: Same as `callHook` but calls handlers in **parallel**.
* `hook(name, fn)`: Used by plugins to register a handler for an specific hook. `fn` can be a single function or an array.
* `hookObj(hooksObj)`: Register many hook using an object.

### Class attributes

* `$hooks`: An object which maps from each hook name to it's handlers.

## Credits

Extracted from [Nuxt.js](github.com/nuxt/nuxt.js) hooks system. Original author: [Sébastien Chopin](https://github.com/Atinux).

## License

MIT

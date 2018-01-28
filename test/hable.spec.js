import Hookable from '../src'

const noop = jest.fn(() => {})
const asyncNoop = jest.fn(async () => {})

it('$hooks field exists', async () => {
  const lib = new Hookable()
  expect(lib.$hooks).toBeInstanceOf(Object)
})

it('hook', () => {
  const lib = new Hookable()

  lib.hook('test', noop)
  lib.hook('test', [])
  lib.hook('test', [asyncNoop])

  expect(lib.$hooks.test.length).toBe(2)
})

it('hookObj', () => {
  const lib = new Hookable()

  lib.hookObj({
    test: [noop],
    test2: [],
    test3: [noop]
  })

  expect(lib.$hooks.test.length).toBe(1)
  expect(lib.$hooks.test2.length).toBe(0)
  expect(lib.$hooks.test3.length).toBe(1)
})

it('callHook', async () => {
  const lib = new Hookable()

  lib.hook('sync', noop)
  lib.hook('async', asyncNoop)
  lib.hook('mixed', [noop, asyncNoop])

  await lib.callHook('sync')
  await lib.callHookAsync('async')
  await lib.callHook('mixed', 1, 2, 3)
  await lib.callHook('foo')
  await lib.callHookAsync('foo')

  expect(noop).toHaveBeenCalledTimes(2)
  expect(asyncNoop).toHaveBeenCalledTimes(2)

  expect(noop).toHaveBeenLastCalledWith(1, 2, 3)
  expect(asyncNoop).toHaveBeenLastCalledWith(1, 2, 3)
})

import { expectTypeOf } from 'expect-type'
import { createHooks } from '../src'

describe('hook types', () => {
  test('correctly handles non-nested hooks', () => {
    const hooks = createHooks<{ foo: () => true, bar: (_arg: string) => 42 }>()

    expectTypeOf(hooks.hook).parameter(0).not.toBeAny()
    expectTypeOf(hooks.hook).parameter(0).toEqualTypeOf<'foo' | 'bar'>()

    // @ts-expect-error
    hooks.hook('foo', _param => true)
  })

  test('correctly handles nested hooks', () => {
    const hooks = createHooks<{
      'namespace:foo': (arg: string) => void
      bar: (_arg: string) => void
    }>()

    // should be valid
    hooks.addHooks({ namespace: { foo: (_arg) => { } }, bar: (_arg) => { }, 'namespace:foo': () => { } })
    // @ts-expect-error
    hooks.addHooks({ a: (_arg) => { } })
    // @ts-expect-error
    hooks.addHooks({ namespace: { nonexistent: (_arg) => { } } })
  })
})

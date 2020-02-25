import Hookable from '../src/hable'
import { flatHooks } from '../src/utils'

describe('core: hookable', () => {
  beforeEach(() => {
    ['log', 'warn', 'error', 'debug'].forEach(l => {
      console[l] = jest.fn()
    })
  })

  test('should construct hook object', () => {
    const hook = new Hookable()

    expect(hook._hooks).toEqual({})
    expect(hook._deprecatedHooks).toEqual({})
    expect(hook.hook).toBeInstanceOf(Function)
    expect(hook.callHook).toBeInstanceOf(Function)
  })

  test('should register hook successfully', () => {
    const hook = new Hookable()
    hook.hook('test:hook', () => { })
    hook.hook('test:hook', () => { })

    expect(hook._hooks['test:hook']).toHaveLength(2)
    expect(hook._hooks['test:hook']).toBeInstanceOf(Array)
    expect(hook._hooks['test:hook']).toEqual([expect.any(Function), expect.any(Function)])
  })

  test('should ignore empty hook name', () => {
    const hook = new Hookable()
    hook.hook(0, () => { })
    hook.hook('', () => { })
    hook.hook(undefined, () => { })

    expect(hook._hooks[0]).toBeUndefined()
    expect(hook._hooks['']).toBeUndefined()
    expect(hook._hooks[undefined]).toBeUndefined()
  })

  test('should ignore non-function hook', () => {
    const hook = new Hookable()
    hook.hook('test:hook', '')
    hook.hook('test:hook', undefined)

    expect(hook._hooks['test:hook']).toBeUndefined()
  })

  test('should convert and display deprecated hooks', () => {
    const hook = new Hookable()
    hook.deprecateHook('a', 'b')
    hook.deprecateHook('b', { to: 'c' })
    hook.deprecateHook('x', { to: 'y', message: 'Custom' })

    hook.hook('a', () => { })
    hook.hook('b', () => { })
    hook.hook('c', () => { })
    hook.hook('x', () => { })

    expect(console.warn).toBeCalledWith('a hook has been deprecated, please use c')
    expect(console.warn).toBeCalledWith('b hook has been deprecated, please use c')
    expect(console.warn).toBeCalledWith('Custom')
    expect(hook._hooks.a).toBeUndefined()
    expect(hook._hooks.b).toBeUndefined()
    expect(hook._hooks.c).toEqual([expect.any(Function), expect.any(Function), expect.any(Function)])
  })

  test('deprecateHooks', () => {
    const hook = new Hookable()
    hook.deprecateHooks({
      'test:hook': 'test:before'
    })

    hook.hook('test:hook', () => { })

    expect(console.warn).toBeCalledWith('test:hook hook has been deprecated, please use test:before')
    expect(hook._hooks['test:hook']).toBeUndefined()
    expect(hook._hooks['test:before']).toEqual([expect.any(Function)])
  })

  test('should call registered hook', async () => {
    const hook = new Hookable()
    hook.hook('test:hook', () => console.log('test:hook called'))

    await hook.callHook('test:hook')

    expect(console.log).toBeCalledWith('test:hook called')
  })

  test('should ignore unregistered hook', async () => {
    const hook = new Hookable()

    await hook.callHook('test:hook')

    expect(console.debug).not.toBeCalled()
  })

  test('should report hook error', async () => {
    const hook = new Hookable()
    const error = new Error('Hook Error')
    hook.hook('test:hook', () => { throw error })

    await hook.callHook('test:hook')

    expect(console.error).toBeCalledWith(error)
  })

  test('should call error hook', async () => {
    const hook = new Hookable()
    const error = new Error('Hook Error')
    hook.hook('error', jest.fn())
    hook.hook('test:hook', () => { throw error })

    await hook.callHook('test:hook')

    expect(hook._hooks.error[0]).toBeCalledWith(error)
    expect(console.error).toBeCalledWith(error)
  })

  test('should clear registered hooks', () => {
    const hook = new Hookable()
    hook.hook('test:hook', () => { })

    expect(hook._hooks['test:hook']).toHaveLength(1)
    expect(hook._hooks['test:before']).toBeUndefined()

    hook.clearHook('test:hook')
    hook.clearHook('test:before')

    expect(hook._hooks['test:hook']).toBeUndefined()
    expect(hook._hooks['test:before']).toBeUndefined()
  })

  test('should clear all registered hooks', () => {
    const hook = new Hookable()
    hook.hook('test:hook', () => { })

    expect(hook._hooks['test:hook']).toHaveLength(1)
    expect(hook._hooks['test:before']).toBeUndefined()

    hook.clearHooks()

    expect(hook._hooks['test:hook']).toBeUndefined()
    expect(hook._hooks['test:before']).toBeUndefined()
    expect(hook._hooks).toEqual({})
  })

  test('should return flat hooks', () => {
    const hooks = flatHooks({
      test: {
        hook: () => { },
        before: () => { }
      }
    })

    expect(hooks).toEqual({
      'test:hook': expect.any(Function),
      'test:before': expect.any(Function)
    })
  })

  test('should add object hooks', () => {
    const hook = new Hookable()
    hook.addHooks({
      test: {
        hook: () => { },
        before: () => { },
        after: null
      }
    })

    expect(hook._hooks).toEqual({
      'test:hook': expect.any(Array),
      'test:before': expect.any(Array),
      'test:after': undefined
    })
    expect(hook._hooks['test:hook']).toHaveLength(1)
    expect(hook._hooks['test:before']).toHaveLength(1)
  })
})

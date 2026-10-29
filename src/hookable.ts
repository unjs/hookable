import {
  flatHooks,
  parallelTaskCaller,
  serialTaskCaller,
  callEachWith,
  callHooks,
} from "./utils.ts";

import type {
  DeprecatedHook,
  NestedHooks,
  HookCallback,
  HookKeys,
  HookListenerEvent,
} from "./types.ts";

type InferCallback<HT, HN extends keyof HT> = HT[HN] extends HookCallback ? HT[HN] : never;
type InferSpyEvent<HT extends Record<string, any>> = {
  [key in keyof HT]: {
    name: key;
    args: Parameters<HT[key]>;
    context: Record<string, any>;
  };
}[keyof HT];

export class Hookable<
  HooksT extends Record<string, any> = Record<string, HookCallback>,
  HookNameT extends HookKeys<HooksT> = HookKeys<HooksT>,
> {
  private _hooks: { [key: string]: HookCallback[] | undefined };
  private _before?: HookCallback[];
  private _after?: HookCallback[];
  private _beforeListener?: HookCallback[];
  private _afterListener?: HookCallback[];
  private _labels?: { [key: string]: (string | undefined)[] | undefined };
  private _deprecatedHooks: Record<string, DeprecatedHook<HooksT>>;
  private _deprecatedMessages?: Set<string>;

  constructor() {
    this._hooks = {};
    this._before = undefined;
    this._after = undefined;
    this._beforeListener = undefined;
    this._afterListener = undefined;
    this._labels = undefined;
    this._deprecatedMessages = undefined;
    this._deprecatedHooks = {};

    // Allow destructuring hook and callHook functions out of instance object
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }

  hook<NameT extends HookNameT>(
    name: NameT,
    function_: InferCallback<HooksT, NameT>,
    options: { allowDeprecated?: boolean; label?: string } = {},
  ): () => void {
    if (!name || typeof function_ !== "function") {
      return () => {};
    }

    const originalName = name;
    let dep: DeprecatedHook<HooksT> | undefined;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to as NameT;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message =
          `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }

    // Add name to hook for better debugging experience
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => hookCallbackName(name),
          configurable: true,
        });
      } catch {
        // ignore
      }
    }

    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name]!.push(function_);

    // Labels are stored at the same index as their hook
    if (options.label) {
      this._labels = this._labels || {};
      this._labels[name] = this._labels[name] || [];
      this._labels[name]![this._hooks[name]!.length - 1] = options.label;
    }

    return () => {
      if (function_) {
        this.removeHook(name, function_);
        // @ts-ignore
        function_ = undefined; // Free memory
      }
    };
  }

  hookOnce<NameT extends HookNameT>(
    name: NameT,
    function_: InferCallback<HooksT, NameT>,
    options: { label?: string } = {},
  ): () => void {
    let _unreg: (() => void) | undefined;
    let _function: ((...arguments_: any) => any) | undefined = (...arguments_: any) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = undefined;
      _function = undefined;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function as typeof function_, {
      label: options.label || function_.name || hookCallbackName(name),
    });
    return _unreg;
  }

  removeHook<NameT extends HookNameT>(name: NameT, function_: InferCallback<HooksT, NameT>): void {
    const hooks = this._hooks[name];

    if (hooks) {
      const index = hooks.indexOf(function_);

      if (index !== -1) {
        hooks.splice(index, 1);
        this._labels?.[name]?.splice(index, 1);
      }

      if (hooks.length === 0) {
        this._hooks[name] = undefined;
      }
    }
  }

  clearHook<NameT extends HookNameT>(name: NameT): void {
    this._hooks[name] = undefined;
    if (this._labels) {
      this._labels[name] = undefined;
    }
  }

  deprecateHook<NameT extends HookNameT>(
    name: NameT,
    deprecated: HookKeys<HooksT> | DeprecatedHook<HooksT>,
  ): void {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    const labels = this._labels?.[name] || [];
    this.clearHook(name);
    for (const [index, hook] of _hooks.entries()) {
      this.hook(name, hook as any, { label: labels[index] });
    }
  }

  deprecateHooks(deprecatedHooks: Partial<Record<HookNameT, DeprecatedHook<HooksT>>>): void {
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name] as DeprecatedHook<HooksT>);
    }
  }

  addHooks(configHooks: NestedHooks<HooksT>): () => void {
    const hooks = flatHooks<HooksT>(configHooks);
    // @ts-ignore
    const removeFns = Object.keys(hooks).map((key) => this.hook(key as HookNameT, hooks[key]));

    return () => {
      for (const unreg of removeFns) {
        unreg();
      }

      // Ensures that all fns are called once, and free all
      // unreg functions from memory.
      removeFns.length = 0;
    };
  }

  removeHooks(configHooks: NestedHooks<HooksT>): void {
    const hooks = flatHooks<HooksT>(configHooks);
    for (const key in hooks) {
      // @ts-ignore
      this.removeHook(key, hooks[key]);
    }
  }

  removeAllHooks(): void {
    this._hooks = {};
    this._labels = undefined;
  }

  callHook<NameT extends HookNameT>(
    name: NameT,
    ...args: Parameters<InferCallback<HooksT, NameT>>
  ): Promise<any> | void {
    return this.callHookWith(serialTaskCaller, name, args);
  }

  callHookParallel<NameT extends HookNameT>(
    name: NameT,
    ...args: Parameters<InferCallback<HooksT, NameT>>
  ): Promise<any[]> | void {
    return this.callHookWith(parallelTaskCaller, name, args);
  }

  callHookWith<
    NameT extends HookNameT,
    CallFunction extends (
      hooks: HookCallback[],
      args: Parameters<InferCallback<HooksT, NameT>>,
      name: NameT,
    ) => any,
  >(
    caller: CallFunction,
    name: NameT,
    args: Parameters<InferCallback<HooksT, NameT>>,
  ): ReturnType<CallFunction> {
    const spyListeners = this._beforeListener?.length || this._afterListener?.length;
    const event =
      this._before || this._after || spyListeners ? { name, args, context: {} } : undefined;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const hooks = this._hooks[name] || [];
    const labels = this._labels?.[name] || [];
    const result = caller(
      spyListeners
        ? hooks.map((fn, index) =>
            spyListener(fn, {
              name,
              label: labels[index] || fn.name,
              context: event!.context,
              before: this._beforeListener,
              after: this._afterListener,
            }),
          )
        : [...hooks],
      args as Parameters<InferCallback<HooksT, NameT>>,
      name,
    );
    if ((result as any) instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }

  beforeEach(function_: (event: InferSpyEvent<HooksT>) => void): () => void {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== undefined) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }

  afterEach(function_: (event: InferSpyEvent<HooksT>) => void): () => void {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== undefined) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }

  beforeEachListener(function_: (event: HookListenerEvent<HooksT>) => void): () => void {
    this._beforeListener = this._beforeListener || [];
    this._beforeListener.push(function_);
    return () => {
      if (this._beforeListener !== undefined) {
        const index = this._beforeListener.indexOf(function_);
        if (index !== -1) {
          this._beforeListener.splice(index, 1);
        }
      }
    };
  }

  afterEachListener(function_: (event: HookListenerEvent<HooksT>) => void): () => void {
    this._afterListener = this._afterListener || [];
    this._afterListener.push(function_);
    return () => {
      if (this._afterListener !== undefined) {
        const index = this._afterListener.indexOf(function_);
        if (index !== -1) {
          this._afterListener.splice(index, 1);
        }
      }
    };
  }
}

export function createHooks<T extends Record<string, any>>(): Hookable<T> {
  return new Hookable<T>();
}

export class HookableCore<
  HooksT extends Record<string, any> = Record<string, HookCallback>,
  HookNameT extends HookKeys<HooksT> = HookKeys<HooksT>,
> {
  protected _hooks: { [key: string]: HookCallback[] | undefined };

  constructor() {
    this._hooks = {};
  }

  hook<NameT extends HookNameT>(name: NameT, fn: InferCallback<HooksT, NameT>): () => void {
    if (!name || typeof fn !== "function") {
      return () => {};
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name]!.push(fn);
    return () => {
      if (fn) {
        this.removeHook(name, fn);
        // @ts-ignore
        fn = undefined; // Free memory
      }
    };
  }

  removeHook<NameT extends HookNameT>(name: NameT, function_: InferCallback<HooksT, NameT>): void {
    const hooks = this._hooks[name];

    if (hooks) {
      const index = hooks.indexOf(function_);

      if (index !== -1) {
        hooks.splice(index, 1);
      }

      if (hooks.length === 0) {
        this._hooks[name] = undefined;
      }
    }
  }

  callHook<NameT extends HookNameT>(
    name: NameT,
    ...args: Parameters<InferCallback<HooksT, NameT>>
  ): Promise<any> | void {
    const hooks = this._hooks[name];
    if (!hooks || hooks.length === 0) {
      return;
    }
    return callHooks(hooks.slice(), args, 0);
  }
}

function hookCallbackName(name: string): string {
  return "_" + name.replace(/\W+/g, "_") + "_hook_cb";
}

function spyListener(
  fn: HookCallback,
  options: {
    name: string;
    label: string;
    context: Record<string, any>;
    before?: HookCallback[];
    after?: HookCallback[];
  },
): HookCallback {
  return (...args: any[]) => {
    const event: HookListenerEvent = {
      name: options.name,
      args,
      label: options.label,
      fn,
      context: options.context,
    };
    if (options.before) {
      callEachWith(options.before, event);
    }
    const start = performance.now();
    const done = (failed?: boolean, error?: unknown) => {
      event.duration = performance.now() - start;
      if (failed) {
        event.error = error;
      }
      if (options.after) {
        callEachWith(options.after, event);
      }
    };
    let result: any;
    try {
      result = fn(...args);
    } catch (error) {
      done(true, error);
      throw error;
    }
    // Use thenable check to support cross-realm Promises (e.g. from vm/jiti).
    if (result && typeof result.then === "function") {
      return Promise.resolve(result).then(
        (value) => (done(), value),
        (error) => {
          done(true, error);
          throw error;
        },
      );
    }
    done();
    return result;
  };
}

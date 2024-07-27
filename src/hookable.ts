import {
  flatHooks,
  parallelTaskCaller,
  serialTaskCaller,
  callEachWith,
} from "./utils";
import type {
  DeprecatedHook,
  NestedHooks,
  HookCallback,
  HookKeys,
  Thenable,
} from "./types";

type InferCallback<HT, HN extends keyof HT> = HT[HN] extends HookCallback
  ? HT[HN]
  : never;
type InferSpyEvent<HT extends Record<string, any>> = {
  [key in keyof HT]: {
    name: key;
    args: Parameters<HT[key]>;
    context: Record<string, any>;
  };
}[keyof HT];

export class Hookable<
  HooksT extends Record<string, any> = Record<string, HookCallback>,
  HookNameT extends HookKeys<HooksT> = HookKeys<HooksT>
> {
  private _hooks: { [key: string]: HookCallback[] };
  private _before?: HookCallback[];
  private _after?: HookCallback[];
  private _deprecatedHooks: Record<string, DeprecatedHook<HooksT>>;
  private _deprecatedMessages?: Set<string>;

  constructor() {
    this._hooks = {};
    this._before = undefined;
    this._after = undefined;
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
    options: { allowDeprecated?: boolean } = {}
  ) {
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
          `${originalName} hook has been deprecated` +
          (dep.to ? `, please use ${dep.to}` : "");
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
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true,
        });
      } catch {}
    }

    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);

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
    function_: InferCallback<HooksT, NameT>
  ) {
    let _unreg: (() => void) | undefined;
    let _function: ((...arguments_: any) => any) | undefined = (
      ...arguments_: any
    ) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = undefined;
      _function = undefined;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function as typeof function_);
    return _unreg;
  }

  removeHook<NameT extends HookNameT>(
    name: NameT,
    function_: InferCallback<HooksT, NameT>
  ) {
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

  deprecateHook<NameT extends HookNameT>(
    name: NameT,
    deprecated: HookKeys<HooksT> | DeprecatedHook<HooksT>
  ) {
    this._deprecatedHooks[name] =
      typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    this._hooks[name] = undefined;
    for (const hook of _hooks) {
      this.hook(name, hook as any);
    }
  }

  deprecateHooks(
    deprecatedHooks: Partial<Record<HookNameT, DeprecatedHook<HooksT>>>
  ) {
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name] as DeprecatedHook<HooksT>);
    }
  }

  addHooks(configHooks: NestedHooks<HooksT>) {
    const hooks = flatHooks<HooksT>(configHooks);
    // @ts-ignore
    const removeFns = Object.keys(hooks).map((key) =>
      this.hook(key as HookNameT, hooks[key])
    );

    return () => {
      for (const unreg of removeFns) {
        unreg();
      }

      // Ensures that all fns are called once, and free all
      // unreg functions from memory.
      removeFns.length = 0;
    };
  }

  removeHooks(configHooks: NestedHooks<HooksT>) {
    const hooks = flatHooks<HooksT>(configHooks);
    for (const key in hooks) {
      // @ts-ignore
      this.removeHook(key, hooks[key]);
    }
  }

  removeAllHooks() {
    this._hooks = {};
  }

  callHook<NameT extends HookNameT>(
    name: NameT,
    ...arguments_: Parameters<InferCallback<HooksT, NameT>>
  ): Thenable<any> {
    // @ts-expect-error we always inject name
    return this.callHookWith(serialTaskCaller, name, name, ...arguments_);
  }

  callHookParallel<NameT extends HookNameT>(
    name: NameT,
    ...arguments_: Parameters<InferCallback<HooksT, NameT>>
  ): Thenable<any[]> {
    // @ts-expect-error we always inject name
    return this.callHookWith(parallelTaskCaller, name, name, ...arguments_);
  }

  callHookWith<
    NameT extends HookNameT,
    CallFunction extends (
      hooks: HookCallback[],
      arguments_: Parameters<InferCallback<HooksT, NameT>>
    ) => any
  >(
    caller: CallFunction,
    name: NameT,
    ...arguments_: Parameters<InferCallback<HooksT, NameT>>
  ): ReturnType<CallFunction> {
    const event =
      this._before || this._after
        ? { name, args: arguments_, context: {} }
        : undefined;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      this._hooks[name] ? [...this._hooks[name]] : [],
      arguments_
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

  beforeEach(function_: (event: InferSpyEvent<HooksT>) => void) {
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

  afterEach(function_: (event: InferSpyEvent<HooksT>) => void) {
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
}

export function createHooks<T extends Record<string, any>>(): Hookable<T> {
  return new Hookable<T>();
}

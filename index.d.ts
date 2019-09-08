declare class hable {
  hook (name: String, fn: Function): void;

  deprecateHook (old: String, name: String): void;

  deprecateHooks (deprecatedHooks: Object): void;

  addHooks (configHooks: Object): void;

  callHook (name: String, ...args: any) : void;

  clearHook (name: String): void;

  clearHooks (): void;
}

export default hable

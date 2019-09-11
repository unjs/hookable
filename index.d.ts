interface hable {
  hook (name: string, fn: (...args: any) => Promise<void> | void): void;

  deprecateHook (old: string, name: string): void;

  deprecateHooks (deprecatedHooks: object): void;

  addHooks (configHooks: object): void;

  callHook (name: string, ...args: any) : Promise<void>;

  clearHook (name: string): void;

  clearHooks (): void;
}

export default hable

import type { Hookable } from "./hookable.ts";

export interface CreateDebuggerOptions {
  /** An optional tag to prefix console logs with */
  tag?: string;

  /**
   * Show hook params to the console output
   *
   * Enabled for browsers by default
   */
  inspect?: boolean;

  /**
   * Use group/groupEnd wrapper around logs happening during a specific hook
   *
   * Enabled for browsers by default
   */
  group?: boolean;

  /** Filter which hooks to enable debugger for. Can be a string prefix or fn. */
  filter?: string | ((event: string) => boolean);
}

// eslint-disable-next-line unicorn/prefer-global-this
const isBrowser = typeof window !== "undefined";

/** Start debugging hook names and timing in console */
export function createDebugger(
  hooks: Hookable<any>,
  _options: CreateDebuggerOptions = {},
): {
  /** Stop debugging and remove listeners */
  close: () => void;
} {
  const options = {
    inspect: isBrowser,
    group: isBrowser,
    filter: () => true,
    ..._options,
  } satisfies CreateDebuggerOptions;

  const _filter = options.filter;
  const filter = typeof _filter === "string" ? (name: string) => name.startsWith(_filter) : _filter;

  const _tag = options.tag ? `[${options.tag}] ` : "";
  const logPrefix = (event: any) => _tag + event.name + "".padEnd(event._id, "\0");

  const _activeIds: Record<string, Set<number>> = {};

  // Before each
  const unsubscribeBefore = hooks.beforeEach((event: any) => {
    if (filter !== undefined && !filter(event.name)) {
      return;
    }
    const activeIds = (_activeIds[event.name] ||= new Set());
    let id = 0;
    while (activeIds.has(id)) {
      id++;
    }
    activeIds.add(id);
    event._id = id;
    console.time(logPrefix(event));
  });

  // After each
  const unsubscribeAfter = hooks.afterEach((event) => {
    if (filter !== undefined && !filter(event.name)) {
      return;
    }
    if (options.group) {
      console.groupCollapsed(event.name);
    }
    if (options.inspect) {
      console.timeLog(logPrefix(event), event.args);
    } else {
      console.timeEnd(logPrefix(event));
    }
    if (options.group) {
      console.groupEnd();
    }
    _activeIds[event.name].delete((event as unknown as { _id: number })._id);
  });

  return {
    /** Stop debugging and remove listeners */
    close: () => {
      unsubscribeBefore();
      unsubscribeAfter();
    },
  };
}

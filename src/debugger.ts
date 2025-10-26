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
  const filter =
    typeof _filter === "string"
      ? (name: string) => name.startsWith(_filter)
      : _filter;

  const _tag = options.tag ? `[${options.tag}] ` : "";
  const logPrefix = (event: any) =>
    _tag + event.name + "".padEnd(event._id, "\0");

  const _idCtr: Record<string, number> = {};

  // Before each
  const unsubscribeBefore = hooks.beforeEach((event: any) => {
    if (filter !== undefined && !filter(event.name)) {
      return;
    }
    _idCtr[event.name] = _idCtr[event.name] || 0;
    event._id = _idCtr[event.name]++;
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
    _idCtr[event.name]--;
  });

  return {
    /** Stop debugging and remove listeners */
    close: () => {
      unsubscribeBefore();
      unsubscribeAfter();
    },
  };
}

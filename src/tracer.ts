import type { TracingChannel } from "node:diagnostics_channel";
import type { Hookable } from "./hookable.ts";

export interface CreateTracerOptions {
  /** `TracingChannel` name to publish on. */
  channel: string;

  /** Hook name prefix or predicate. */
  filter?: string | ((event: string) => boolean);
}

/** Context published on each `TracingChannel` event. */
export interface HookTraceContext {
  name: string;
  args: unknown[];
  result?: unknown;
  error?: unknown;
}

/** Publish hook calls on a `diagnostics_channel` `TracingChannel`. No-op when unavailable. */
export function createTracer(
  hooks: Hookable<any>,
  options: CreateTracerOptions,
): {
  /** Stop tracing. */
  close: () => void;
} {
  const dc = (globalThis as any).process?.getBuiltinModule?.("node:diagnostics_channel") as
    | typeof import("node:diagnostics_channel")
    | undefined;
  if (!dc?.tracingChannel) {
    return { close: () => {} };
  }

  const channel: TracingChannel<unknown, HookTraceContext> = dc.tracingChannel(options.channel);
  const _filter = options.filter;
  const filter = typeof _filter === "string" ? (name: string) => name.startsWith(_filter) : _filter;

  const original = hooks.callHookWith;

  const traced: typeof original = (caller, name, args) => {
    if (
      !(hooks as any)._hooks[name]?.length ||
      (channel as any).hasSubscribers === false ||
      (filter && !filter(name as string))
    ) {
      return original(caller, name, args);
    }
    let result: any;
    let isSync = false;
    const promise = channel.tracePromise(
      () => {
        result = original(caller, name, args);
        if (result instanceof Promise) {
          return result;
        }
        isSync = true;
        return Promise.resolve(result);
      },
      { name: name as string, args: args as unknown[] },
    );
    return isSync ? result : promise;
  };

  hooks.callHookWith = traced;

  return {
    close: () => {
      hooks.callHookWith = original;
    },
  };
}

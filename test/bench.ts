import { bench, compact, summary, run, do_not_optimize } from "mitata";
import { Hookable, HookableCore } from "../src/hookable.ts";
import { Hookable as HookablePrev } from "hookable-prev";

const instances = {
  hookable: new Hookable(),
  hookableCore: new HookableCore(),
  hookablePrev: new HookablePrev(),
} as const;

for (const instance of Object.values(instances)) {
  instance.hook("test", (obj) => {
    obj.called = true;
  });
}

summary(() => {
  compact(() => {
    bench("Hookable", () =>
      do_not_optimize(instances.hookable.callHook("test", {})),
    );
    bench("HookableCore", () =>
      do_not_optimize(instances.hookableCore.callHook("test", {})),
    );
    bench("HookablePrev", () =>
      do_not_optimize(instances.hookablePrev.callHook("test", {})),
    );
  });
});

await run({ throw: true });

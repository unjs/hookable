import { bench, compact, summary, run, do_not_optimize } from "mitata";
import { Hookable, HookableCore } from "../src/hookable.ts";
import { Hookable as Hookable5 } from "hookable-5";
import {
  Hookable as Hookable6RC1,
  HookableCore as Hookable6RC1Core,
} from "hookable-6-rc1";

const instances = {
  hookable: new Hookable(),
  hookableCore: new HookableCore(),
  Hookable5: new Hookable5(),
  Hookable6RC1: new Hookable6RC1(),
  Hookable6RC1Core: new Hookable6RC1Core(),
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
    bench("Hookable5", () =>
      do_not_optimize(instances.Hookable5.callHook("test", {})),
    );
    bench("Hookable6RC1", () =>
      do_not_optimize(instances.Hookable6RC1.callHook("test", {})),
    );
    bench("Hookable6RC1Core", () =>
      do_not_optimize(instances.Hookable6RC1Core.callHook("test", {})),
    );
  });
});

await run({ throw: true });

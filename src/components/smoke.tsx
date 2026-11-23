import type { ComponentProps } from "react";

/** Temporary scaffold used to verify the component toolchain. */
export function Smoke(props: ComponentProps<"span">) {
  return <span data-slot="smoke" {...props} />;
}

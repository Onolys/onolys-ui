import { useState } from "react";
import { errorCode, mapAuthError, type MappedAuthError } from "../errors";
import { ERROR_ID } from "./parts";

export function useFormError() {
  const [error, setError] = useState<MappedAuthError | null>(null);
  return {
    error,
    clear: () => setError(null),
    fail: (err: unknown) => setError(mapAuthError(errorCode(err))),
    failWith: (message: string, field?: MappedAuthError["field"]) => setError({ message, field }),
    /** aria attributes for an input, set while the current error is about that field. */
    fieldProps: (name: NonNullable<MappedAuthError["field"]>) =>
      error?.field === name ? ({ "aria-invalid": true, "aria-describedby": ERROR_ID } as const) : {},
  };
}

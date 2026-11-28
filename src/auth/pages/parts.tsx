import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { Link } from "react-router";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Input } from "../../components/ui/input";
import { Field as OnolysField } from "../../components/onolys/field";
import type { MappedAuthError } from "../errors";
import { AUTH_PATHS, LINK } from "../../constants";
import { withNext } from "../next";

export const ERROR_ID = "form-error";

/** Form layout shared by the auth screens. */
export const FORM = "mt-4 grid max-w-sm grid-cols-1 gap-4 break-words";
/** Stack for non-form states (results, expired links): heading, notice, action. */
export const STACK = "grid max-w-sm grid-cols-1 gap-4 break-words";

/** Error summary: role=alert, takes focus when it appears or changes (accessibility). */
export function ErrorSummary({ error, search }: { error: MappedAuthError; search: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [error]);
  return (
    <Alert
      variant="destructive"
      id={ERROR_ID}
      tabIndex={-1}
      ref={ref}
      className="border-destructive focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      <AlertDescription>
        <p>{error.message}</p>
        {error.offerLogin && (
          <p>
            <Link to={withNext(AUTH_PATHS.login, search)} className={LINK}>
              Log in instead
            </Link>
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}

/** Non-error notice (role=status): info/success styling via semantic tokens, since Alert only has default/destructive. */
export function StatusNote({ children }: { children: ReactNode }) {
  return (
    <Alert role="status" className="bg-muted text-foreground">
      <AlertDescription className="text-foreground">{children}</AlertDescription>
    </Alert>
  );
}

/** Label + Input pair on the shared Field; `id` links them so the accessible name stays the label text. */
export function Field({ label, id, ...input }: { label: string; id: string } & ComponentProps<typeof Input>) {
  return <OnolysField label={label} id={id}>{(fieldId) => <Input id={fieldId} {...input} />}</OnolysField>;
}

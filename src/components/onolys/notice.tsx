import { Alert, AlertDescription } from "../ui/alert";
import type { ComponentProps } from "react";

/**
 * Non-error notice. Alert has only default/destructive, so the amber "notice" look comes from semantic tokens.
 * No role by default (Alert's built-in role="alert" is cleared); pass `role` when the message is announced.
 */
export function Notice({ children, className, role, ...props }: ComponentProps<typeof Alert>) {
  return (
    <Alert role={role} className={["border-score-fair bg-score-fair-bg text-foreground", className].filter(Boolean).join(" ")} {...props}>
      <AlertDescription className="text-foreground">{children}</AlertDescription>
    </Alert>
  );
}

/** Error text block (role=alert) for short inline failures. */
export function ErrorNote({ children, className, ...props }: ComponentProps<typeof Alert>) {
  return (
    <Alert variant="destructive" className={["border-destructive", className].filter(Boolean).join(" ")} {...props}>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

import { useId, type ReactNode } from "react";
import { Label } from "../ui/label";

/** Label above a control; `children` receives the id to put on the control so the label names it. Pass `id` to fix it (else generated). */
export function Field({ label, id: givenId, children }: { label: string; id?: string; children: (id: string) => ReactNode }) {
  const generated = useId();
  const id = givenId ?? generated;
  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="min-h-0 text-base font-semibold">
        {label}
      </Label>
      {children(id)}
    </div>
  );
}

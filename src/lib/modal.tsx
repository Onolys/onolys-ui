import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "./cn";

interface ModalState {
  open: boolean;
  modal: boolean;
}

export const ModalContext = React.createContext<ModalState | null>(null);

const bodyLocks = new WeakMap<
  HTMLElement,
  { count: number; previous: string | null }
>();

/** Count only this package's locks, and return ownership to any previous locker. */
function lockBody(body: HTMLElement) {
  let lock = bodyLocks.get(body);
  if (!lock) {
    lock = { count: 0, previous: body.getAttribute("data-scroll-locked") };
    bodyLocks.set(body, lock);
  }
  lock.count += 1;
  body.setAttribute("data-scroll-locked", String(lock.count));
  return () => {
    lock.count -= 1;
    if (lock.count > 0)
      body.setAttribute("data-scroll-locked", String(lock.count));
    else {
      if (lock.previous === null) body.removeAttribute("data-scroll-locked");
      else body.setAttribute("data-scroll-locked", lock.previous);
      bodyLocks.delete(body);
    }
  };
}

export function useModalState({
  open,
  defaultOpen = false,
  modal = true,
  onOpenChange,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const currentOpen = open ?? internalOpen;
  React.useEffect(() => {
    if (currentOpen && modal) return lockBody(document.body);
  }, [currentOpen, modal]);
  const changeOpen = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange],
  );
  return { open: currentOpen, modal, onOpenChange: changeOpen };
}

/** Radix Overlay adds RemoveScroll's runtime stylesheet; keep just its backdrop. */
export function ModalBackdrop({
  className,
  asChild = false,
  forceMount = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean; forceMount?: boolean }) {
  const state = React.useContext(ModalContext);
  if (!state)
    throw new Error("A modal backdrop must be inside Dialog or AlertDialog.");
  if (!state.modal || (!state.open && !forceMount)) return null;
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      aria-hidden="true"
      data-state={state.open ? "open" : "closed"}
      className={cn(
        "pointer-events-auto fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

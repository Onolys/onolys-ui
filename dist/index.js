import {
  ACTIONS,
  AUTH_PATHS,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  FOOTER_COMPACT,
  Field,
  H1,
  HEADER_CENTER_NAV,
  Input,
  LINK,
  LINK_BTN,
  Label,
  NAV_LINK,
  NOTE,
  PAGE,
  SLOW_START_MS,
  THEME_STORAGE_KEY,
  buttonVariants,
  cn
} from "./chunk-ZJQJQDZX.js";

// src/components/ui/alert-dialog.tsx
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

// src/lib/modal.tsx
import * as React from "react";
import { Slot } from "radix-ui";
import { jsx } from "react/jsx-runtime";
var ModalContext = React.createContext(null);
var bodyLocks = /* @__PURE__ */ new WeakMap();
function lockBody(body) {
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
function useModalState({
  open,
  defaultOpen = false,
  modal = true,
  onOpenChange
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const currentOpen = open ?? internalOpen;
  React.useEffect(() => {
    if (currentOpen && modal) return lockBody(document.body);
  }, [currentOpen, modal]);
  const changeOpen = React.useCallback(
    (next) => {
      if (open === void 0) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange]
  );
  return { open: currentOpen, modal, onOpenChange: changeOpen };
}
function ModalBackdrop({
  className,
  asChild = false,
  forceMount = false,
  ...props
}) {
  const state = React.useContext(ModalContext);
  if (!state)
    throw new Error("A modal backdrop must be inside Dialog or AlertDialog.");
  if (!state.modal || !state.open && !forceMount) return null;
  const Comp = asChild ? Slot.Root : "div";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "aria-hidden": "true",
      "data-state": state.open ? "open" : "closed",
      className: cn(
        "pointer-events-auto fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/alert-dialog.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function AlertDialog({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}) {
  const state = useModalState({ open, defaultOpen, onOpenChange });
  return /* @__PURE__ */ jsx2(ModalContext.Provider, { value: state, children: /* @__PURE__ */ jsx2(
    AlertDialogPrimitive.Root,
    {
      ...props,
      open: state.open,
      onOpenChange: state.onOpenChange
    }
  ) });
}
function AlertDialogTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    AlertDialogPrimitive.Trigger,
    {
      className: cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      ),
      "data-slot": "alert-dialog-trigger",
      ...props
    }
  );
}
function AlertDialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx2(AlertDialogPrimitive.Portal, { "data-slot": "alert-dialog-portal", ...props });
}
function AlertDialogOverlay(props) {
  return /* @__PURE__ */ jsx2(ModalBackdrop, { "data-slot": "alert-dialog-overlay", ...props });
}
function AlertDialogContent({
  className,
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [
    /* @__PURE__ */ jsx2(AlertDialogOverlay, {}),
    /* @__PURE__ */ jsx2(
      AlertDialogPrimitive.Content,
      {
        "data-slot": "alert-dialog-content",
        "data-size": size,
        className: cn(
          "group/alert-dialog-content fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-border bg-background p-6 shadow-lg duration-200 data-[size=sm]:max-w-xs data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[size=default]:sm:max-w-lg",
          className
        ),
        ...props
      }
    )
  ] });
}
function AlertDialogHeader({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      "data-slot": "alert-dialog-header",
      className: cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className
      ),
      ...props
    }
  );
}
function AlertDialogFooter({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      "data-slot": "alert-dialog-footer",
      className: cn(
        "flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props
    }
  );
}
function AlertDialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    AlertDialogPrimitive.Title,
    {
      "data-slot": "alert-dialog-title",
      className: cn(
        "text-lg font-semibold sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        className
      ),
      ...props
    }
  );
}
function AlertDialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    AlertDialogPrimitive.Description,
    {
      "data-slot": "alert-dialog-description",
      className: cn("text-sm text-muted-foreground", className),
      ...props
    }
  );
}
function AlertDialogMedia({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      "data-slot": "alert-dialog-media",
      className: cn(
        "mb-2 inline-flex size-16 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8",
        className
      ),
      ...props
    }
  );
}
function AlertDialogAction({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx2(Button, { variant, size, asChild: true, children: /* @__PURE__ */ jsx2(
    AlertDialogPrimitive.Action,
    {
      "data-slot": "alert-dialog-action",
      className: cn(className),
      ...props
    }
  ) });
}
function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx2(Button, { variant, size, asChild: true, children: /* @__PURE__ */ jsx2(
    AlertDialogPrimitive.Cancel,
    {
      "data-slot": "alert-dialog-cancel",
      className: cn(className),
      ...props
    }
  ) });
}

// src/components/ui/badge.tsx
import { cva } from "class-variance-authority";
import { Slot as Slot2 } from "radix-ui";
import { jsx as jsx3 } from "react/jsx-runtime";
var badgeVariants = cva(
  "inline-flex [a&]:min-h-11 [a&]:min-w-11 [button&]:min-h-11 [button&]:min-w-11 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary",
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary",
        destructive: "bg-destructive text-destructive-foreground [a&]:hover:bg-destructive",
        outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot2.Root : "span";
  return /* @__PURE__ */ jsx3(
    Comp,
    {
      "data-slot": "badge",
      "data-variant": variant,
      className: cn(badgeVariants({ variant }), className),
      ...props
    }
  );
}

// src/components/ui/card.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "flex flex-col gap-6 rounded-xl border border-border bg-card py-6 text-card-foreground shadow-sm",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "card-title",
      className: cn("leading-none font-semibold", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-sm text-muted-foreground", className),
      ...props
    }
  );
}
function CardAction({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "card-action",
      className: cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      ),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-6", className),
      ...props
    }
  );
}
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      "data-slot": "card-footer",
      className: cn("flex items-center px-6 [.border-t]:pt-6", className),
      ...props
    }
  );
}

// src/components/ui/checkbox.tsx
import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { jsx as jsx5 } from "react/jsx-runtime";
function Checkbox({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx5(
    CheckboxPrimitive.Root,
    {
      "data-slot": "checkbox",
      className: cn(
        "peer size-11 min-h-11 min-w-11 bg-background text-foreground shrink-0 rounded-sm border border-input shadow-sm transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx5(
        CheckboxPrimitive.Indicator,
        {
          "data-slot": "checkbox-indicator",
          className: "grid place-content-center text-current transition-none",
          children: /* @__PURE__ */ jsx5(CheckIcon, { className: "size-3.5" })
        }
      )
    }
  );
}

// src/components/ui/dialog.tsx
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { jsx as jsx6, jsxs as jsxs2 } from "react/jsx-runtime";
function Dialog({
  open,
  defaultOpen,
  onOpenChange,
  modal = true,
  ...props
}) {
  const state = useModalState({ open, defaultOpen, onOpenChange, modal });
  return /* @__PURE__ */ jsx6(ModalContext.Provider, { value: state, children: /* @__PURE__ */ jsx6(DialogPrimitive.Root, { ...props, ...state }) });
}
function DialogTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx6(
    DialogPrimitive.Trigger,
    {
      className: cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      ),
      "data-slot": "dialog-trigger",
      ...props
    }
  );
}
function DialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx6(DialogPrimitive.Portal, { "data-slot": "dialog-portal", ...props });
}
function DialogClose({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx6(
    DialogPrimitive.Close,
    {
      className: cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      ),
      "data-slot": "dialog-close",
      ...props
    }
  );
}
function DialogOverlay(props) {
  return /* @__PURE__ */ jsx6(ModalBackdrop, { "data-slot": "dialog-overlay", ...props });
}
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  return /* @__PURE__ */ jsxs2(DialogPortal, { "data-slot": "dialog-portal", children: [
    /* @__PURE__ */ jsx6(DialogOverlay, {}),
    /* @__PURE__ */ jsxs2(
      DialogPrimitive.Content,
      {
        "data-slot": "dialog-content",
        className: cn(
          "fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-border bg-background p-6 shadow-lg duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
          className
        ),
        ...props,
        children: [
          children,
          showCloseButton && /* @__PURE__ */ jsxs2(
            DialogPrimitive.Close,
            {
              "data-slot": "dialog-close",
              className: "absolute top-2 right-2 inline-flex size-11 items-center justify-center rounded-xs ring-offset-background transition-opacity hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              children: [
                /* @__PURE__ */ jsx6(XIcon, {}),
                /* @__PURE__ */ jsx6("span", { className: "sr-only", children: "Close" })
              ]
            }
          )
        ]
      }
    )
  ] });
}
function DialogHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      "data-slot": "dialog-header",
      className: cn("flex flex-col gap-2 text-center sm:text-left", className),
      ...props
    }
  );
}
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      "data-slot": "dialog-footer",
      className: cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props,
      children: [
        children,
        showCloseButton && /* @__PURE__ */ jsx6(DialogPrimitive.Close, { asChild: true, children: /* @__PURE__ */ jsx6(Button, { variant: "outline", children: "Close" }) })
      ]
    }
  );
}
function DialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx6(
    DialogPrimitive.Title,
    {
      "data-slot": "dialog-title",
      className: cn("text-lg leading-none font-semibold", className),
      ...props
    }
  );
}
function DialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx6(
    DialogPrimitive.Description,
    {
      "data-slot": "dialog-description",
      className: cn("text-sm text-muted-foreground", className),
      ...props
    }
  );
}

// src/components/ui/dropdown-menu.tsx
import { CheckIcon as CheckIcon2, ChevronRightIcon, CircleIcon } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { jsx as jsx7, jsxs as jsxs3 } from "react/jsx-runtime";
function DropdownMenu({
  ...props
}) {
  return /* @__PURE__ */ jsx7(
    DropdownMenuPrimitive.Root,
    {
      "data-slot": "dropdown-menu",
      ...props,
      modal: false
    }
  );
}
function DropdownMenuPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx7(DropdownMenuPrimitive.Portal, { "data-slot": "dropdown-menu-portal", ...props });
}
function DropdownMenuTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx7(
    DropdownMenuPrimitive.Trigger,
    {
      className: cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      ),
      "data-slot": "dropdown-menu-trigger",
      ...props
    }
  );
}
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsx7(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx7(
    DropdownMenuPrimitive.Content,
    {
      "data-slot": "dropdown-menu-content",
      sideOffset,
      className: cn(
        "z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        className
      ),
      ...props
    }
  ) });
}
function DropdownMenuGroup({
  ...props
}) {
  return /* @__PURE__ */ jsx7(DropdownMenuPrimitive.Group, { "data-slot": "dropdown-menu-group", ...props });
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx7(
    DropdownMenuPrimitive.Item,
    {
      "data-slot": "dropdown-menu-item",
      "data-inset": inset,
      "data-variant": variant,
      className: cn(
        "relative flex min-h-11 cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-accent data-[variant=destructive]:focus:text-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}) {
  return /* @__PURE__ */ jsxs3(
    DropdownMenuPrimitive.CheckboxItem,
    {
      "data-slot": "dropdown-menu-checkbox-item",
      className: cn(
        "relative flex min-h-11 cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      checked,
      ...props,
      children: [
        /* @__PURE__ */ jsx7("span", { className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center", children: /* @__PURE__ */ jsx7(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx7(CheckIcon2, { className: "size-4" }) }) }),
        children
      ]
    }
  );
}
function DropdownMenuRadioGroup({
  ...props
}) {
  return /* @__PURE__ */ jsx7(
    DropdownMenuPrimitive.RadioGroup,
    {
      "data-slot": "dropdown-menu-radio-group",
      ...props
    }
  );
}
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs3(
    DropdownMenuPrimitive.RadioItem,
    {
      "data-slot": "dropdown-menu-radio-item",
      className: cn(
        "relative flex min-h-11 cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx7("span", { className: "pointer-events-none absolute left-2 flex size-3.5 items-center justify-center", children: /* @__PURE__ */ jsx7(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx7(CircleIcon, { className: "size-2 fill-current" }) }) }),
        children
      ]
    }
  );
}
function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return /* @__PURE__ */ jsx7(
    DropdownMenuPrimitive.Label,
    {
      "data-slot": "dropdown-menu-label",
      "data-inset": inset,
      className: cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx7(
    DropdownMenuPrimitive.Separator,
    {
      "data-slot": "dropdown-menu-separator",
      className: cn("-mx-1 my-1 h-px bg-border", className),
      ...props
    }
  );
}
function DropdownMenuShortcut({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx7(
    "span",
    {
      "data-slot": "dropdown-menu-shortcut",
      className: cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuSub({
  ...props
}) {
  return /* @__PURE__ */ jsx7(DropdownMenuPrimitive.Sub, { "data-slot": "dropdown-menu-sub", ...props });
}
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsxs3(
    DropdownMenuPrimitive.SubTrigger,
    {
      "data-slot": "dropdown-menu-sub-trigger",
      "data-inset": inset,
      className: cn(
        "flex min-h-11 cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset select-none focus:bg-accent focus:text-accent-foreground data-[inset]:pl-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx7(ChevronRightIcon, { className: "ml-auto size-4" })
      ]
    }
  );
}
function DropdownMenuSubContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx7(
    DropdownMenuPrimitive.SubContent,
    {
      "data-slot": "dropdown-menu-sub-content",
      className: cn(
        "z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/progress.tsx
import { jsx as jsx8 } from "react/jsx-runtime";
function Progress({ className, max = 100, ...props }) {
  return /* @__PURE__ */ jsx8(
    "progress",
    {
      "data-slot": "progress",
      max,
      className: cn(
        "block h-3 w-full appearance-none overflow-hidden rounded-full border-0 bg-muted accent-primary",
        "[&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary",
        "motion-safe:[&::-webkit-progress-value]:transition-[width] motion-safe:[&::-webkit-progress-value]:duration-500",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/select.tsx
import { jsx as jsx9 } from "react/jsx-runtime";
function Select({ className, ...props }) {
  return /* @__PURE__ */ jsx9(
    "select",
    {
      "data-slot": "select",
      className: cn(
        "min-h-11 min-w-11 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/separator.tsx
import { Separator as SeparatorPrimitive } from "radix-ui";
import { jsx as jsx10 } from "react/jsx-runtime";
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}) {
  return /* @__PURE__ */ jsx10(
    SeparatorPrimitive.Root,
    {
      "data-slot": "separator",
      decorative,
      orientation,
      className: cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/skeleton.tsx
import { jsx as jsx11 } from "react/jsx-runtime";
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsx11(
    "div",
    {
      "data-slot": "skeleton",
      className: cn("animate-pulse rounded-md bg-accent", className),
      ...props
    }
  );
}

// src/components/ui/spinner.tsx
import { jsx as jsx12 } from "react/jsx-runtime";
function Spinner({ className, ...props }) {
  return /* @__PURE__ */ jsx12(
    "span",
    {
      "data-slot": "spinner",
      "aria-hidden": "true",
      className: cn(
        "inline-block size-4 shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin motion-reduce:border-t-current",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/table.tsx
import { jsx as jsx13 } from "react/jsx-runtime";
function Table({ className, ...props }) {
  return /* @__PURE__ */ jsx13(
    "div",
    {
      "data-slot": "table-container",
      className: "relative w-full overflow-x-auto",
      children: /* @__PURE__ */ jsx13(
        "table",
        {
          "data-slot": "table",
          className: cn("w-full caption-bottom text-sm", className),
          ...props
        }
      )
    }
  );
}
function TableHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx13(
    "thead",
    {
      "data-slot": "table-header",
      className: cn("[&_tr]:border-b", className),
      ...props
    }
  );
}
function TableBody({ className, ...props }) {
  return /* @__PURE__ */ jsx13(
    "tbody",
    {
      "data-slot": "table-body",
      className: cn("[&_tr:last-child]:border-0", className),
      ...props
    }
  );
}
function TableFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx13(
    "tfoot",
    {
      "data-slot": "table-footer",
      className: cn(
        "border-t border-border bg-muted font-medium [&>tr]:last:border-b-0",
        className
      ),
      ...props
    }
  );
}
function TableRow({ className, ...props }) {
  return /* @__PURE__ */ jsx13(
    "tr",
    {
      "data-slot": "table-row",
      className: cn(
        "border-b border-border transition-colors hover:bg-muted has-aria-expanded:bg-muted data-[state=selected]:bg-selected",
        className
      ),
      ...props
    }
  );
}
function TableHead({ className, ...props }) {
  return /* @__PURE__ */ jsx13(
    "th",
    {
      "data-slot": "table-head",
      className: cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function TableCell({ className, ...props }) {
  return /* @__PURE__ */ jsx13(
    "td",
    {
      "data-slot": "table-cell",
      className: cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      ),
      ...props
    }
  );
}
function TableCaption({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx13(
    "caption",
    {
      "data-slot": "table-caption",
      className: cn("mt-4 text-sm text-muted-foreground", className),
      ...props
    }
  );
}

// src/components/ui/tabs.tsx
import { cva as cva2 } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import { jsx as jsx14 } from "react/jsx-runtime";
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}) {
  return /* @__PURE__ */ jsx14(
    TabsPrimitive.Root,
    {
      "data-slot": "tabs",
      "data-orientation": orientation,
      orientation,
      className: cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      ),
      ...props
    }
  );
}
var tabsListVariants = cva2(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:min-h-11 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function TabsList({
  className,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx14(
    TabsPrimitive.List,
    {
      "data-slot": "tabs-list",
      "data-variant": variant,
      className: cn(tabsListVariants({ variant }), className),
      ...props
    }
  );
}
function TabsTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx14(
    TabsPrimitive.Trigger,
    {
      "data-slot": "tabs-trigger",
      className: cn(
        "relative inline-flex min-h-11 min-w-11 flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "data-[state=active]:bg-background data-[state=active]:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        className
      ),
      ...props
    }
  );
}
function TabsContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx14(
    TabsPrimitive.Content,
    {
      "data-slot": "tabs-content",
      className: cn(
        "flex-1 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/textarea.tsx
import { jsx as jsx15 } from "react/jsx-runtime";
function Textarea({ className, ...props }) {
  return /* @__PURE__ */ jsx15(
    "textarea",
    {
      "data-slot": "textarea",
      className: cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
        className
      ),
      ...props
    }
  );
}

// src/components/ui/tooltip.tsx
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { jsx as jsx16, jsxs as jsxs4 } from "react/jsx-runtime";
function TooltipProvider({
  delayDuration = 0,
  ...props
}) {
  return /* @__PURE__ */ jsx16(
    TooltipPrimitive.Provider,
    {
      "data-slot": "tooltip-provider",
      delayDuration,
      ...props
    }
  );
}
function Tooltip({
  ...props
}) {
  return /* @__PURE__ */ jsx16(TooltipPrimitive.Root, { "data-slot": "tooltip", ...props });
}
function TooltipTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx16(
    TooltipPrimitive.Trigger,
    {
      className: cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      ),
      "data-slot": "tooltip-trigger",
      ...props
    }
  );
}
function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx16(TooltipPrimitive.Portal, { children: /* @__PURE__ */ jsxs4(
    TooltipPrimitive.Content,
    {
      "data-slot": "tooltip-content",
      sideOffset,
      className: cn(
        "z-50 w-fit origin-(--radix-tooltip-content-transform-origin) animate-in rounded-md border border-border bg-popover shadow-md px-3 py-1.5 text-xs text-balance text-popover-foreground fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx16(TooltipPrimitive.Arrow, { className: "z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-popover fill-popover" })
      ]
    }
  ) });
}

// src/components/onolys/app-header.tsx
import { jsx as jsx17, jsxs as jsxs5 } from "react/jsx-runtime";
function AppHeader({
  brand,
  navigation,
  navigationLabel = "Main",
  accountMenu,
  centerNavigation = false,
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxs5(
    "header",
    {
      "data-slot": "app-header",
      className: cn(centerNavigation && HEADER_CENTER_NAV, "flex min-h-header flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-background px-gutter py-2 text-foreground", className),
      ...props,
      children: [
        /* @__PURE__ */ jsx17("div", { "data-slot": "app-header-brand", className: "mr-auto flex items-center font-semibold [&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center", children: brand }),
        navigation != null && navigation !== false && /* @__PURE__ */ jsx17("nav", { "aria-label": navigationLabel, className: "flex flex-wrap items-center gap-4 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center", children: navigation }),
        accountMenu != null && accountMenu !== false && /* @__PURE__ */ jsx17("div", { "data-slot": "app-header-account", className: "flex items-center [&_button]:min-h-11 [&_button]:min-w-11", children: accountMenu })
      ]
    }
  );
}

// src/components/onolys/footer.tsx
import { jsx as jsx18, jsxs as jsxs6 } from "react/jsx-runtime";
function Footer({
  notices,
  links,
  linksLabel = "Footer",
  copyright,
  compact = false,
  themeToggle,
  children,
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxs6(
    "footer",
    {
      "data-slot": "footer",
      className: cn("space-y-4 bg-footer-bg px-gutter py-8 text-footer-text [&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center [&_a]:text-footer-link [&_a:focus-visible]:outline-footer-link", compact && FOOTER_COMPACT, className),
      ...props,
      children: [
        notices,
        links != null && links !== false && /* @__PURE__ */ jsx18("nav", { "aria-label": linksLabel, className: "flex flex-wrap gap-x-4 gap-y-2", children: links }),
        children,
        copyright != null && /* @__PURE__ */ jsx18("div", { className: "text-sm text-footer-muted", children: copyright }),
        themeToggle != null && themeToggle !== false && /* @__PURE__ */ jsx18("div", { "data-slot": "footer-theme-toggle", className: "absolute right-3 bottom-2", children: themeToggle })
      ]
    }
  );
}

// src/components/onolys/score-badge.tsx
import { jsx as jsx19, jsxs as jsxs7 } from "react/jsx-runtime";
var scoreStyles = {
  good: "bg-score-good-bg text-score-good",
  fair: "bg-score-fair-bg text-score-fair",
  low: "bg-score-low-bg text-score-low"
};
var scoreLabels = { good: "Good", fair: "Fair", low: "Low" };
function ScoreBadge({ variant, children, className, ...props }) {
  return /* @__PURE__ */ jsxs7(
    "span",
    {
      "data-slot": "score-badge",
      "data-variant": variant,
      className: cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium", scoreStyles[variant], className),
      ...props,
      children: [
        /* @__PURE__ */ jsx19("span", { children: scoreLabels[variant] }),
        children != null && /* @__PURE__ */ jsx19("span", { children })
      ]
    }
  );
}

// src/components/onolys/usage-meter.tsx
import { useId } from "react";
import { jsx as jsx20, jsxs as jsxs8 } from "react/jsx-runtime";
function UsageMeter({
  label,
  used,
  cap,
  periodLabel,
  className,
  ...props
}) {
  const id = useId();
  const limit = Number.isFinite(cap) ? Math.max(0, cap) : 0;
  const consumed = Number.isNaN(used) ? 0 : Math.max(0, Math.min(used, limit));
  const remaining = limit - consumed;
  const summary = `${remaining} of ${limit} left${periodLabel ? ` ${periodLabel}` : ""}`;
  return /* @__PURE__ */ jsxs8("div", { "data-slot": "usage-meter", className: cn("space-y-2 text-sm text-foreground", className), ...props, children: [
    /* @__PURE__ */ jsxs8("div", { className: "flex flex-wrap items-center justify-between gap-x-4 gap-y-1", children: [
      /* @__PURE__ */ jsx20("span", { id: `${id}-label`, children: label.trim() || "Usage" }),
      /* @__PURE__ */ jsx20("span", { id: `${id}-summary`, className: "text-muted-foreground", children: summary })
    ] }),
    /* @__PURE__ */ jsx20(
      "meter",
      {
        "aria-labelledby": `${id}-label`,
        "aria-describedby": `${id}-summary`,
        "aria-valuetext": summary,
        min: 0,
        max: limit > 0 ? limit : 1,
        value: remaining,
        className: "block h-3 w-full accent-primary [&::-webkit-meter-bar]:rounded-full [&::-webkit-meter-bar]:border-0 [&::-webkit-meter-bar]:bg-muted [&::-webkit-meter-optimum-value]:bg-primary [&::-moz-meter-bar]:bg-primary"
      }
    )
  ] });
}

// src/components/onolys/skip-link.tsx
import { jsx as jsx21 } from "react/jsx-runtime";
function SkipLink({
  targetId = "main",
  children = "Skip to main content",
  onClick,
  className,
  ...props
}) {
  function focusTarget(event) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const target = document.getElementById(targetId);
    if (target) {
      if (!target.hasAttribute("tabindex") && target.tabIndex < 0) target.setAttribute("tabindex", "-1");
      target.focus();
    }
  }
  return /* @__PURE__ */ jsx21(
    "a",
    {
      "data-slot": "skip-link",
      href: `#${encodeURIComponent(targetId)}`,
      onClick: focusTarget,
      className: cn("sr-only min-h-11 min-w-11 items-center rounded-md bg-background px-4 py-2 text-primary focus:not-sr-only focus:absolute focus:top-4 focus:left-gutter focus:z-50 focus:inline-flex", className),
      ...props,
      children
    }
  );
}

// src/components/onolys/page.tsx
import { jsx as jsx22 } from "react/jsx-runtime";
function Page({ id = "main", tabIndex = -1, className, ...props }) {
  return /* @__PURE__ */ jsx22("main", { "data-slot": "page", id, tabIndex, className: cn("mx-auto w-full max-w-7xl px-gutter py-8 text-foreground", className), ...props });
}
function Section({ className, ...props }) {
  return /* @__PURE__ */ jsx22("section", { "data-slot": "section", className: cn("space-y-6", className), ...props });
}

// src/components/onolys/notice.tsx
import { jsx as jsx23 } from "react/jsx-runtime";
function Notice({ children, className, role, ...props }) {
  return /* @__PURE__ */ jsx23(Alert, { role, className: ["border-score-fair bg-score-fair-bg text-foreground", className].filter(Boolean).join(" "), ...props, children: /* @__PURE__ */ jsx23(AlertDescription, { className: "text-foreground", children }) });
}
function ErrorNote({ children, className, ...props }) {
  return /* @__PURE__ */ jsx23(Alert, { variant: "destructive", className: ["border-destructive", className].filter(Boolean).join(" "), ...props, children: /* @__PURE__ */ jsx23(AlertDescription, { children }) });
}

// src/components/onolys/status-chip.tsx
import { jsx as jsx24 } from "react/jsx-runtime";
var GOOD = "border-score-good bg-score-good-bg text-score-good";
var FAIR = "border-score-fair bg-score-fair-bg text-score-fair";
var LOW = "border-score-low bg-score-low-bg text-score-low";
var TONE = {
  progress: "border-primary text-primary",
  wait: FAIR,
  done: GOOD,
  failed: LOW,
  agree: GOOD,
  differs: LOW,
  flagged: FAIR,
  neutral: "",
  muted: "text-muted-foreground"
};
function StatusChip({ tone = "neutral", className, ...props }) {
  return /* @__PURE__ */ jsx24(Badge, { variant: "outline", "data-tone": tone, className: [TONE[tone], className].filter(Boolean).join(" "), ...props });
}

// src/components/onolys/slow-start.tsx
import { useEffect as useEffect2, useState as useState2 } from "react";
import { jsx as jsx25, jsxs as jsxs9 } from "react/jsx-runtime";
function useSlowPending(pending, delayMs = SLOW_START_MS) {
  const [slow, setSlow] = useState2(false);
  useEffect2(() => {
    if (!pending) return;
    const id = setTimeout(() => setSlow(true), delayMs);
    return () => {
      clearTimeout(id);
      setSlow(false);
    };
  }, [pending, delayMs]);
  return pending && slow;
}
function SlowStartNotice({ pending, delayMs }) {
  if (!useSlowPending(pending, delayMs)) return null;
  return /* @__PURE__ */ jsxs9("p", { role: "status", "aria-live": "polite", className: `${NOTE} flex items-center gap-2`, children: [
    /* @__PURE__ */ jsx25(Spinner, { className: "size-3" }),
    "Starting the server\u2026 this can take a few seconds."
  ] });
}

// src/components/onolys/error-recovery.tsx
import { useEffect as useEffect3, useRef } from "react";
import { jsx as jsx26, jsxs as jsxs10 } from "react/jsx-runtime";
var SAFE_REFERENCE = /^[A-Za-z0-9._-]{1,64}$/;
function ErrorRecovery({ status, reference, homeHref = "/", reload = () => window.location.reload() }) {
  const heading = useRef(null);
  useEffect3(() => {
    heading.current?.focus();
  }, []);
  const safeReference = reference && SAFE_REFERENCE.test(reference) ? reference : void 0;
  const notFound = status === 404;
  return /* @__PURE__ */ jsxs10("section", { role: "alert", className: "grid gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground", children: [
    /* @__PURE__ */ jsx26("h1", { ref: heading, tabIndex: -1, className: "text-2xl font-semibold", children: notFound ? "Page not found" : "Something went wrong" }),
    /* @__PURE__ */ jsx26("p", { children: notFound ? "We couldn't find this page. Check the link or go back to the start." : "We couldn't load this page. Reload to try again, or go back to the start." }),
    status ? /* @__PURE__ */ jsxs10("p", { className: "text-sm text-muted-foreground", children: [
      "Error ",
      status
    ] }) : null,
    safeReference ? /* @__PURE__ */ jsxs10("p", { className: "break-all text-sm text-muted-foreground", children: [
      "Reference: ",
      safeReference
    ] }) : null,
    /* @__PURE__ */ jsxs10("div", { className: ACTIONS, children: [
      /* @__PURE__ */ jsx26("button", { type: "button", className: "min-h-11 rounded-md border border-border px-4 py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2", onClick: reload, children: "Reload page" }),
      /* @__PURE__ */ jsx26("a", { href: homeHref, className: LINK, children: "Back to the start" })
    ] })
  ] });
}

// src/components/onolys/account-menu.tsx
import { useEffect as useEffect4, useRef as useRef2, useState as useState3 } from "react";
import { jsx as jsx27, jsxs as jsxs11 } from "react/jsx-runtime";
var plainLink = (link) => /* @__PURE__ */ jsx27("a", { href: link.href, children: link.label });
function AccountMenu({ email, links = [], renderLink = plainLink, onSignOut }) {
  const [open, setOpen] = useState3(false);
  const contentRef = useRef2(null);
  const navigating = useRef2(false);
  useEffect4(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const el = contentRef.current;
      if (el && (document.activeElement === el || document.activeElement === document.body)) el.querySelector('[role="menuitem"]')?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);
  const initial = (email?.trim()[0] ?? "?").toUpperCase();
  return /* @__PURE__ */ jsxs11(DropdownMenu, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx27(Button, { asChild: true, size: "icon", className: "rounded-full font-semibold", children: /* @__PURE__ */ jsx27(DropdownMenuTrigger, { "aria-label": "Account menu", children: initial }) }),
    /* @__PURE__ */ jsxs11(
      DropdownMenuContent,
      {
        ref: contentRef,
        align: "end",
        loop: true,
        onCloseAutoFocus: (e) => {
          if (navigating.current) {
            e.preventDefault();
            navigating.current = false;
          }
        },
        onKeyDown: (e) => {
          if (e.key === "Tab") setOpen(false);
        },
        className: "min-w-56 max-w-80",
        children: [
          email && /* @__PURE__ */ jsx27(DropdownMenuLabel, { className: "font-normal break-words text-muted-foreground", children: email }),
          email && /* @__PURE__ */ jsx27(DropdownMenuSeparator, {}),
          links.map((link) => /* @__PURE__ */ jsx27(
            DropdownMenuItem,
            {
              asChild: true,
              onSelect: () => {
                navigating.current = true;
              },
              children: renderLink(link)
            },
            link.href
          )),
          /* @__PURE__ */ jsx27(DropdownMenuItem, { onSelect: onSignOut, children: "Sign out" })
        ]
      }
    )
  ] });
}

// src/components/onolys/theme-toggle.tsx
import { useState as useState4 } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

// src/lib/theme.ts
var ORDER = ["system", "light", "dark"];
function nextTheme(t) {
  return ORDER[(ORDER.indexOf(t) + 1) % ORDER.length];
}
function readTheme() {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}
function saveTheme(t) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, t);
  } catch {
  }
}
function applyTheme(t) {
  const el = document.documentElement;
  if (t === "system") delete el.dataset.theme;
  else el.dataset.theme = t;
}

// src/components/onolys/theme-toggle.tsx
import { jsx as jsx28 } from "react/jsx-runtime";
var LABEL = { system: "System", light: "Light", dark: "Dark" };
var ICON = { system: Monitor, light: Sun, dark: Moon };
function ThemeToggle({ className }) {
  const [theme, setTheme] = useState4(() => {
    const t = readTheme();
    applyTheme(t);
    return t;
  });
  const next = nextTheme(theme);
  const label = `Theme: ${LABEL[theme]} (click for ${LABEL[next]})`;
  const Icon = ICON[theme];
  return /* @__PURE__ */ jsx28(
    "button",
    {
      type: "button",
      "aria-label": label,
      title: label,
      className: `inline-flex size-8 items-center justify-center rounded-md text-current opacity-80 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className ?? ""}`,
      onClick: () => {
        applyTheme(next);
        saveTheme(next);
        setTheme(next);
      },
      children: /* @__PURE__ */ jsx28(Icon, { "aria-hidden": "true", className: "size-4" })
    }
  );
}

// src/lib/format.ts
function formatElapsed(ms) {
  if (!Number.isFinite(ms)) return "0:00";
  const total = Math.max(0, Math.floor(ms / 1e3));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function formatResetTime(iso) {
  if (!iso) return void 0;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return void 0;
  return d.toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}
function formatDate(iso, opts = {}) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(opts.locale, { year: "numeric", month: "short", day: "numeric", timeZone: opts.timeZone });
}
export {
  ACTIONS,
  AUTH_PATHS,
  AccountMenu,
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  AppHeader,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  ErrorNote,
  ErrorRecovery,
  Field,
  Footer,
  H1,
  HEADER_CENTER_NAV,
  Input,
  LINK,
  LINK_BTN,
  Label,
  NAV_LINK,
  NOTE,
  Notice,
  PAGE,
  Page,
  Progress,
  SLOW_START_MS,
  ScoreBadge,
  Section,
  Select,
  Separator,
  Skeleton,
  SkipLink,
  SlowStartNotice,
  Spinner,
  StatusChip,
  THEME_STORAGE_KEY,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ThemeToggle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UsageMeter,
  applyTheme,
  badgeVariants,
  buttonVariants,
  cn,
  formatDate,
  formatElapsed,
  formatResetTime,
  nextTheme,
  readTheme,
  saveTheme,
  tabsListVariants,
  useSlowPending
};
//# sourceMappingURL=index.js.map
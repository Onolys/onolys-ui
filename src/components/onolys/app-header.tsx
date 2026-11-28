import type { ComponentProps, ReactNode } from "react";
import { HEADER_CENTER_NAV } from "../../constants";
import { cn } from "../../lib/cn";

export type AppHeaderProps = Omit<ComponentProps<"header">, "children"> & {
  brand: ReactNode;
  navigation?: ReactNode;
  navigationLabel?: string;
  accountMenu?: ReactNode;
  /** Place the navigation at the true centre of the bar (brand left, account menu right). */
  centerNavigation?: boolean;
};

/** Applications supply their own router links and decide when account controls appear. */
export function AppHeader({
  brand, navigation, navigationLabel = "Main", accountMenu, centerNavigation = false, className, ...props
}: AppHeaderProps) {
  return (
    <header
      data-slot="app-header"
      className={cn(centerNavigation && HEADER_CENTER_NAV, "flex min-h-header flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-background px-gutter py-2 text-foreground", className)}
      {...props}
    >
      <div data-slot="app-header-brand" className="mr-auto flex items-center font-semibold [&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center">
        {brand}
      </div>
      {navigation != null && navigation !== false && (
        <nav aria-label={navigationLabel} className="flex flex-wrap items-center gap-4 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:min-w-11 [&_a]:items-center">
          {navigation}
        </nav>
      )}
      {accountMenu != null && accountMenu !== false && (
        <div data-slot="app-header-account" className="flex items-center [&_button]:min-h-11 [&_button]:min-w-11">
          {accountMenu}
        </div>
      )}
    </header>
  );
}

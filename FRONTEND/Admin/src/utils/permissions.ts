import { NavSection, NavItem } from "@/components/Layouts/sidebar/data";
import { Permission } from "@/context/auth";

function checkItemPermission(
  navItem: NavItem,
  permissions: Permission[]
): boolean {
  if (!navItem.module) {
    return true;
  }

  return permissions.some((perm) => {
    const moduleMatch = perm.module === navItem.module;
    const submoduleMatch = navItem.submodule
      ? perm.submodule === navItem.submodule
      : perm.submodule === null;

    return moduleMatch && submoduleMatch && perm.can_view && perm.status;
  });
}

function filterNavItem(
  item: NavItem | { type: string },
  permissions: Permission[]
): NavItem | { type: string } | null {
  if ("type" in item) {
    return item;
  }

  const navItem = item as NavItem;

  if (navItem.items && navItem.items.length > 0) {
    const filteredChildren = navItem.items
      .map((child) => filterNavItem(child, permissions))
      .filter((item) => item !== null);

    if (filteredChildren.length > 0) {
      return {
        ...navItem,
        items: filteredChildren as NavItem[],
      };
    }

    return null;
  }

  return checkItemPermission(navItem, permissions) ? navItem : null;
}

export function filterNavByPermissions(
  navData: NavSection[],
  permissions: Permission[] = []
): NavSection[] {
  if (!permissions || permissions.length === 0) {
    return [];
  }

  return navData
    .map((section) => {
      const filteredItems = section.items
        .map((item) => filterNavItem(item, permissions))
        .filter((item) => item !== null)
        .filter((_, index, arr) => {
          if (index >= arr.length) return true;
          const item = arr[index];
          const nextItem = arr[index + 1];

          if ("type" in item && (item as any).type === "divider") {
            const prevWasFiltered = index === 0;
            const nextIsEmpty = !nextItem;
            const nextIsDivider =
              nextItem && "type" in nextItem && (nextItem as any).type === "divider";

            return !prevWasFiltered && !nextIsEmpty && !nextIsDivider;
          }

          return true;
        });

      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter((section) => section.items.length > 0);
}

export function hasPermission(
  permissions: Permission[],
  module: string,
  submodule?: string,
  action: "can_create" | "can_view" | "can_update" | "can_delete" = "can_view"
): boolean {
  return permissions.some((perm) => {
    const moduleMatch = perm.module === module;
    const submoduleMatch = submodule ? perm.submodule === submodule : perm.submodule === null;

    return (
      moduleMatch &&
      submoduleMatch &&
      perm[action] &&
      perm.status
    );
  });
}

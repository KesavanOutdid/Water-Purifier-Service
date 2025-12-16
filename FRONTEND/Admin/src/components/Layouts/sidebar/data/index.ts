import * as Icons from "../icons";

export interface NavItem {
  title: string;
  icon?: any;
  url?: string;
  items: NavItem[];
  module?: string;
  submodule?: string | null;
}

export interface NavSection {
  label: string;
  items: (NavItem | { type: string })[]; 
}

export const NAV_DATA: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      {
        type: "gap",
      } as any,
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        url: "/",
        items: [],
        module: "Dashboard",
        submodule: null,
      },
      {
        type: "divider",
      } as any,
      {
        title: "User Management",
        icon: Icons.User,
        url: "/management/users",
        items: [],
        module: "Manage Users",
        submodule: null,
      },
      {
        title: "Role Management",
        icon: Icons.Alphabet,
        url: "/management/roles",
        items: [],
        module: "Manage Roles",
        submodule: null,
      },
      {
        title: "Model Management",
        icon: Icons.Table,
        url: "/management/models",
        items: [],
        module: "Manage Models",
        submodule: null,
      },
      {
        title: "Device Management",
        icon: Icons.FourCircle,
        url: "/management/devices",
        items: [],
        module: "Manage Devices",
        submodule: null,
      },
      {
        title: "Task Management",
        icon: Icons.PieChart,
        items: [
          {
            title: "Installation Management",
            url: "/management/installation",
            icon: Icons.Calendar,
            items: [],
            module: "Manage Installation",
            submodule: null,
          },
          {
            title: "Service Management",
            url: "/management/service",
            icon: Icons.Alphabet,
            items: [],
            module: "Manage Service",
            submodule: null,
          },
        ],
        module: "Task Management",
        submodule: null,
      },
      {
        type: "divider",
      } as any,
      {
        title: "Settings",
        url: "/pages/settings",
        icon: Icons.Authentication,
        items: [],
        module: "Settings",
        submodule: null,
      },
    ],
  },
];

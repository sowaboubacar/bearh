// Define types for navigation items
export interface NavigationItem {
    title: string;
    url: string;
    icon: React.ComponentType;
    taskbarChildren?: NavigationItem[];
    condition?: PermissionCondition;
    hideInSidebar?: boolean;
  }
  
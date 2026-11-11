import {
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { title: string; href: string; icon: LucideIcon; badge?: "orders" | "lowStock" | "openPOs" };
export type NavGroup = { label: string; items: NavItem[] };

export const adminNav: NavGroup[] = [
  { label: "Overview", items: [{ title: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
  {
    label: "Commerce",
    items: [
      { title: "Orders", href: "/admin/orders", icon: ShoppingCart, badge: "orders" },
      { title: "Products", href: "/admin/products", icon: Package },
      { title: "Categories", href: "/admin/categories", icon: FolderTree },
      { title: "Customers", href: "/admin/customers", icon: Users },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Stock levels", href: "/admin/inventory", icon: Boxes, badge: "lowStock" },
      { title: "Movements", href: "/admin/inventory/movements", icon: ArrowLeftRight },
      { title: "Purchase orders", href: "/admin/purchase-orders", icon: ClipboardList, badge: "openPOs" },
      { title: "Suppliers", href: "/admin/suppliers", icon: Truck },
    ],
  },
  { label: "System", items: [{ title: "Settings", href: "/admin/settings", icon: Settings }] },
];

export const allNavItems = adminNav.flatMap((g) => g.items);

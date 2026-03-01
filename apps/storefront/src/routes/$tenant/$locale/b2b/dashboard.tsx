import { createFileRoute, Link } from "@tanstack/react-router";
import { B2BDashboard } from "@/components/b2b/b2b-dashboard";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useTenantPrefix } from "@/lib/context/tenant-context";
import { ShoppingBag, DocumentText, Users, PencilSquare, BuildingStorefront } from "@medusajs/icons";

export const Route = createFileRoute("/$tenant/$locale/b2b/dashboard")({
  component: B2BDashboardPage,
  head: () => ({
    meta: [
      { title: "B2B Dashboard | Dakkah CityOS" },
      { name: "description", content: "Manage your B2B account on Dakkah CityOS" },
    ],
  }),
});

const navItems = [
  {
    label: "Business Orders",
    description: "View and manage company orders",
    path: "/business/orders",
    icon: ShoppingBag,
  },
  {
    label: "Business Catalog",
    description: "Browse wholesale catalog and pricing",
    path: "/business/catalog",
    icon: DocumentText,
  },
  {
    label: "Business Approvals",
    description: "Review and approve pending requests",
    path: "/business/approvals",
    icon: PencilSquare,
  },
  {
    label: "Business Team",
    description: "Manage team members and permissions",
    path: "/business/team",
    icon: Users,
  },
  {
    label: "B2B Registration",
    description: "Register your business account",
    path: "/b2b/register",
    icon: BuildingStorefront,
  },
];

function B2BDashboardPage() {
  const prefix = useTenantPrefix();

  return (
    <AuthGuard requireB2B>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-ds-foreground mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={`${prefix}${item.path}` as never}
                  className="group flex items-start gap-4 rounded-xl border border-ds-border bg-ds-background p-5 transition-colors hover:border-ds-foreground/20 hover:bg-ds-card"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ds-muted text-ds-muted-foreground transition-colors group-hover:bg-ds-primary/10 group-hover:text-ds-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-ds-foreground">{item.label}</span>
                    <span className="block text-xs text-ds-muted-foreground mt-0.5">{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <B2BDashboard />
      </div>
    </AuthGuard>
  );
}

import { Head } from '@inertiajs/react';
import { useRole } from '@/components/role-guard';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];

/**
 * Dashboard for regular users (non-admin)
 * Currently shows a placeholder until features are implemented
 */
export default function UserDashboard() {
  const { user } = useRole();

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      
      <div className="flex min-h-screen items-center justify-center p-4 text-foreground">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">
            Welcome, {user?.name}!
          </h1>
          <p className="text-muted-foreground text-lg mb-2">
            Your dashboard is coming soon.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your administrator for access to additional features.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

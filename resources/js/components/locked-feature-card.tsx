import { Lock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { router } from '@inertiajs/react';

interface LockedFeatureCardProps {
  /**
   * Name of the locked feature
   */
  feature: string;
  /**
   * The permission required to unlock this feature
   */
  requiredPermission: string;
  /**
   * Optional description of the feature
   */
  description?: string;
  /**
   * Optional custom action button text
   * @default "Request Access"
   */
  actionText?: string;
  /**
   * Optional callback when action button is clicked
   */
  onActionClick?: () => void;
  /**
   * Variant of the locked card
   * @default "default"
   */
  variant?: 'default' | 'compact' | 'minimal';
}

/**
 * Component that displays a locked feature with upgrade/request access options
 *
 * @example
 * <LockedFeatureCard 
 *   feature="User Management"
 *   requiredPermission="invite_users"
 *   description="Invite and manage team members"
 * />
 */
export function LockedFeatureCard({
  feature,
  requiredPermission,
  description,
  actionText = 'Request Access',
  onActionClick,
  variant = 'default',
}: LockedFeatureCardProps) {
  const handleAction = () => {
    if (onActionClick) {
      onActionClick();
    } else {
      // Default: Navigate to settings or contact admin
      router.visit('/admin/settings/permissions');
    }
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2">
        <Lock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{feature}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {feature}
              </h3>
              <p className="text-xs text-muted-foreground">
                Requires permission
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/10 hover:bg-muted/20 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted shrink-0">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {feature}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {description || `Requires '${requiredPermission}' permission to access this feature.`}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldAlert className="h-3 w-3" />
                  <span>Permission: <code className="bg-muted px-1.5 py-0.5 rounded">{requiredPermission}</code></span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAction}
                className="shrink-0"
              >
                {actionText}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state component for when a user lacks permissions for an entire page/section
 */
export function PermissionDeniedEmptyState({
  feature,
  requiredPermission,
  description,
}: {
  feature: string;
  requiredPermission: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {feature} Unavailable
      </h2>
      <p className="text-center text-muted-foreground max-w-md mb-6">
        {description || 
          `You don't have permission to access this feature. Contact your administrator to request the '${requiredPermission}' permission.`
        }
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.visit('/dashboard')}
        >
          Go to Dashboard
        </Button>
        <Button
          onClick={() => router.visit('/admin/settings/permissions')}
        >
          Request Access
        </Button>
      </div>
    </div>
  );
}

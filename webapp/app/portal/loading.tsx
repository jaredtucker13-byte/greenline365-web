import { PageLoader } from '@/components/ui/os';

export default function PortalLoading() {
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <PageLoader message="Loading your dashboard" />
    </div>
  );
}

import { PageLoader } from '@/components/ui/os';

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <PageLoader message="Loading command center" />
    </div>
  );
}

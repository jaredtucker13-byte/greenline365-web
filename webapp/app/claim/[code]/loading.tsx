import { PageLoader } from '@/components/ui/os';

export default function ClaimLoading() {
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <PageLoader message="Verifying claim code" />
    </div>
  );
}

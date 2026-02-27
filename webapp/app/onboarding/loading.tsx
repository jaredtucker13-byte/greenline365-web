import { PageLoader } from '@/components/ui/os';

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <PageLoader message="Preparing your setup" />
    </div>
  );
}

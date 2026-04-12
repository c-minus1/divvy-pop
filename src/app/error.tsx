"use client";

import PageContainer from "@/components/layout/PageContainer";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center flex-1 gap-6">
        <Logo size="sm" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-divvy-dark mb-2">
            Something went wrong
          </h2>
          <p className="text-divvy-dark/60">
            Don&apos;t worry, these things happen. Try again?
          </p>
        </div>
        <Button onClick={reset} fullWidth={false}>
          Try Again
        </Button>
      </div>
    </PageContainer>
  );
}

import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import Logo from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center flex-1 gap-6">
        <Logo size="sm" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-divvy-dark mb-2">
            Page not found
          </h2>
          <p className="text-divvy-dark/60">
            This page doesn&apos;t exist or may have expired.
          </p>
        </div>
        <Link
          href="/"
          className="touch-target px-8 py-3 rounded-2xl bg-gradient-to-r from-divvy-green via-divvy-teal to-divvy-cyan text-white font-semibold shadow-lg transition-all active:scale-95"
        >
          Go Home
        </Link>
      </div>
    </PageContainer>
  );
}

import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-divvy-gradient">
      <LoadingSpinner size="lg" className="text-divvy-teal" />
    </div>
  );
}

import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`flex flex-col flex-1 min-h-screen bg-divvy-gradient text-divvy-ink ${className}`}>
      <div className="flex flex-col flex-1 w-full max-w-lg mx-auto px-4 py-6 safe-area-inset">
        {children}
      </div>
    </div>
  );
}

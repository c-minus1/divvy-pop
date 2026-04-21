interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-4xl sm:text-5xl",
};

export default function Logo({ size = "md", showTagline = false }: LogoProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <h1
        className={`font-pixel ${sizeClasses[size]} text-divvy-gradient leading-relaxed`}
      >
        divvy
      </h1>
      {showTagline && (
        <p className="font-pixel text-[10px] sm:text-xs text-divvy-ink">
          the smarter way to split
        </p>
      )}
    </div>
  );
}

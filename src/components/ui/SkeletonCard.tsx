const pulseClass = "animate-pulse motion-reduce:animate-none";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  showImage?: boolean;
}

export function SkeletonCard({
  className = "",
  lines = 3,
  showImage = false,
}: SkeletonCardProps) {
  return (
    <div
      className={`bg-white rounded-3xl border border-neutral-100 p-6 ${pulseClass} ${className}`}
    >
      {showImage && (
        <div className="w-full h-40 bg-neutral-100 rounded-2xl mb-5" />
      )}
      <div className="space-y-3">
        <div className="h-4 bg-neutral-100 rounded-full w-3/4" />
        {lines > 1 && <div className="h-3 bg-neutral-100 rounded-full w-full" />}
        {lines > 2 && <div className="h-3 bg-neutral-100 rounded-full w-5/6" />}
        {lines > 3 && <div className="h-3 bg-neutral-100 rounded-full w-2/3" />}
      </div>
      <div className="mt-5 h-10 bg-neutral-100 rounded-xl w-full" />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className={`rounded-2xl border border-neutral-100 overflow-hidden bg-white ${pulseClass}`}>
      <div className="bg-neutral-50 border-b border-neutral-100 flex gap-4 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 bg-neutral-200 rounded-full flex-1" />
        ))}
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-3 bg-neutral-100 rounded-full flex-1"
                style={{ width: `${60 + Math.random() * 40}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading and error states. Global Rules: never leave a blank screen.
import { AlertCircle, RefreshCw } from "lucide-react";

/** Grey block that occupies the same space the real content will. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate/10 dark:bg-white/5 ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="surface rounded-xl2 p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-20" />
      <Skeleton className="mt-3 h-3 w-28" />
    </div>
  );
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return <Skeleton className={`${height} w-full`} />;
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({
  title = "Could not load this",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl2 border hairline p-8 text-center">
      <AlertCircle className="text-slate" size={26} />
      <div>
        <p className="display text-midnight dark:text-fog">{title}</p>
        {message && <p className="mt-1 text-sm text-muted2">{message}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-2 rounded-full border hairline px-4 py-2 text-sm text-midnight transition hover:bg-slate/10 dark:text-fog"
        >
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-muted2">{message}</p>;
}

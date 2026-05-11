export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary border-t-transparent ${className ?? ""}`}>
      <div className="h-full w-full animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
}

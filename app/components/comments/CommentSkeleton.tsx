export function CommentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-5 rounded-xl border border-white/10 bg-white/[0.02] animate-pulse flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-28 bg-white/10 rounded" />
                <div className="h-4 w-12 bg-white/5 rounded-full" />
              </div>
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
          </div>
          <div className="space-y-2 mt-1">
            <div className="h-4 w-full bg-white/5 rounded" />
            <div className="h-4 w-4/5 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

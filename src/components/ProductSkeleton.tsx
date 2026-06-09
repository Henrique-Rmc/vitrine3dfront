export default function ProductSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden animate-pulse">
      <div className="aspect-square bg-zinc-800" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/2" />
        <div className="h-10 bg-zinc-800 rounded-lg mt-2" />
      </div>
    </div>
  )
}

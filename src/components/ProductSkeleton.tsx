export default function ProductSkeleton() {
  return (
    <div className="bg-white border border-[#e8e2d8] rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="aspect-square skeleton" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 w-14 skeleton rounded-full" />
        <div className="h-4 w-3/4 skeleton rounded-md" />
        <div className="h-4 w-1/3 skeleton rounded-md" />
        <div className="h-9 skeleton rounded-lg mt-1" />
      </div>
    </div>
  )
}

export function QuoteCard({ text, author }: { text: string; author?: string }) {
  return (
    <div className="flex gap-3 px-1 py-2">
      {/* 2px 竖线 */}
      <div className="w-0.5 shrink-0 rounded-full self-stretch"
           style={{ background: "#00E5FF", boxShadow: "0 0 8px rgba(0,229,255,0.5)" }} />
      <div>
        <p className="text-[14px] italic leading-relaxed text-[#A1A8B3]">
          {text}
        </p>
        {author && (
          <p className="mt-1 label-micro">{author}</p>
        )}
      </div>
    </div>
  );
}

import marieAvatar from "@/assets/marie-avatar.png";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] gap-2">
        <div className="mt-1 h-8 w-8 flex-none overflow-hidden rounded-full border border-slate-200">
          <img src={marieAvatar} alt="Donna" className="h-full w-full object-cover" />
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 italic">Donna is typing</span>
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-300"></span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-300 [animation-delay:0.3s]"></span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-300 [animation-delay:0.6s]"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

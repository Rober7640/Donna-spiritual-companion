import marieAvatar from "@/assets/marie-avatar.png";

interface StreamingMessageProps {
  text: string;
}

export default function StreamingMessage({ text }: StreamingMessageProps) {
  if (!text) return null;

  return (
    <div className="flex justify-start">
      <div className="flex max-w-[85%] gap-2">
        <div className="mt-1 h-8 w-8 flex-none overflow-hidden rounded-full border border-slate-200">
          <img src={marieAvatar} alt="Donna" className="h-full w-full object-cover" />
        </div>
        <div>
          <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-3 text-[16px] leading-relaxed shadow-sm text-slate-800 whitespace-pre-wrap">
            {text}
            <span className="inline-block w-0.5 h-4 bg-slate-400 ml-0.5 animate-pulse align-text-bottom" />
          </div>
        </div>
      </div>
    </div>
  );
}

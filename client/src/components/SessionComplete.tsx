import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import marieAvatar from "@/assets/marie-avatar.png";

interface SessionCompleteProps {
  duration: number;
  onContinue: () => void;
  onHome: () => void;
}

export default function SessionComplete({ duration, onContinue, onHome }: SessionCompleteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="mt-8 overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-lg"
    >
      <div
        className="p-8 text-center"
        style={{ background: "linear-gradient(180deg, #faf8f5 0%, #ffffff 100%)" }}
      >
        {/* Donna's avatar */}
        <div className="mx-auto mb-5 h-14 w-14 overflow-hidden rounded-full ring-2 ring-white shadow-md">
          <img src={marieAvatar} alt="Donna" className="h-full w-full object-cover" />
        </div>

        <h3 className="font-serif text-xl font-semibold leading-snug text-stone-800">
          Donna prayed with you
          <br />
          for {duration} minutes today.
        </h3>
        <p className="mt-3 text-[14px] text-stone-400">
          Your prayer intention has been saved.
        </p>

        {/* Ornamental flourish */}
        <div className="mx-auto mt-5 mb-1 flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-stone-200" />
          <svg width="10" height="10" viewBox="0 0 12 12" className="text-stone-300">
            <path
              d="M6 0 L7.5 4.5 L12 6 L7.5 7.5 L6 12 L4.5 7.5 L0 6 L4.5 4.5 Z"
              fill="currentColor"
              opacity="0.5"
            />
          </svg>
          <div className="h-px w-8 bg-stone-200" />
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 space-y-2.5">
        <Button
          onClick={onContinue}
          className="w-full h-12 rounded-full bg-[#2D6AAF] text-[15px] font-medium text-white shadow-md transition-all hover:bg-[#24578d] hover:shadow-lg"
        >
          Talk again
        </Button>

        <button
          onClick={onHome}
          className="block w-full text-center py-2 text-[13px] text-stone-400 transition-colors hover:text-stone-500"
        >
          Go home
        </button>
      </div>
    </motion.div>
  );
}

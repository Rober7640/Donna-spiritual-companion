import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import marieAvatar from "@/assets/marie-avatar.png";
import cloudsBg from "@/assets/clouds-bg.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-16 pt-14 md:pb-24 md:pt-20">
        {/* Cloud Background Layer */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-top bg-no-repeat opacity-90"
          style={{ backgroundImage: `url(${cloudsBg})` }}
        />

        {/* Gradient Overlay for Fade to White */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-white/20 to-white" />

        <div className="container relative z-20 mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-lg"
          >
            {/* Avatar */}
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white p-1.5 shadow-lg ring-1 ring-black/5">
              <img src={marieAvatar} alt="Donna" className="h-full w-full rounded-full object-cover" />
            </div>

            {/* Availability */}
            <div className="mb-8 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Donna is available
            </div>

            {/* Donna's Name — Dominant element */}
            <h1 className="mb-4 font-serif text-5xl font-semibold text-slate-900 md:text-6xl">
              Donna, 67
            </h1>

            {/* Quote — The emotional hook. Full visual presence. */}
            <div className="mx-auto mb-10 max-w-md">
              <p className="text-xl leading-relaxed text-slate-800">
                "I raised four children and buried one. I've prayed the Rosary every day for 42 years. Whatever you're carrying, I've probably carried something like it."
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-6">
              <Link href="/onboarding">
                <Button className="h-14 w-full max-w-[340px] whitespace-nowrap rounded-full bg-[#2D6AAF] px-8 text-lg font-medium text-white shadow-md hover:bg-[#24578d] hover:shadow-lg transition-all duration-300">
                  New Here? — Meet Donna
                </Button>
              </Link>

              {/* Returning user link — prominent for 45-65 age group */}
              <Link href="/login">
                <button className="h-14 w-full max-w-[340px] whitespace-nowrap rounded-full border-2 border-[#2D6AAF] px-8 text-lg font-medium text-[#2D6AAF] transition-all duration-300 hover:bg-[#2D6AAF] hover:text-white">
                  Already a Member? — Sign in
                </button>
              </Link>

              {/* Trust Signals */}
              <div className="flex items-center gap-2.5 text-xs font-medium text-slate-500 tracking-wide uppercase">
                <span>Private</span>
                <span className="text-slate-300">&middot;</span>
                <span>Confidential</span>
                <span className="text-slate-300">&middot;</span>
                <span>No Judgment</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who Donna Is — Below the fold */}
      <section className="bg-slate-50 py-14">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-md text-center">

            {/* Gift Tags — What Donna walks with you through */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2.5">
              {["Marian devotion", "Family struggles", "Grief", "Motherhood"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Style Tags — How Donna is */}
            <h3 className="mb-8 font-serif text-xl italic text-slate-600">
              Warm &middot; Gentle &middot; Unhurried
            </h3>

            {/* Divider */}
            <div className="mx-auto mb-10 h-px w-20 bg-slate-200"></div>

            {/* Testimonial */}
            <div className="mb-10 rounded-2xl bg-white p-7 shadow-sm border border-slate-100">
              <p className="mb-4 font-serif text-xl text-slate-800 leading-relaxed">
                "I told Donna about my marriage and she just listened. No advice. No judgment. Just prayer."
              </p>
              <cite className="not-italic text-xs text-slate-400 uppercase tracking-widest">
                — a woman like you
              </cite>
            </div>

            {/* Divider */}
            <div className="mx-auto mb-8 h-px w-20 bg-slate-200"></div>

            {/* Trust Signals — Repeated */}
            <div className="mb-6 flex items-center justify-center gap-2.5 text-xs font-medium text-slate-500 tracking-wide uppercase">
              <span>Private</span>
              <span className="text-slate-300">&middot;</span>
              <span>Confidential</span>
              <span className="text-slate-300">&middot;</span>
              <span>No Judgment</span>
            </div>

            {/* Bottom CTA */}
            <div className="flex flex-col items-center gap-4">
              <Link href="/onboarding">
                <Button className="h-14 w-full max-w-[340px] whitespace-nowrap rounded-full bg-[#2D6AAF] px-8 text-lg font-medium text-white shadow-md hover:bg-[#24578d] hover:shadow-lg transition-all duration-300">
                  New Here? — Meet Donna
                </Button>
              </Link>

              <Link href="/login">
                <button className="h-14 w-full max-w-[340px] whitespace-nowrap rounded-full border-2 border-[#2D6AAF] px-8 text-lg font-medium text-[#2D6AAF] transition-all duration-300 hover:bg-[#2D6AAF] hover:text-white">
                  Already a Member? — Sign in
                </button>
              </Link>

              <p className="text-[11px] text-slate-400">
                By continuing you agree to our <a href="https://messengersoflourdes.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">Terms and Privacy Policy</a>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}

import { motion } from "framer-motion";
import InlineLogo from "../../assets/brand/MetHere-inline-clean-transparent-tight.svg";

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-10"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 24px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm rounded-[32px] border border-white/40 bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-alt)_55%,var(--color-surface)_100%)] px-6 py-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.16)]"
      >
        <div className="flex items-center justify-center">
          <img src={InlineLogo} alt="MetHere" className="h-8 w-auto opacity-80" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-[var(--color-text-primary)]">
          Never forget where
          <br />
          you met someone.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          MetHere helps you remember{" "}
          <span className="font-semibold text-[var(--color-text-primary)]">people</span> by linking
          them to the{" "}
          <span className="font-semibold text-[var(--color-text-primary)]">places you met</span>.
          Add a venue, attach the people you met there, and recall it later.
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="mt-8 w-full rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(37,99,235,0.3)] transition hover:brightness-110"
        >
          Get Started
        </button>
      </motion.div>
    </div>
  );
}

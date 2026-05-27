import { lazy, Suspense } from "react";
import { motion } from "motion/react";

const ClickHere = lazy(() => import("undraw-react/dist/esm/illustrations/ClickHere.js"));
const Winners = lazy(() => import("undraw-react/dist/esm/illustrations/Winners.js"));

interface IllustrationProps {
  className?: string;
}

function IllustrationFallback({ className }: IllustrationProps) {
  return <div className={`illustration-fallback${className ? ` ${className}` : ""}`} aria-hidden="true" />;
}

export function IdleIllustration({ className }: IllustrationProps) {
  return (
    <Suspense fallback={<IllustrationFallback className={className} />}>
      <motion.div
        className={`illustration-wrap${className ? ` ${className}` : ""}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <ClickHere color="#111111" size={96} />
      </motion.div>
    </Suspense>
  );
}

export function ClearIllustration({ className }: IllustrationProps) {
  return (
    <Suspense fallback={<IllustrationFallback className={className} />}>
      <motion.div
        className={`illustration-wrap${className ? ` ${className}` : ""}`}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Winners color="#111111" size={140} />
      </motion.div>
    </Suspense>
  );
}

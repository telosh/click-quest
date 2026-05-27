import { motion } from "motion/react";

interface StageFlashProps {
  stage: number | null;
  onDone: () => void;
}

export function StageFlash({ stage, onDone }: StageFlashProps) {
  if (stage === null) return null;

  return (
    <motion.div
      className="stage-flash"
      aria-live="polite"
      role="status"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: [0, 0.2, 0], scale: [0.92, 1.04, 1.06] }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      onAnimationComplete={onDone}
    >
      Stage {stage}
    </motion.div>
  );
}

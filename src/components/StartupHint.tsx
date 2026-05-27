import { motion } from "motion/react";

interface StartupHintProps {
  visible: boolean;
}

export function StartupHint({ visible }: StartupHintProps) {
  return (
    <motion.p
      className="startup-hint"
      aria-live="polite"
      aria-hidden={!visible}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -4 }}
      transition={{ duration: 0.2 }}
    >
      Space または Click で開始
    </motion.p>
  );
}

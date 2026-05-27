import { memo } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { PopEvent } from "../game/types";

interface LuckyPopLayerProps {
  pops: PopEvent[];
  onRemove: (id: number) => void;
}

export const LuckyPopLayer = memo(function LuckyPopLayer({
  pops,
  onRemove,
}: LuckyPopLayerProps) {
  return (
    <div className="pop-layer" aria-hidden="true">
      <AnimatePresence>
        {pops.map((pop) => (
          <motion.span
            key={pop.id}
            className={`pop${pop.isLucky ? " lucky" : ""}`}
            style={{ left: pop.x, top: pop.y }}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -48, scale: 1.08 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            onAnimationComplete={() => onRemove(pop.id)}
          >
            {pop.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
});

import { motion } from "motion/react";
import { formatNumber } from "../game/format";
import { ClearIllustration } from "./illustrations/SceneIllustrations";

interface ClearScreenProps {
  totalClicks: number;
  personalBest: number;
  onRestart: () => void;
}

export function ClearScreen({ totalClicks, personalBest, onRestart }: ClearScreenProps) {
  return (
    <motion.div
      className="clear-screen"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <ClearIllustration className="clear-illustration" />
      <h1>クリア！</h1>
      <p>{formatNumber(totalClicks)} クリック達成</p>
      {personalBest > 0 && (
        <p className="clear-best">自己ベスト {formatNumber(personalBest)}</p>
      )}
      <motion.button
        type="button"
        className="btn primary"
        onClick={onRestart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        もう一度プレイ
      </motion.button>
      <p className="clear-hint">Space でも再開できます</p>
    </motion.div>
  );
}

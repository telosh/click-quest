import { AnimatePresence, motion } from "motion/react";
import type { RewardChoice } from "../game/types";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { GameIcon } from "./icons/GameIcon";

interface StageRewardModalProps {
  stage: number;
  choices: RewardChoice[];
  onSelect: (rewardId: string) => void;
}

export function StageRewardModal({ stage, choices, onSelect }: StageRewardModalProps) {
  const trapRef = useFocusTrap(choices.length > 0);

  return (
    <AnimatePresence>
      {choices.length > 0 && (
        <motion.div
          className="modal-backdrop"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            ref={trapRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <h2 id="reward-title">Stage {stage} 報酬を選択</h2>
            <p className="modal-desc">
              3つから1つ選んでください（完全ランダム抽選 · キー 1〜3 でも選択可）
            </p>
            <div className="reward-grid">
              {choices.map((choice, index) => (
                <motion.button
                  key={choice.id}
                  type="button"
                  className={`reward-card rank-${choice.rank.toLowerCase()}`}
                  onClick={() => onSelect(choice.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="reward-key">{index + 1}</span>
                  <span className={`reward-rank rank-${choice.rank.toLowerCase()}`}>
                    {choice.rank}
                  </span>
                  <GameIcon name={choice.iconKey} className="reward-icon-svg" />
                  <span className="reward-label">{choice.label}</span>
                  <span className="reward-variant">{choice.variantLabel}</span>
                  <span className="reward-desc">{choice.description}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

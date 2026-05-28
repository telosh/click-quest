import { AnimatePresence, motion } from "motion/react";
import { LuChevronDown, LuGift } from "react-icons/lu";
import type { RewardChoice } from "../game/types";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { GameIcon } from "./icons/GameIcon";

const PANEL_EASE = [0.33, 1, 0.68, 1] as const;

interface StageRewardSheetProps {
  stage: number;
  choices: RewardChoice[];
  open: boolean;
  onToggle: () => void;
  onSelect: (rewardId: string) => void;
}

export function StageRewardSheet({
  stage,
  choices,
  open,
  onToggle,
  onSelect,
}: StageRewardSheetProps) {
  const trapRef = useFocusTrap(open && choices.length > 0);

  if (choices.length === 0) return null;

  return (
    <div className={`reward-sheet-root${open ? " open" : ""}`} aria-live="polite">
      <motion.button
        type="button"
        className={`reward-tab${open ? " open" : ""}`}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="reward-sheet-title"
        layout={false}
        whileTap={{ scale: 0.98 }}
      >
        <LuGift className="reward-tab-icon" aria-hidden="true" />
        <span>ボーナス GET!</span>
        <LuChevronDown className={`reward-tab-chevron${open ? " open" : ""}`} aria-hidden="true" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            ref={trapRef}
            className="reward-sheet-panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby="reward-sheet-title"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: PANEL_EASE }}
          >
            <div className="reward-sheet-header">
              <h2 id="reward-sheet-title">Stage {stage} 報酬</h2>
              <button type="button" className="reward-sheet-close" onClick={onToggle}>
                閉じる
              </button>
            </div>
            <p className="reward-sheet-desc">
              <span className="hint-desktop">3つから1つ選んでください（キー 1〜3 でも選択可）</span>
              <span className="hint-mobile">3つから1つタップして選んでください</span>
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
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

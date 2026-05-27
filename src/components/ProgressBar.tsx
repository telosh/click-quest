import { motion } from "motion/react";
import { GOAL_CLICKS } from "../game/config";
import { getNextThreshold } from "../game/data/stages";
import { formatNumber } from "../game/format";
import { LuTarget } from "react-icons/lu";

interface ProgressBarProps {
  totalClicks: number;
  stageIndex: number;
  personalBest: number;
}

export function ProgressBar({ totalClicks, stageIndex, personalBest }: ProgressBarProps) {
  const goalProgress = Math.min(100, (totalClicks / GOAL_CLICKS) * 100);
  const nextThreshold = getNextThreshold(stageIndex);
  const remaining =
    nextThreshold === null ? 0 : Math.max(0, nextThreshold - totalClicks);

  return (
    <header className="progress-header">
      <h1 className="visually-hidden">Click Quest</h1>
      <div className="progress-meta">
        <p className="progress-label">累計クリック</p>
        <p className="progress-value">{formatNumber(totalClicks)}</p>
        <p className="progress-goal">/ {formatNumber(GOAL_CLICKS)}</p>
      </div>

      <p className="personal-best">
        {personalBest > 0 ? (
          <>自己ベスト {formatNumber(personalBest)}</>
        ) : (
          <span aria-hidden="true">&nbsp;</span>
        )}
      </p>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={GOAL_CLICKS}
        aria-valuenow={Math.floor(totalClicks)}
        aria-label="ゴールまでの進捗"
      >
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ width: `${goalProgress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <p className="stage-line">
        <LuTarget className="stage-icon" aria-hidden="true" />
        Stage {stageIndex + 1}
        {nextThreshold !== null && (
          <span className="next-milestone">
            次の報酬まで {formatNumber(remaining)}
          </span>
        )}
      </p>
    </header>
  );
}

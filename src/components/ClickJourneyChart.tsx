import { useMemo } from "react";
import {
  buildProgressPoints,
  estimateJourneyBytes,
  formatStageLabel,
  getInputClickCount,
  getJourneyRewards,
  getJourneyStages,
  type JourneyLog,
} from "../game/engine/journey";
import { formatNumber } from "../game/format";

interface ClickJourneyChartProps {
  log: JourneyLog;
}

const CHART_W = 280;
const CHART_H = 88;
const PAD = { top: 8, right: 8, bottom: 18, left: 36 };

function scaleLog(value: number, min: number, max: number): number {
  const lo = Math.log10(Math.max(min, 1));
  const hi = Math.log10(Math.max(max, min + 1));
  const v = Math.log10(Math.max(value, 1));
  if (hi <= lo) return 0.5;
  return (v - lo) / (hi - lo);
}

export function ClickJourneyChart({ log }: ClickJourneyChartProps) {
  const stages = useMemo(() => getJourneyStages(log.events), [log.events]);
  const rewards = useMemo(() => getJourneyRewards(log.events), [log.events]);
  const progressPoints = useMemo(() => buildProgressPoints(log), [log]);
  const inputClicks = useMemo(() => getInputClickCount(log), [log]);
  const storageKb = useMemo(
    () => (estimateJourneyBytes(log) / 1024).toFixed(1),
    [log],
  );

  const linePath = useMemo(() => {
    if (progressPoints.length < 2) return null;

    const t0 = progressPoints[0].t;
    const t1 = progressPoints[progressPoints.length - 1].t;
    const tSpan = Math.max(t1 - t0, 1);
    const maxClicks = Math.max(...progressPoints.map((p) => p.clicks), 10);
    const minClicks = Math.min(...progressPoints.map((p) => p.clicks), 0);

    const innerW = CHART_W - PAD.left - PAD.right;
    const innerH = CHART_H - PAD.top - PAD.bottom;

    const coords = progressPoints.map((p) => {
      const x = PAD.left + ((p.t - t0) / tSpan) * innerW;
      const y =
        PAD.top + innerH - scaleLog(p.clicks, minClicks, maxClicks) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return coords.join(" ");
  }, [progressPoints]);

  const stageNodes = useMemo(() => {
    if (stages.length === 0) return [];
    const innerW = CHART_W - 16;
    const step = stages.length > 1 ? innerW / (stages.length - 1) : 0;
    return stages.map((ev, i) => ({
      ev,
      x: 8 + (stages.length > 1 ? i * step : innerW / 2),
    }));
  }, [stages]);

  const isEmpty = log.clicks.length === 0 && log.events.length === 0;

  if (isEmpty) {
    return (
      <p className="journey-empty muted">
        まだ記録がありません。クリックを続けると遍歴がたまります。
      </p>
    );
  }

  return (
    <div className="journey-chart">
      <p className="journey-caption muted">累計クリックの推移（対数スケール）</p>
      <svg
        className="journey-line-svg"
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        role="img"
        aria-label="クリック数の時系列グラフ"
      >
        <rect
          x={PAD.left}
          y={PAD.top}
          width={CHART_W - PAD.left - PAD.right}
          height={CHART_H - PAD.top - PAD.bottom}
          className="journey-plot-bg"
          rx="4"
        />
        {linePath ? (
          <polyline
            className="journey-line"
            fill="none"
            points={linePath}
            vectorEffect="non-scaling-stroke"
          />
        ) : progressPoints.length === 1 ? (
          <circle
            className="journey-dot"
            cx={CHART_W / 2}
            cy={CHART_H / 2}
            r="4"
          />
        ) : null}
      </svg>

      {stageNodes.length > 0 && (
        <>
          <p className="journey-caption muted">ステージの道のり</p>
          <svg
            className="journey-stage-svg"
            viewBox={`0 0 ${CHART_W} 52`}
            role="img"
            aria-label="到達したステージの経路"
          >
            {stageNodes.length > 1 &&
              stageNodes.slice(1).map((node, i) => {
                const prev = stageNodes[i];
                return (
                  <line
                    key={`edge-${node.ev.stageIndex}`}
                    className="journey-edge"
                    x1={prev.x}
                    y1={22}
                    x2={node.x}
                    y2={22}
                  />
                );
              })}
            {stageNodes.map(({ ev, x }) => (
              <g key={ev.stageIndex} transform={`translate(${x}, 22)`}>
                <circle className="journey-stage-dot" r="6" />
                <text className="journey-stage-label" y={20} textAnchor="middle">
                  {formatStageLabel(ev.stageIndex)}
                </text>
              </g>
            ))}
          </svg>
        </>
      )}

      {rewards.length > 0 && (
        <>
          <p className="journey-caption muted">最近の報酬選択</p>
          <ul className="journey-reward-list">
            {rewards.map((ev, i) => (
              <li key={`${ev.t}-${i}`}>
                <span className={`journey-rank rank-${ev.rewardRank ?? "C"}`}>
                  {ev.rewardRank ?? "?"}
                </span>
                <span className="journey-reward-label">{ev.rewardLabel ?? "報酬"}</span>
                <span className="journey-reward-meta muted">
                  {formatNumber(ev.totalClicks)} 回
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="journey-foot muted">
        操作 {formatNumber(inputClicks)} 回・ティック {log.clicks.length} 件を記録（約{" "}
        {storageKb} KB、古い分は自動で間引き）
      </p>
    </div>
  );
}

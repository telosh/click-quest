import { useMemo } from "react";
import { motion } from "motion/react";
import { getItem, ITEM_CATEGORY_LABEL } from "../game/data/items";
import {
  getBasePower,
  getComboWindowMs,
  getEffectiveLuckyChance,
  getEffectivePower,
  getEffectivePowerCap,
  getPassiveCps,
  isBonusActive,
} from "../game/engine/click";
import { loadJourney } from "../game/engine/journey";
import { formatNumber, formatPercent } from "../game/format";
import type { GameState } from "../game/types";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { ClickJourneyChart } from "./ClickJourneyChart";
import { GameIcon, SignIcon } from "./icons/GameIcon";

interface StatsOverlayProps {
  open: boolean;
  state: GameState;
  journeyRevision: number;
  dimmed?: boolean;
  onToggle: () => void;
  onExport: () => void;
  onImport: (raw: string) => void;
  onReset: () => void;
}

export function StatsOverlay({
  open,
  state,
  journeyRevision,
  dimmed = false,
  onToggle,
  onExport,
  onImport,
  onReset,
}: StatsOverlayProps) {
  const journeyLog = useMemo(
    () => (open ? loadJourney() : { clicks: [], events: [], anchorT: 0, anchorClicks: 0, version: 2 }),
    [open, journeyRevision],
  );
  const power = getEffectivePower(state);
  const basePower = getBasePower(state);
  const powerCap = getEffectivePowerCap(state);
  const lucky = getEffectiveLuckyChance(state);
  const passiveCps = getPassiveCps(state);
  const comboWindowMs = getComboWindowMs(state.equippedItemIds);
  const trapRef = useFocusTrap(open);

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onImport(reader.result);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className={`stats-sign${dimmed ? " dimmed" : ""}${open ? " open" : ""}`}>
      <div className="sign-hanger" aria-hidden="true">
        <span className="sign-rope sign-rope-left" />
        <span className="sign-rope sign-rope-right" />
      </div>

      <motion.button
        type="button"
        className="sign-board"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="stats-panel"
        animate={{ rotate: open ? 0 : [-1.2, 1.2, -1.2] }}
        transition={
          open
            ? { duration: 0.2 }
            : { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <SignIcon className="sign-board-icon" />
        ステータス
      </motion.button>

      <aside
        id="stats-panel"
        ref={trapRef}
        className={`stats-panel${open ? " open" : ""}`}
        aria-hidden={!open}
      >
        <h2>ステータス</h2>
        <dl className="stats-list">
          <div>
            <dt>Power</dt>
            <dd>
              {formatNumber(power)}
              {powerCap !== null && (
                <span className="stats-sub">
                  {" "}
                  (ベース {formatNumber(basePower)} / 上限 {formatNumber(powerCap)})
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Lucky Chance</dt>
            <dd>{formatPercent(lucky)}</dd>
          </div>
          <div>
            <dt>自動クリック</dt>
            <dd>{passiveCps > 0 ? `${formatNumber(passiveCps)} /秒` : "—"}</dd>
          </div>
          <div>
            <dt>コンボ猶予</dt>
            <dd>{comboWindowMs}ms</dd>
          </div>
          <div>
            <dt>永続契約</dt>
            <dd>{state.permanentPact?.label ?? "—"}</dd>
          </div>
          <div>
            <dt>ボーナスタイム</dt>
            <dd>{isBonusActive(state) ? "発動中" : "—"}</dd>
          </div>
        </dl>

        <h3>装備アイテム</h3>
        {state.equippedItemIds.length === 0 ? (
          <p className="muted">なし</p>
        ) : (
          <ul className="item-list">
            {state.equippedItemIds.map((id) => {
              const item = getItem(id);
              return (
                <li key={id}>
                  <GameIcon name={id} className="item-icon-svg" />
                  <span className="item-list-body">
                    <span className="item-list-name">{item?.name ?? id}</span>
                    {item && (
                      <span className="item-list-category">
                        {ITEM_CATEGORY_LABEL[item.category]}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <h3>クリック遍歴</h3>
        <ClickJourneyChart log={journeyLog} />

        <div className="stats-actions">
          <button type="button" className="btn ghost" onClick={onExport}>
            セーブをコピー
          </button>
          <label className="btn ghost file-label">
            JSON から復元
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              aria-label="JSON セーブファイルを選択"
              hidden
            />
          </label>
          <button type="button" className="btn danger" onClick={onReset}>
            最初から
          </button>
        </div>
      </aside>
    </div>
  );
}

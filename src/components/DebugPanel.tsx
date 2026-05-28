import { useCallback, useState } from "react";
import { MAX_LUCKY_CHANCE } from "../game/config";
import { PACT_BY_RANK } from "../game/data/rewardRanks";
import type { PermanentPact, RewardRank } from "../game/types";
import { createEmptyPermanentPact } from "../game/engine/pact";
import { useGameStore } from "../game/store";

const PACT_RANKS: RewardRank[] = ["C", "B", "A", "S"];

function pactDraftFromStore(pact: PermanentPact | null): PermanentPact {
  return pact ?? createEmptyPermanentPact();
}

export function DebugPanel() {
  const state = useGameStore((s) => s.state);
  const debugPatchState = useGameStore((s) => s.debugPatchState);
  const debugSetPermanentPact = useGameStore((s) => s.debugSetPermanentPact);
  const discardPermanentPact = useGameStore((s) => s.discardPermanentPact);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => pactDraftFromStore(state.permanentPact));
  const [clicksInput, setClicksInput] = useState(String(state.totalClicks));
  const [powerInput, setPowerInput] = useState(String(state.power));
  const [luckyInput, setLuckyInput] = useState(String(state.luckyChance));

  const syncFromStore = useCallback(() => {
    const s = useGameStore.getState().state;
    setDraft(pactDraftFromStore(s.permanentPact));
    setClicksInput(String(s.totalClicks));
    setPowerInput(String(s.power));
    setLuckyInput(String(s.luckyChance));
  }, []);

  const applyCore = () => {
    debugPatchState({
      totalClicks: Number(clicksInput) || 0,
      power: Math.max(1, Number(powerInput) || 1),
      luckyChance: Math.min(MAX_LUCKY_CHANCE, Math.max(0, Number(luckyInput) || 0)),
    });
    syncFromStore();
  };

  const applyPactOverwrite = () => {
    const powerCapRaw = draft.powerCap;
    debugSetPermanentPact({
      label: draft.label || "デバッグ契約",
      powerCap:
        powerCapRaw === null || Number.isNaN(Number(powerCapRaw))
          ? null
          : Number(powerCapRaw),
      luckyBonus: Math.min(MAX_LUCKY_CHANCE, Math.max(0, draft.luckyBonus)),
      powerDelta: draft.powerDelta,
    });
    syncFromStore();
  };

  const applyPreset = (rank: RewardRank) => {
    const spec = PACT_BY_RANK[rank];
    setDraft({
      label: spec.variant,
      powerCap: spec.powerCap ?? null,
      luckyBonus: spec.lucky,
      powerDelta: spec.powerDelta ?? 0,
    });
  };

  return (
    <div className={`debug-root${open ? " open" : ""}`}>
      <button
        type="button"
        className="debug-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="debug-panel"
      >
        {open ? "×" : "dbg"}
      </button>

      {open && (
        <aside id="debug-panel" className="debug-panel" aria-label="デバッグ">
          <p className="debug-status muted">
            {state.permanentPact ? state.permanentPact.label : "契約なし"}
          </p>

          <details className="debug-block" open>
            <summary>コア</summary>
            <div className="debug-block-body">
              <label className="debug-row">
                <span>累計</span>
                <input
                  type="number"
                  value={clicksInput}
                  onChange={(e) => setClicksInput(e.target.value)}
                />
              </label>
              <label className="debug-row">
                <span>Power</span>
                <input
                  type="number"
                  value={powerInput}
                  onChange={(e) => setPowerInput(e.target.value)}
                />
              </label>
              <label className="debug-row">
                <span>Lucky</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={MAX_LUCKY_CHANCE}
                  value={luckyInput}
                  onChange={(e) => setLuckyInput(e.target.value)}
                />
              </label>
              <button type="button" className="btn ghost debug-apply" onClick={applyCore}>
                適用
              </button>
            </div>
          </details>

          <details className="debug-block">
            <summary>契約</summary>
            <div className="debug-block-body">
              <div className="debug-presets">
                {PACT_RANKS.map((rank) => (
                  <button
                    key={rank}
                    type="button"
                    className="debug-preset"
                    onClick={() => applyPreset(rank)}
                  >
                    {rank}
                  </button>
                ))}
              </div>
              <label className="debug-row">
                <span>上限</span>
                <input
                  type="number"
                  min={1}
                  placeholder="—"
                  value={draft.powerCap ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      powerCap: v === "" ? null : Number(v),
                    }));
                  }}
                />
              </label>
              <label className="debug-row">
                <span>Lucky+</span>
                <input
                  type="number"
                  step="0.01"
                  value={draft.luckyBonus}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, luckyBonus: Number(e.target.value) || 0 }))
                  }
                />
              </label>
              <label className="debug-row">
                <span>ΔPow</span>
                <input
                  type="number"
                  value={draft.powerDelta}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, powerDelta: Number(e.target.value) || 0 }))
                  }
                />
              </label>
              <div className="debug-row-actions">
                <button type="button" className="btn ghost debug-apply" onClick={applyPactOverwrite}>
                  上書き
                </button>
                <button
                  type="button"
                  className="btn ghost debug-apply"
                  onClick={() => {
                    discardPermanentPact();
                    syncFromStore();
                  }}
                  disabled={!state.permanentPact}
                >
                  破棄
                </button>
              </div>
            </div>
          </details>
        </aside>
      )}
    </div>
  );
}

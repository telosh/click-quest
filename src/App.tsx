import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BonusTimeBanner } from "./components/BonusTimeBanner";
import { ClearScreen } from "./components/ClearScreen";
import { ClickButton, useClickButtonCenter } from "./components/ClickButton";
import { IdleIllustration } from "./components/illustrations/SceneIllustrations";
import { LuckyPopLayer } from "./components/LuckyPopLayer";
import { ProgressBar } from "./components/ProgressBar";
import { StageFlash } from "./components/StageFlash";
import { StageRewardModal } from "./components/StageRewardModal";
import { StartupHint } from "./components/StartupHint";
import { StatsOverlay } from "./components/StatsOverlay";
import { isCleared } from "./game/engine/click";
import { getCurrentRewardStage, getRewardChoices, useGameStore } from "./game/store";
import { useGameLoop } from "./hooks/useGameLoop";
import { useGlobalClick } from "./hooks/useGlobalClick";
import { useIdleUi } from "./hooks/useIdleUi";
import { useThrottledValue } from "./hooks/useThrottledDisplay";

export default function App() {
  const [statsOpen, setStatsOpen] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const state = useGameStore((s) => s.state);
  const toast = useGameStore((s) => s.toast);
  const pops = useGameStore((s) => s.pops);
  const personalBest = useGameStore((s) => s.personalBest);
  const stageFlash = useGameStore((s) => s.stageFlash);
  const lastActivityAt = useGameStore((s) => s.lastActivityAt);
  const hydrate = useGameStore((s) => s.hydrate);
  const selectReward = useGameStore((s) => s.selectReward);
  const reset = useGameStore((s) => s.reset);
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);
  const clearToast = useGameStore((s) => s.clearToast);
  const clearStageFlash = useGameStore((s) => s.clearStageFlash);
  const removePop = useGameStore((s) => s.removePop);
  const touchActivity = useGameStore((s) => s.touchActivity);

  const displayClicks = useThrottledValue(state.totalClicks);
  const rewardStage = getCurrentRewardStage(state);
  const rewardChoices = getRewardChoices(state);
  const isUiIdle = useIdleUi(lastActivityAt);
  const triggerCenterClick = useClickButtonCenter();

  const cleared = isCleared(state);
  const blocked = rewardChoices.length > 0;
  const showStartupHint = !sessionStarted && !cleared && state.totalClicks === 0;

  useGameLoop();

  useEffect(() => {
    hydrate();
    if (useGameStore.getState().state.totalClicks > 0) {
      setSessionStarted(true);
    }
  }, [hydrate]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, 3000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  useEffect(() => {
    if (rewardChoices.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (index < 0 || index >= rewardChoices.length) return;
      selectReward(rewardChoices[index].id);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rewardChoices, selectReward]);

  const handleStart = useCallback(() => {
    setSessionStarted(true);
    touchActivity();
    triggerCenterClick();
  }, [touchActivity, triggerCenterClick]);

  const handleActivate = useCallback(() => {
    setSessionStarted(true);
    touchActivity();
  }, [touchActivity]);

  const handleRestart = useCallback(() => {
    reset();
    setSessionStarted(false);
    setStatsOpen(false);
  }, [reset]);

  useGlobalClick({
    enabled: true,
    mode: cleared ? "cleared" : blocked ? "blocked" : showStartupHint ? "idle" : "playing",
    onClick: () => {
      touchActivity();
      triggerCenterClick();
    },
    onStart: handleStart,
    onRestart: handleRestart,
  });

  const handleExport = useCallback(async () => {
    const json = exportSave();
    try {
      await navigator.clipboard.writeText(json);
      useGameStore.setState({ toast: "セーブデータをクリップボードにコピーしました" });
    } catch {
      useGameStore.setState({
        toast: "コピーに失敗しました。ブラウザの権限を確認してください",
      });
    }
  }, [exportSave]);

  const handleReset = useCallback(() => {
    if (!confirm("本当に最初からやり直しますか？")) return;
    reset();
    setSessionStarted(false);
  }, [reset]);

  if (cleared) {
    return (
      <>
        <a className="skip-link" href="#main-content">
          メインコンテンツへ
        </a>
        <main id="main-content" ref={mainRef} className="app cleared" tabIndex={-1}>
          <ClearScreen
            totalClicks={state.totalClicks}
            personalBest={personalBest}
            onRestart={handleRestart}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        メインコンテンツへ
      </a>

      <main
        id="main-content"
        ref={mainRef}
        className={`app${!isUiIdle ? " clicking" : ""}`}
        tabIndex={-1}
      >
        <header className="game-hud">
          <div className="hud-main">
            <ProgressBar
              totalClicks={displayClicks}
              stageIndex={state.stageIndex}
              personalBest={personalBest}
            />
            <div className="bonus-banner-slot">
              <BonusTimeBanner
                remainingMs={state.bonusTimeRemainingMs}
                multiplier={state.bonusTimeMultiplier}
              />
            </div>
          </div>
        </header>

        <StatsOverlay
          open={statsOpen}
          state={state}
          dimmed={!isUiIdle}
          onToggle={() => setStatsOpen((v) => !v)}
          onExport={handleExport}
          onImport={importSave}
          onReset={handleReset}
        />

        <div className="click-stage" aria-label="クリックエリア">
          {showStartupHint && <IdleIllustration className="idle-illustration" />}
          <StartupHint visible={showStartupHint} />
          <ClickButton onActivate={handleActivate} />
        </div>

        {rewardStage !== null && (
          <StageRewardModal
            stage={rewardStage}
            choices={rewardChoices}
            onSelect={selectReward}
          />
        )}

        <StageFlash stage={stageFlash} onDone={clearStageFlash} />
        <LuckyPopLayer pops={pops} onRemove={removePop} />

        <AnimatePresence>
          {toast && (
            <motion.div
              className="toast"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

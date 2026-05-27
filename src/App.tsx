import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ComfortCorner } from "./components/ComfortCorner";
import { BonusTimeBanner } from "./components/BonusTimeBanner";
import { ClearScreen } from "./components/ClearScreen";
import { ClickButton, useClickButtonCenter } from "./components/ClickButton";
import { IdleIllustration } from "./components/illustrations/SceneIllustrations";
import { LuckyPopLayer } from "./components/LuckyPopLayer";
import { ProgressBar } from "./components/ProgressBar";
import { StageFlash } from "./components/StageFlash";
import { StageRewardSheet } from "./components/StageRewardSheet";
import { StartupHint } from "./components/StartupHint";
import { StatsOverlay } from "./components/StatsOverlay";
import { getPassiveCps, hasSpaceHoldEquipped } from "./game/engine/click";
import { getCurrentRewardStage, getRewardChoices, useGameStore } from "./game/store";
import type { GameState } from "./game/types";
import { useComfortMoments } from "./hooks/useComfortMoments";
import { useGameLoop } from "./hooks/useGameLoop";
import { useGlobalClick } from "./hooks/useGlobalClick";
import { useSpaceHoldClick } from "./hooks/useSpaceHoldClick";
import { useIdleUi } from "./hooks/useIdleUi";
import { useThrottledValue } from "./hooks/useThrottledDisplay";

export default function App() {
  const [statsOpen, setStatsOpen] = useState(false);
  const [rewardSheetOpen, setRewardSheetOpen] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const totalClicks = useGameStore((s) => s.state.totalClicks);
  const pendingRewardQueue = useGameStore((s) => s.state.pendingRewardQueue);
  const power = useGameStore((s) => s.state.power);
  const luckyChance = useGameStore((s) => s.state.luckyChance);
  const stageIndex = useGameStore((s) => s.state.stageIndex);
  const cleared = useGameStore((s) => s.state.cleared);
  const bonusTimeRemainingMs = useGameStore((s) => s.state.bonusTimeRemainingMs);
  const bonusTimeMultiplier = useGameStore((s) => s.state.bonusTimeMultiplier);
  const equippedItemIds = useGameStore((s) => s.state.equippedItemIds);
  const passiveCps = useGameStore((s) => getPassiveCps(s.state));
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

  const displayClicks = useThrottledValue(totalClicks);
  const rewardStage = getCurrentRewardStage({ pendingRewardQueue } as GameState);
  const rewardChoices = getRewardChoices({ pendingRewardQueue } as GameState);
  const isUiIdle = useIdleUi(lastActivityAt);
  const triggerCenterClick = useClickButtonCenter();

  const hasPendingRewards = rewardChoices.length > 0;
  const showStartupHint = !sessionStarted && !cleared && totalClicks === 0;
  const spaceHoldEquipped = hasSpaceHoldEquipped(equippedItemIds);
  const statsState: GameState = {
    saveVersion: 0,
    totalClicks,
    stageIndex,
    power,
    luckyChance,
    equippedItemIds,
    bonusTimeRemainingMs,
    bonusTimeMultiplier,
    pendingRewardQueue,
    cleared,
    lastClickAt: 0,
    comboStreak: 0,
    passiveAccumulatorMs: 0,
  };
  const keyboardMode = cleared
    ? "cleared"
    : showStartupHint
      ? "idle"
      : "playing";

  const handleKeyboardClick = useCallback(() => {
    touchActivity();
    triggerCenterClick();
  }, [touchActivity, triggerCenterClick]);

  const comfort = useComfortMoments({
    totalClicks,
    active: sessionStarted && !cleared,
  });

  useEffect(() => {
    if (!hasPendingRewards) {
      setRewardSheetOpen(false);
    }
  }, [hasPendingRewards]);

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
    if (!rewardSheetOpen || rewardChoices.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        setRewardSheetOpen(false);
        return;
      }

      const index = Number(event.key) - 1;
      if (index < 0 || index >= rewardChoices.length) return;
      selectReward(rewardChoices[index].id);
      setRewardSheetOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rewardSheetOpen, rewardChoices, selectReward]);

  const handleSelectReward = useCallback(
    (rewardId: string) => {
      selectReward(rewardId);
      setRewardSheetOpen(false);
    },
    [selectReward],
  );

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
    enabled: !spaceHoldEquipped,
    mode: keyboardMode,
    onClick: handleKeyboardClick,
    onStart: handleStart,
    onRestart: handleRestart,
  });

  useSpaceHoldClick({
    enabled: spaceHoldEquipped,
    mode: keyboardMode,
    onClick: handleKeyboardClick,
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
            totalClicks={totalClicks}
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
              stageIndex={stageIndex}
              personalBest={personalBest}
              passiveCps={passiveCps}
            />
            <div className="bonus-banner-slot">
              <BonusTimeBanner
                remainingMs={bonusTimeRemainingMs}
                multiplier={bonusTimeMultiplier}
              />
            </div>
          </div>
        </header>

        <StatsOverlay
          open={statsOpen}
          state={statsState}
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

        <ComfortCorner
          visible={comfort.unlocked && sessionStarted}
          message={comfort.message}
          onDismissMessage={comfort.dismissMessage}
        />

        {rewardStage !== null && (
          <StageRewardSheet
            stage={rewardStage}
            choices={rewardChoices}
            open={rewardSheetOpen}
            onToggle={() => setRewardSheetOpen((open) => !open)}
            onSelect={handleSelectReward}
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

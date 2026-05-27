export const SAVE_VERSION = 1;
export const SAVE_KEY = "click-quest-v1";

export const GOAL_CLICKS = 100_000_000;

export const MAX_LUCKY_CHANCE = 0.5;
export const MAX_EQUIPPED_ITEMS = 5;
export const LUCKY_MULTIPLIER = 3;
export const BASE_LUCKY_CHANCE = 0.03;

export const BONUS_TIME_DEFAULT_MS = 30_000;
export const BONUS_TIME_DEFAULT_MULT = 2;
export const BONUS_TIME_EXTEND_MS = 10_000;

export const COMBO_WINDOW_MS = 400;
export const COMBO_MAX_BONUS = 0.2;

export const PERSIST_DEBOUNCE_MS = 500;

export const COMFORT_UNLOCK_CLICKS = 1_000;
export const COMFORT_MESSAGE_MIN_MS = 45_000;
export const COMFORT_MESSAGE_MAX_MS = 90_000;

export const SPACE_CLICK_COOLDOWN_MS = 350;
export const SPACE_HOLD_DELAY_MS = 350;
export const SPACE_HOLD_INTERVAL_MS = 120;

/** 連打・オートクリック対策: 1秒あたりの処理上限 */
export const MAX_CLICKS_PER_SECOND = 28;
/** 1フレームにまとめるクリック数の上限 */
export const MAX_CLICKS_PER_FRAME = 12;
/** ポップアップ表示の最小間隔 */
export const POP_MIN_INTERVAL_MS = 140;
export const MAX_POPS = 6;

/** パッシブ収入の加算間隔 */
export const PASSIVE_TICK_MS = 1000;
/** オフライン収益の上限（30分） */
export const OFFLINE_PASSIVE_CAP_MS = 30 * 60 * 1000;

export const COMFORT_MUSIC_KEY = "click-quest-comfort-music";

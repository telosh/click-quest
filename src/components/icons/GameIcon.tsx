import type { IconType } from "react-icons";
import {
  GiClover,
  GiFingerPrint,
  GiGemPendant,
  GiGloves,
  GiHourglass,
  GiRainbowStar,
} from "react-icons/gi";
import { FaBolt, FaCrown, FaStar } from "react-icons/fa";
import { GiMuscleUp, GiSparkles } from "react-icons/gi";
import { IoTimerOutline } from "react-icons/io5";
import { LuClipboardList, LuKeyboard } from "react-icons/lu";

const ITEM_ICONS: Record<string, IconType> = {
  ring: GiGemPendant,
  clover: GiClover,
  spaceKey: LuKeyboard,
  gloves: GiGloves,
  hourglass: GiHourglass,
  rainbow: GiRainbowStar,
  crown: FaCrown,
  star: FaStar,
};

const REWARD_ICONS: Record<string, IconType> = {
  instantBoost: FaBolt,
  bonusTime: IoTimerOutline,
  powerUp: GiMuscleUp,
  luckyUp: GiSparkles,
};

interface GameIconProps {
  name: string;
  className?: string;
  "aria-hidden"?: boolean;
}

export function GameIcon({ name, className, "aria-hidden": ariaHidden = true }: GameIconProps) {
  const Icon = ITEM_ICONS[name] ?? REWARD_ICONS[name] ?? GiFingerPrint;
  return <Icon className={className} aria-hidden={ariaHidden} />;
}

export function SignIcon({ className }: { className?: string }) {
  return <LuClipboardList className={className} aria-hidden="true" />;
}

import type { IconType } from "react-icons";
import {
  GiClover,
  GiGears,
  GiDiceSixFacesFive,
  GiElectric,
  GiFactory,
  GiFingerPrint,
  GiGemPendant,
  GiGloves,
  GiHourglass,
  GiMegaphone,
  GiPerson,
  GiRainbowStar,
  GiScrollUnfurled,
  GiStoneBlock,
  GiWatch,
  GiWheat,
} from "react-icons/gi";
import { FaBolt, FaCrown, FaStar } from "react-icons/fa";
import { TbMetronome } from "react-icons/tb";
import { GiMuscleUp, GiSparkles } from "react-icons/gi";
import { IoTimerOutline } from "react-icons/io5";
import { LuClipboardList, LuKeyboard } from "react-icons/lu";

const ITEM_ICONS: Record<string, IconType> = {
  ring: GiGemPendant,
  clover: GiClover,
  pocketWatch: GiWatch,
  tapStone: GiStoneBlock,
  metronome: TbMetronome,
  helper: GiPerson,
  dice: GiDiceSixFacesFive,
  thornPact: GiClover,
  glassMask: GiGemPendant,
  minimalistSeal: GiWatch,
  heavyGauntlet: GiGloves,
  spaceKey: LuKeyboard,
  ancientMap: GiScrollUnfurled,
  gloves: GiGloves,
  conveyor: GiGears,
  hourglass: GiHourglass,
  farm: GiWheat,
  megaphone: GiMegaphone,
  rainbow: GiRainbowStar,
  amplifier: GiElectric,
  crown: FaCrown,
  star: FaStar,
  factory: GiFactory,
};

const REWARD_ICONS: Record<string, IconType> = {
  instantBoost: FaBolt,
  bonusTime: IoTimerOutline,
  powerUp: GiMuscleUp,
  luckyUp: GiSparkles,
  pact: GiScrollUnfurled,
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

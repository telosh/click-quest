import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { IoMusicalNotes, IoMusicalNotesOutline } from "react-icons/io5";
import {
  loadComfortMusicPref,
  saveComfortMusicPref,
  startComfortMusic,
  stopComfortMusic,
} from "../game/engine/comfortMusic";

interface ComfortCornerProps {
  visible: boolean;
  message: string | null;
  onDismissMessage: () => void;
}

export function ComfortCorner({ visible, message, onDismissMessage }: ComfortCornerProps) {
  const [musicOn, setMusicOn] = useState(loadComfortMusicPref);

  useEffect(() => {
    if (!visible || !musicOn) {
      stopComfortMusic();
      return;
    }
    startComfortMusic();
    return () => stopComfortMusic();
  }, [visible, musicOn]);

  const toggleMusic = () => {
    setMusicOn((prev) => {
      const next = !prev;
      saveComfortMusicPref(next);
      return next;
    });
  };

  if (!visible) return null;

  return (
    <aside className="comfort-corner" aria-label="応援コーナー">
      <div className="comfort-header">
        <span className="comfort-title">公式応援団</span>
        <button
          type="button"
          className={`comfort-music-btn${musicOn ? " on" : ""}`}
          onClick={toggleMusic}
          aria-pressed={musicOn}
          aria-label={musicOn ? "ふんわりBGMを止める" : "ふんわりBGMを流す"}
        >
          {musicOn ? <IoMusicalNotes aria-hidden="true" /> : <IoMusicalNotesOutline aria-hidden="true" />}
          <span>{musicOn ? "BGM ON" : "BGM OFF"}</span>
        </button>
      </div>

      {message && (
        <motion.button
          type="button"
          className="comfort-message"
          onClick={onDismissMessage}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          aria-live="polite"
        >
          {message}
        </motion.button>
      )}

      <p className="comfort-note">タップでメッセージを閉じられます</p>
    </aside>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import styles from "./page.module.css";

const ROUND_SECONDS = 30;
const STORAGE_KEY = "pulse-tap-best";

const comboLabels: Record<number, string> = {
  1: "Warm-up",
  4: "On fire",
  7: "Blazing",
  10: "Unstoppable",
  13: "Legendary",
};

type GameStatus = "idle" | "playing" | "finished";

export default function Home() {
  const { setMiniAppReady, isMiniAppReady } = useMiniKit();
  const [status, setStatus] = useState<GameStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [taps, setTaps] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [endAt, setEndAt] = useState<number | null>(null);

  const lastTapRef = useRef<number | null>(null);
  const comboRef = useRef(0);

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [setMiniAppReady, isMiniAppReady]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = Number.parseInt(saved, 10);
      if (!Number.isNaN(parsed)) {
        setBest(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (status !== "playing" || !endAt) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((endAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setStatus("finished");
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [status, endAt]);

  useEffect(() => {
    if (status !== "finished") return;
    if (score > best) {
      setBest(score);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, String(score));
      }
    }
  }, [status, score, best]);

  const progress = useMemo(() => {
    return Math.max(0, Math.min(1, timeLeft / ROUND_SECONDS));
  }, [timeLeft]);

  const comboLabel = useMemo(() => {
    const entries = Object.entries(comboLabels)
      .map(([key, value]) => [Number(key), value] as const)
      .sort((a, b) => b[0] - a[0]);
    for (const [threshold, label] of entries) {
      if (combo >= threshold) return label;
    }
    return "Ready";
  }, [combo]);

  const startGame = () => {
    setStatus("playing");
    setScore(0);
    setTaps(0);
    setCombo(0);
    setTimeLeft(ROUND_SECONDS);
    setEndAt(Date.now() + ROUND_SECONDS * 1000);
    comboRef.current = 0;
    lastTapRef.current = null;
  };

  const registerTap = () => {
    const now = Date.now();
    const withinCombo =
      lastTapRef.current !== null && now - lastTapRef.current <= 900;
    const nextCombo = withinCombo ? Math.min(comboRef.current + 1, 15) : 1;
    comboRef.current = nextCombo;
    lastTapRef.current = now;

    setCombo(nextCombo);
    setTaps((prev) => prev + 1);
    setScore((prev) => prev + 1 + Math.floor((nextCombo - 1) / 3));
  };

  const handleTap = () => {
    if (status !== "playing") {
      startGame();
    }
    if (status === "finished") {
      registerTap();
      return;
    }
    if (status === "idle") {
      registerTap();
      return;
    }
    if (status === "playing" && timeLeft > 0) {
      registerTap();
    }
  };

  const buttonLabel =
    status === "playing"
      ? "Tap!"
      : status === "finished"
        ? "Play Again"
        : "Start Round";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={`${styles.brandMark} ${styles.floating}`} />
          <div className={styles.brandText}>
            <h1>Pulse Tap</h1>
            <p>30‑second combo sprint.</p>
          </div>
        </div>
        <Wallet />
      </header>

      <main className={styles.main}>
        <section className={`${styles.card} ${styles.hero}`}>
          <div className={styles.statusRow}>
            <span className={styles.statusBadge}>
              {status === "playing" ? "Live round" : "Practice"}
            </span>
            <span className={styles.timer}>{timeLeft}s</span>
          </div>

          <div className={styles.progress}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className={styles.tapZone}>
            <button className={styles.tapButton} onClick={handleTap}>
              {buttonLabel}
            </button>
            <div className={styles.tapHint}>
              Tap fast to build combo. Combo adds bonus points and boosts your
              score.
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Score</div>
              <div className={styles.statValue}>{score}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Combo</div>
              <div className={styles.statValue}>{combo}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Best</div>
              <div className={styles.statValue}>{best}</div>
            </div>
          </div>
        </section>

        <aside className={`${styles.card} ${styles.sidePanel}`}>
          <div className={styles.statusRow}>
            <span className={styles.comboBadge}>{comboLabel}</span>
            <span>{taps} taps</span>
          </div>

          <div className={styles.tipList}>
            <div>1. Tap as fast as you can for 30 seconds.</div>
            <div>2. Keep the rhythm under 0.9s to build combo.</div>
            <div>3. Every 3 combo levels gives bonus points.</div>
            <div>4. New best scores are saved on this device.</div>
          </div>

          <div className={styles.ctaRow}>
            <button
              className={styles.secondaryButton}
              onClick={startGame}
              type="button"
            >
              Reset round
            </button>
          </div>
        </aside>
      </main>

      <footer className={styles.footer}>
        Built for Base Mini Apps. Keep it short, keep it fun.
      </footer>
    </div>
  );
}

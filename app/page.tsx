"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionToast,
} from "@coinbase/onchainkit/transaction";
import type { ContractFunctionParameters } from "viem";
import styles from "./page.module.css";

const ROUND_SECONDS = 30;
const STORAGE_KEY = "pulse-tap-best";
const CHECKIN_STORAGE_KEY = "pulse-tap-checkin";
const CHECKIN_STREAK_KEY = "pulse-tap-checkin-streak";
const CHECKIN_HISTORY_KEY = "pulse-tap-checkin-history";
const CHECKIN_BONUS_PER_TAP = 1;
const CHECKIN_DAILY_BONUS = 5;

const comboLabels: Record<number, string> = {
  1: "Warm-up",
  4: "On fire",
  7: "Blazing",
  10: "Unstoppable",
  13: "Legendary",
};

type GameStatus = "idle" | "playing" | "finished";
type CheckInHistoryItem = { date: string; txHash?: string };

export default function Home() {
  const { setMiniAppReady, isMiniAppReady } = useMiniKit();
  const [status, setStatus] = useState<GameStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [taps, setTaps] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [checkInHistory, setCheckInHistory] = useState<CheckInHistoryItem[]>(
    []
  );
  const [checkInBonusEarned, setCheckInBonusEarned] = useState(0);
  const [shareClicks, setShareClicks] = useState(0);
  const [checkInClicks, setCheckInClicks] = useState(0);
  const [checkInStatus, setCheckInStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [checkInStatusMessage, setCheckInStatusMessage] = useState("");
  const [endAt, setEndAt] = useState<number | null>(null);

  const lastTapRef = useRef<number | null>(null);
  const comboRef = useRef(0);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const checkInContract = process.env.NEXT_PUBLIC_CHECKIN_CONTRACT || "";
  const isCheckInContractValid = /^0x[a-fA-F0-9]{40}$/.test(checkInContract);
  const checkInCalls = useMemo<ContractFunctionParameters[] | null>(() => {
    if (!isCheckInContractValid) return null;
    return [
      {
        abi: [
          {
            type: "function",
            name: "checkIn",
            stateMutability: "nonpayable",
            inputs: [],
            outputs: [],
          },
        ],
        address: checkInContract as `0x${string}`,
        functionName: "checkIn",
        args: [],
      },
    ];
  }, [checkInContract, isCheckInContractValid]);

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
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(CHECKIN_STORAGE_KEY);
    if (saved) {
      setCheckInDate(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(CHECKIN_STREAK_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { lastDate?: string; streak?: number };
        if (parsed?.streak) {
          setCheckInStreak(parsed.streak);
        }
      } catch {
        // ignore invalid local storage
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(CHECKIN_HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CheckInHistoryItem[];
        if (Array.isArray(parsed)) {
          setCheckInHistory(parsed);
        }
      } catch {
        // ignore invalid local storage
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("pulse-tap-metrics");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as {
        shareClicks?: number;
        checkInClicks?: number;
        checkInBonusEarned?: number;
      };
      if (typeof parsed.shareClicks === "number") {
        setShareClicks(parsed.shareClicks);
      }
      if (typeof parsed.checkInClicks === "number") {
        setCheckInClicks(parsed.checkInClicks);
      }
      if (typeof parsed.checkInBonusEarned === "number") {
        setCheckInBonusEarned(parsed.checkInBonusEarned);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "pulse-tap-metrics",
      JSON.stringify({ shareClicks, checkInClicks, checkInBonusEarned })
    );
  }, [shareClicks, checkInClicks, checkInBonusEarned]);

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

  const hasCheckedIn = checkInDate === today;

  const trackEvent = (name: string, extra?: Record<string, unknown>) => {
    try {
      const payload = {
        name,
        ts: new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "",
        ...extra,
      };
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const blob = new Blob([JSON.stringify(payload)], {
          type: "application/json",
        });
        navigator.sendBeacon("/api/analytics", blob);
      } else if (typeof fetch !== "undefined") {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => undefined);
      }
    } catch {
      // ignore analytics errors
    }
  };

  const handleCheckInSuccess = (response?: {
    transactionReceipts?: { transactionHash?: string }[];
  }) => {
    const txHash = response?.transactionReceipts?.[0]?.transactionHash;
    setCheckInDate(today);
    setCheckInStatus("success");
    setCheckInStatusMessage("Check-in confirmed.");
    setCheckInBonusEarned((prev) => prev + CHECKIN_DAILY_BONUS);
    setScore((prev) => prev + CHECKIN_DAILY_BONUS);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHECKIN_STORAGE_KEY, today);
    }

    setCheckInHistory((prev) => {
      const next: CheckInHistoryItem[] = [
        { date: today, txHash },
        ...prev.filter((item) => item.date !== today),
      ].slice(0, 5);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CHECKIN_HISTORY_KEY, JSON.stringify(next));
      }
      return next;
    });

    trackEvent("checkin_success", { txHash });

    setCheckInStreak((prev) => {
      const lastSaved =
        typeof window !== "undefined"
          ? window.localStorage.getItem(CHECKIN_STREAK_KEY)
          : null;
      let lastDate: string | null = null;
      if (lastSaved) {
        try {
          const parsed = JSON.parse(lastSaved) as { lastDate?: string };
          lastDate = parsed?.lastDate ?? null;
        } catch {
          lastDate = null;
        }
      }

      const daysDiff = (() => {
        if (!lastDate) return null;
        const last = new Date(`${lastDate}T00:00:00Z`).getTime();
        const current = new Date(`${today}T00:00:00Z`).getTime();
        return Math.floor((current - last) / 86400000);
      })();

      let nextStreak = 1;
      if (daysDiff === 0) {
        nextStreak = Math.max(prev, 1);
      } else if (daysDiff === 1) {
        nextStreak = prev + 1;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          CHECKIN_STREAK_KEY,
          JSON.stringify({ lastDate: today, streak: nextStreak })
        );
      }
      return nextStreak;
    });
  };

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
    const bonus = hasCheckedIn ? CHECKIN_BONUS_PER_TAP : 0;
    setScore(
      (prev) =>
        prev + 1 + Math.floor((nextCombo - 1) / 3) + bonus
    );
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
              {hasCheckedIn && (
                <span className={styles.checkinReward}>
                  {" "}
                  Daily bonus: +{CHECKIN_BONUS_PER_TAP} per tap.
                </span>
              )}
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
          <div className={styles.checkinCard}>
            <div className={styles.checkinHeader}>
              <div>
                <div className={styles.checkinTitle}>Daily check-in</div>
                <div className={styles.checkinDescription}>
                  Sign once per day to keep your streak and earn +1 per tap.
                </div>
              </div>
              <span
                className={
                  hasCheckedIn ? styles.checkinBadge : styles.checkinBadgeMuted
                }
              >
                {hasCheckedIn ? "Checked in" : "Not yet"}
              </span>
            </div>

            <div className={styles.checkinMeta}>
              <span>Streak</span>
              <strong>{checkInStreak} days</strong>
            </div>

            {checkInCalls ? (
              <Transaction
                calls={checkInCalls}
                isSponsored
                onSuccess={handleCheckInSuccess}
                onError={(error) => {
                  setCheckInStatus("error");
                  setCheckInStatusMessage(
                    error?.message || "Transaction failed. Try again."
                  );
                  trackEvent("checkin_error", { error: error?.message });
                }}
                onStatus={(status) => {
                  if (status?.statusName === "pending") {
                    setCheckInStatus("pending");
                    setCheckInStatusMessage("Transaction pending...");
                  }
                  setCheckInClicks((prev) => prev + 1);
                }}
                className={styles.checkinActions}
              >
                <TransactionButton
                  text={hasCheckedIn ? "Checked in today" : "Check in on-chain"}
                  disabled={hasCheckedIn}
                  className={styles.checkinButton}
                />
                <TransactionSponsor />
                <TransactionToast />
              </Transaction>
            ) : (
              <div className={styles.checkinHint}>
                Set NEXT_PUBLIC_CHECKIN_CONTRACT in your env to enable on‑chain
                check‑ins (contract allowlisted in Paymaster).
              </div>
            )}

            <div className={styles.statusPillRow}>
              <span
                className={
                  checkInStatus === "success"
                    ? styles.statusPillSuccess
                    : checkInStatus === "error"
                      ? styles.statusPillError
                      : checkInStatus === "pending"
                        ? styles.statusPillPending
                        : styles.statusPillIdle
                }
              >
                {checkInStatus === "success"
                  ? "Success"
                  : checkInStatus === "error"
                    ? "Error"
                    : checkInStatus === "pending"
                      ? "Pending"
                      : "Idle"}
              </span>
              <span className={styles.statusMessage}>
                {checkInStatusMessage || "Ready to check in."}
              </span>
            </div>

            <div className={styles.checkinMetaRow}>
              <span>Daily bonus</span>
              <strong>+{CHECKIN_DAILY_BONUS} score</strong>
            </div>

            {checkInHistory.length > 0 && (
              <div className={styles.checkinHistory}>
                <div className={styles.checkinHistoryTitle}>Recent check-ins</div>
                <div className={styles.checkinHistoryList}>
                  {checkInHistory.map((entry) => (
                    <div key={entry.date} className={styles.checkinRow}>
                      <span>{entry.date}</span>
                      <span className={styles.checkinHash}>
                        {entry.txHash
                          ? `${entry.txHash.slice(0, 6)}…${entry.txHash.slice(-4)}`
                          : "ok"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.shareCard}>
            <div>
              <div className={styles.shareTitle}>Share Pulse Tap</div>
              <div className={styles.shareDescription}>
                Copy the link or share with friends to get more plays.
              </div>
            </div>
            <div className={styles.shareActions}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={async () => {
                  const url =
                    typeof window !== "undefined" ? window.location.href : "";
                  try {
                    await navigator.clipboard.writeText(url);
                    setCheckInStatusMessage("Link copied.");
                  } catch {
                    // ignore clipboard failures
                  }
                  setShareClicks((prev) => prev + 1);
                  trackEvent("share_copy");
                }}
              >
                Copy link
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => {
                  const url =
                    typeof window !== "undefined" ? window.location.href : "";
                  if (navigator.share) {
                    navigator.share({ title: "Pulse Tap", url }).catch(() => {
                      /* ignore */
                    });
                  }
                  setShareClicks((prev) => prev + 1);
                  trackEvent("share_native");
                }}
              >
                Share
              </button>
            </div>
          </div>

          <div className={styles.metricsCard}>
            <div className={styles.metricsTitle}>Local stats</div>
            <div className={styles.metricsGrid}>
              <div>
                <div className={styles.metricLabel}>Shares</div>
                <div className={styles.metricValue}>{shareClicks}</div>
              </div>
              <div>
                <div className={styles.metricLabel}>Check-in clicks</div>
                <div className={styles.metricValue}>{checkInClicks}</div>
              </div>
              <div>
                <div className={styles.metricLabel}>Bonus earned</div>
                <div className={styles.metricValue}>{checkInBonusEarned}</div>
              </div>
            </div>
          </div>

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

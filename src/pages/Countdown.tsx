import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Clock } from 'lucide-react';

// Longmont, Colorado — America/Denver (MDT/MST)
const MEETUP_HOUR = 12; // noon MDT
const MEETUP_DURATION_HOURS = 1;

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // milliseconds
  isLive: boolean;
  isPastToday: boolean;
}

function getNextWednesdayNoon(): Date {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun, 1=Mon, ..., 3=Wed
  // Days until next Wednesday (day index 3)
  // If today is Wed, we count from today
  const daysUntilWed = (3 - dow + 7) % 7;
  const nextWed = new Date(now);
  nextWed.setDate(now.getDate() + daysUntilWed);
  nextWed.setHours(MEETUP_HOUR, 0, 0, 0);
  return nextWed;
}

function isLive(meetupTime: Date): boolean {
  const now = new Date();
  const endTime = new Date(meetupTime);
  endTime.setHours(MEETUP_HOUR + MEETUP_DURATION_HOURS);
  return now >= meetupTime && now < endTime;
}

function isPastTodayMeetup(): boolean {
  const now = new Date();
  const endTime = new Date();
  endTime.setHours(MEETUP_HOUR + MEETUP_DURATION_HOURS, 0, 0, 0);
  return now >= endTime;
}

function computeTimeLeft(): TimeLeft {
  const now = new Date();
  const nextWed = getNextWednesdayNoon();

  // If it's Wednesday and we've passed today's meetup (1 PM), treat as "not today"
  const todayDow = now.getDay();
  const isWednesday = todayDow === 3;
  const pastToday = isPastTodayMeetup();

  let targetDate: Date;
  if (isWednesday && !pastToday) {
    targetDate = nextWed; // today at noon
  } else {
    // Next Wednesday — if we just passed today's (past 1 PM), add 14 days
    targetDate = new Date(nextWed);
    if (pastToday) {
      targetDate.setDate(targetDate.getDate() + 14);
    }
  }

  const diff = targetDate.getTime() - now.getTime();
  const live = isLive(getNextWednesdayNoon());

  if (diff <= 0 && !live) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isLive: false, isPastToday: true };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);

  return { days, hours, minutes, seconds, total: diff, isLive: live, isPastToday: pastToday };
}

interface DigitProps {
  value: number;
  label: string;
}

const Digit: React.FC<DigitProps> = ({ value, label }) => {
  // Track if digit changed for animation trigger
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={value}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl sm:text-7xl md:text-8xl font-bold font-mono tracking-tighter leading-none"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {String(value).padStart(2, '0')}
          </motion.div>
        </AnimatePresence>
      </div>
      <span className="text-xs sm:text-sm font-mono uppercase tracking-widest text-[var(--text-muted)] mt-2">
        {label}
      </span>
    </div>
  );
};

interface SeparatorProps {
  visible: boolean;
}

const Separator: React.FC<SeparatorProps> = ({ visible }) => (
  <div className="flex flex-col gap-2 self-start mt-4 sm:mt-5">
    <div
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: visible ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.15)' }}
    />
    <div
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: visible ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.15)' }}
    />
  </div>
);

// Confetti particle — random starting position, falls with drift
interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  rotation: number;
  drift: number;
}

const CONFETTI_COLORS = [
  'var(--color-cyan)',
  'var(--color-purple)',
  'var(--color-pink)',
  'var(--color-sunset)',
  'var(--color-blue)',
  '#ffffff',
];

function Confetti() {
  const pieces = React.useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 2,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 120,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: '-10vh', rotate: 0, opacity: 1 }}
          animate={{
            y: '110vh',
            x: `calc(${p.x}vw + ${p.drift}px)`,
            rotate: p.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            top: 0,
            left: 0,
          }}
        />
      ))}
    </div>
  );
}

const Countdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(computeTimeLeft);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      const t = computeTimeLeft();
      setTimeLeft(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const nextWed = getNextWednesdayNoon();
  const isLiveEvent = timeLeft.isLive;
  const isWednesday = new Date().getDay() === 3;

  // Next meetup display date
  const meetupDateStr = nextWed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const meetupTimeStr = '12:00 PM MDT';

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center text-center">
      {/* Live confetti */}
      <AnimatePresence>{isLiveEvent && <Confetti />}</AnimatePresence>

      {/* Hero badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        {isLiveEvent ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 text-sm font-mono uppercase tracking-widest">
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-500 inline-block"
            />
            Live Now — Longmont AI Meetup
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5 text-[var(--accent-cyan)] text-sm font-mono uppercase tracking-widest">
            <Calendar size={14} />
            Every Other Wednesday · {meetupDateStr}
          </div>
        )}
      </motion.div>

      {/* Main heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight"
      >
        {isLiveEvent ? (
          <>
            <span className="text-gradient-vibrant">Meetup in Progress</span>
            <br />
            <span className="text-[var(--text-secondary)] text-xl sm:text-2xl font-normal">
              Join the gathering — you're here!
            </span>
          </>
        ) : (
          <>
            Next{' '}
            <span className="text-gradient-vibrant">Longmont AI</span>
            <br />
            <span className="text-[var(--text-secondary)] text-xl sm:text-2xl font-normal">
              Meetup Starts In
            </span>
          </>
        )}
      </motion.h1>

      {/* Countdown display */}
      {!isLiveEvent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-start gap-3 sm:gap-4 md:gap-5 mb-10"
        >
          <Digit value={timeLeft.days} label="Days" />
          <Separator visible />
          <Digit value={timeLeft.hours} label="Hours" />
          <Separator visible />
          <Digit value={timeLeft.minutes} label="Minutes" />
          <Separator visible />
          <Digit value={timeLeft.seconds} label="Seconds" />
        </motion.div>
      )}

      {/* Live countdown ring — shows minutes remaining during live */}
      {isLiveEvent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative w-48 h-48 mb-10"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <motion.circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#liveGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 90}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: [2 * Math.PI * 90, 0] }}
              transition={{ duration: 60 * 60, repeat: Infinity, ease: 'linear' }}
            />
            <defs>
              <linearGradient id="liveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-pink)" />
                <stop offset="100%" stopColor="var(--color-cyan)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold font-mono text-white">60</span>
            <span className="text-sm text-[var(--text-muted)] font-mono">minutes</span>
          </div>
        </motion.div>
      )}

      {/* Meetup details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex flex-col sm:flex-row items-center gap-4 text-sm text-[var(--text-secondary)]"
      >
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-[var(--accent-cyan)]" />
          <span>Longmont, Colorado</span>
        </div>
        <span className="hidden sm:block text-white/20">·</span>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[var(--accent-cyan)]" />
          <span>{meetupTimeStr} (MDT)</span>
        </div>
      </motion.div>

      {/* Next meetup date */}
      {!isLiveEvent && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-3 text-sm text-[var(--text-muted)]"
        >
          {isWednesday && !timeLeft.isPastToday
            ? "Today's Meetup — Wednesday, May {new Date().getDate()}, 2026 at Noon"
            : `Next Meetup — ${meetupDateStr} at Noon MDT`}
        </motion.p>
      )}

      {/* CTA during live */}
      {isLiveEvent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <a
            href="https://www.meetup.com/longmont-ai-for-business-owners-and-creators"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
            }}
          >
            Join the Meetup
          </a>
        </motion.div>
      )}

      {/* Pulsing glow behind the counter */}
      {!isLiveEvent && (
        <div
          className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{
              background: 'radial-gradient(circle, var(--color-cyan) 0%, transparent 70%)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Countdown;

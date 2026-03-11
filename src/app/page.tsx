"use client";

import { useState, useMemo, useEffect, useRef } from "react";

/* ───────── Math helpers ───────── */

/** Compute ceil(log2(10^x + 1)) using BigInt for precision at large exponents */
function bitsRequired(x: number): number {
  if (x === 0) return 1; // 10^0 = 1, needs 1 bit
  const n = 10n ** BigInt(x) + 1n;
  // bit-length of n is floor(log2(n)) + 1, which equals ceil(log2(n)) when n is not a power of 2
  // For our case: bits = ceil(log2(10^x + 1))
  let bits = 0;
  let v = n - 1n; // we want ceil(log2(n)) = floor(log2(n-1)) + 1 when n>1
  while (v > 0n) {
    v >>= 1n;
    bits++;
  }
  return bits;
}

/** Pretty-format a BigInt with locale commas */
function formatBigInt(n: bigint): string {
  const s = n.toString();
  // insert commas from the right
  const parts: string[] = [];
  for (let i = s.length; i > 0; i -= 3) {
    parts.unshift(s.slice(Math.max(0, i - 3), i));
  }
  return parts.join(",");
}

/* ───────── Components ───────── */

function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        relative rounded-2xl border border-white/[0.08]
        bg-white/[0.04] backdrop-blur-xl
        shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <GlassPanel className="flex flex-col items-center justify-center gap-1 p-5 transition-transform duration-200 hover:scale-[1.03]">
      <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-violet-300/70">
        {label}
      </span>
      <span
        key={value}
        className={`animate-digit-in font-mono text-2xl font-bold sm:text-3xl ${
          accent
            ? "bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
            : "text-white"
        }`}
      >
        {value}
      </span>
      {sub && (
        <span className="text-xs text-violet-200/40">{sub}</span>
      )}
    </GlassPanel>
  );
}

/* ───────── Page ───────── */

export default function Home() {
  const [exponent, setExponent] = useState(9);
  const [sliderValue, setSliderValue] = useState(9);
  const [isSigned, setIsSigned] = useState(true);
  const sliderRef = useRef<HTMLInputElement>(null);
  const snapFrameRef = useRef<number | null>(null);

  // Auto-focus slider for keyboard accessibility
  useEffect(() => {
    sliderRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (snapFrameRef.current !== null) {
        cancelAnimationFrame(snapFrameRef.current);
      }
    };
  }, []);

  const snapToNearestInteger = () => {
    const target = Math.round(sliderValue);
    const start = sliderValue;
    const duration = 180;
    const startTime = performance.now();

    if (snapFrameRef.current !== null) {
      cancelAnimationFrame(snapFrameRef.current);
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      const nextValue = start + (target - start) * eased;
      setSliderValue(nextValue);

      if (t < 1) {
        snapFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      setSliderValue(target);
      setExponent(target);
      snapFrameRef.current = null;
    };

    snapFrameRef.current = requestAnimationFrame(animate);
  };

  const { bits, baseBits, bitsLabel, fitsInLabel, valueLabel, isCompactValue } = useMemo(() => {
    const nVal = 10n ** BigInt(exponent);
    const unsignedBits = bitsRequired(exponent);
    const effectiveBits = isSigned ? unsignedBits + 1 : unsignedBits;

    const fits =
      effectiveBits <= 8
        ? isSigned
          ? "int8"
          : "uint8"
        : effectiveBits <= 16
          ? isSigned
            ? "int16"
            : "uint16"
          : effectiveBits <= 32
            ? isSigned
              ? "int32"
              : "uint32"
            : effectiveBits <= 64
              ? isSigned
                ? "int64"
                : "uint64"
              : "64+ bits required";

    return {
      bits: effectiveBits,
      baseBits: unsignedBits,
      bitsLabel:
        effectiveBits <= 64
          ? `${effectiveBits} bit${effectiveBits !== 1 ? "s" : ""}`
          : "64+ bits",
      fitsInLabel: fits,
      valueLabel: formatBigInt(nVal),
      isCompactValue: exponent > 6,
    };
  }, [exponent, isSigned]);

  const pct = (sliderValue / 20) * 100;

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#050510]">
      {/* ── Ambient background orbs ── */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]"
        style={{ animation: "float 12s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-fuchsia-600/15 blur-[100px]"
        style={{ animation: "float 15s ease-in-out infinite reverse" }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[90px]"
        style={{ animation: "pulse-glow 6s ease-in-out infinite" }}
      />

      {/* ── Main panel ── */}
      <GlassPanel className="z-10 mx-4 w-full max-w-[54rem] p-8 sm:p-10">
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            Bit Size Calculator
          </h1>
          <p className="mt-2 text-sm text-violet-200/50">
            How many bits to represent powers of 10?
          </p>
        </div>

        {/* Value display */}
        <div className="mb-6 text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-violet-300/70">
            Value
          </p>
          <p
            key={isCompactValue ? `${isSigned ? "signed" : "unsigned"}-${exponent}` : valueLabel}
            className="animate-digit-in mt-1 font-mono text-xl text-violet-100/90 sm:text-2xl"
          >
            {isCompactValue ? (
              <>
                {isSigned ? "±" : ""}10<sup>{exponent}</sup>
              </>
            ) : (
              valueLabel
            )}
          </p>
        </div>

        {/* Slider */}
        <div className="relative mb-2 px-[14px]">
          {/* Glow track underlay */}
          <div
            className="pointer-events-none absolute top-[46%] left-[14px] right-[14px] h-[8px] -translate-y-1/2 rounded-full overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-fuchsia-500/40"
              style={{ width: `${pct}%` }}
            />
          </div>
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={20}
            step={0.01}
            value={sliderValue}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (snapFrameRef.current !== null) {
                cancelAnimationFrame(snapFrameRef.current);
                snapFrameRef.current = null;
              }
              setSliderValue(next);
              setExponent(Math.round(next));
            }}
            onPointerUp={snapToNearestInteger}
            onPointerCancel={snapToNearestInteger}
            onKeyUp={snapToNearestInteger}
            onBlur={snapToNearestInteger}
            className="relative z-10 w-full"
            aria-label="Exponent x"
          />
        </div>

        {/* Slider labels */}
        <div className="relative mb-8 h-4 text-[0.65rem] font-medium text-violet-300/40">
          <div className="absolute left-[28px] right-[29px]">
            <span className="absolute left-0 -translate-x-1/2">0</span>
            <span className="absolute left-[25%] -translate-x-1/2">5</span>
            <span className="absolute left-[50%] -translate-x-1/2">10</span>
            <span className="absolute left-[75%] -translate-x-1/2">15</span>
            <span className="absolute left-full -translate-x-1/2">20</span>
          </div>
        </div>

        {/* Signed toggle */}
        <div className="mb-5 flex items-center justify-center">
          <label className="group flex cursor-pointer items-center gap-3 text-sm text-violet-200/75 select-none">
            <input
              type="checkbox"
              checked={isSigned}
              onChange={(e) => setIsSigned(e.target.checked)}
              className="peer sr-only"
              aria-label="Use signed integer"
            />
            <span
              className={`relative h-6 w-6 rounded-full border bg-white/[0.04] shadow-[0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 ease-out group-hover:border-violet-300/50 peer-focus-visible:ring-0 ${
                isSigned
                  ? "border-violet-300/70 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_16px_rgba(167,139,250,0.22),inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "border-white/20"
              }`}
              aria-hidden="true"
            >
              <span
                className={`absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.75)] transition-all duration-250 ease-out ${
                  isSigned ? "opacity-100 scale-100" : "opacity-0 scale-60"
                }`}
              />
            </span>
            <span className="transition-colors duration-200 group-hover:text-violet-100">Signed</span>
          </label>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Bits Needed" value={bitsLabel} accent />
          <StatCard
            label="Fits In"
            value={fitsInLabel}
            sub={bits <= 64 ? (isSigned ? "signed integer type" : "unsigned integer type") : "requires arbitrary-precision integer"}
          />
        </div>

        {/* Detail row */}
        <GlassPanel className="mt-4 px-5 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-violet-200/40">Formula</span>
            <span className="font-mono text-violet-200/70">
              {isSigned ? (
                <>
                  ⌈ log<sub>2</sub>( 10<sup>{exponent}</sup> + 1 ) ⌉ + 1 ={" "}
                  <span className="font-semibold text-violet-300">{bits}</span>
                </>
              ) : (
                <>
                  ⌈ log<sub>2</sub>( 10<sup>{exponent}</sup> + 1 ) ⌉ ={" "}
                  <span className="font-semibold text-violet-300">{baseBits}</span>
                </>
              )}
            </span>
          </div>
        </GlassPanel>

        {/* Bit bar visualization */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[0.6rem] text-violet-300/30">
            <span>0</span>
            <span>64 bits</span>
          </div>
          <div className={`h-2.5 w-full overflow-hidden rounded-full border bg-white/[0.03] ${bits > 64 ? "border-rose-300/35 animate-overflow-pulse" : "border-white/[0.06]"}`}>
            <div
              className={`relative h-full rounded-full transition-all duration-300 ease-out ${bits > 64 ? "bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400" : "bg-gradient-to-r from-violet-500 to-fuchsia-500"}`}
              style={{
                width: `${Math.min((bits / 64) * 100, 100)}%`,
              }}
            >
              {bits > 64 && (
                <span className="absolute inset-y-0 left-0 w-1/3 animate-warning-sweep bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              )}
            </div>
          </div>
          <p className={`mt-1 text-center text-[0.6rem] text-fuchsia-400/60 transition-opacity duration-300 ${bits > 64 ? "opacity-100" : "opacity-0"}`}>
            {bits > 64 ? (
              <>
                {bits} bits — overflows 64-bit by {bits - 64} {bits - 64 === 1 ? "bit" : "bits"}
              </>
            ) : (
              <>&nbsp;</>
            )}
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}

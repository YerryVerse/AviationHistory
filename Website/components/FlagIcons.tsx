"use client";
import React from "react";

export function USAFlagSvg({
  width = 24,
  height = 16,
  style = {},
}: {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 741 390"
      width={width}
      height={height}
      style={{
        display: "inline-block",
        borderRadius: 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
    >
      <rect width="741" height="390" fill="#b22234" />
      <path d="M0,30h741M0,90h741M0,150h741M0,210h741M0,270h741M0,330h741" stroke="#ffffff" strokeWidth="30" />
      <rect width="296.4" height="210" fill="#3c3b6e" />
      <g fill="#ffffff">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((row) =>
          (row % 2 === 0 ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4]).map((col) => {
            const cx = row % 2 === 0 ? 24.7 + col * 49.4 : 49.4 + col * 49.4;
            const cy = 21 + row * 21;
            return <circle key={`${row}-${col}`} cx={cx} cy={cy} r="6" />;
          })
        )}
      </g>
    </svg>
  );
}

export function NetherlandsFlagSvg({
  width = 24,
  height = 16,
  style = {},
}: {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 900 600"
      width={width}
      height={height}
      style={{
        display: "inline-block",
        borderRadius: 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
    >
      <rect width="900" height="200" fill="#ae1c28" />
      <rect y="200" width="900" height="200" fill="#ffffff" />
      <rect y="400" width="900" height="200" fill="#21468b" />
    </svg>
  );
}

export function UKFlagSvg({
  width = 24,
  height = 16,
  style = {},
}: {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 60 30"
      width={width}
      height={height}
      style={{
        display: "inline-block",
        borderRadius: 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
    >
      <clipPath id="uk-flag-clip">
        <rect width="60" height="30" rx="3" />
      </clipPath>
      <g clipPath="url(#uk-flag-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#ffffff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" strokeWidth="2" />
        <path d="M30,0 v30 M0,15 h60" stroke="#ffffff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function GermanyFlagSvg({
  width = 24,
  height = 16,
  style = {},
}: {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 5 3"
      width={width}
      height={height}
      style={{
        display: "inline-block",
        borderRadius: 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
    >
      <rect width="5" height="1" fill="#000000" />
      <rect y="1" width="5" height="1" fill="#dd0000" />
      <rect y="2" width="5" height="1" fill="#ffce00" />
    </svg>
  );
}

export function FranceFlagSvg({
  width = 24,
  height = 16,
  style = {},
}: {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 3 2"
      width={width}
      height={height}
      style={{
        display: "inline-block",
        borderRadius: 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
    >
      <rect width="1" height="2" fill="#002395" />
      <rect x="1" width="1" height="2" fill="#ffffff" />
      <rect x="2" width="1" height="2" fill="#ed2939" />
    </svg>
  );
}

export function CountryFlagSvg({
  countryCode,
  width = 24,
  height = 16,
  style,
}: {
  countryCode: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}) {
  const code = (countryCode || "").toUpperCase().trim();
  if (code === "US" || code === "USA" || code === "UNITED STATES" || code === "UNITED STATES OF AMERICA" || code === "🇺🇸") {
    return <USAFlagSvg width={width} height={height} style={style} />;
  }
  if (code === "NL" || code === "NLD" || code === "NETHERLANDS" || code === "🇳🇱") {
    return <NetherlandsFlagSvg width={width} height={height} style={style} />;
  }
  if (code === "GB" || code === "GBR" || code === "UK" || code === "UNITED KINGDOM" || code === "🇬🇧") {
    return <UKFlagSvg width={width} height={height} style={style} />;
  }
  if (code === "DE" || code === "DEU" || code === "GERMANY" || code === "🇩🇪") {
    return <GermanyFlagSvg width={width} height={height} style={style} />;
  }
  if (code === "FR" || code === "FRA" || code === "FRANCE" || code === "🇫🇷") {
    return <FranceFlagSvg width={width} height={height} style={style} />;
  }
  return null;
}


import React from "react";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
const basePath = rawBasePath && rawBasePath !== "/" ? `/${rawBasePath.replace(/^\/+|\/+$/g, "")}` : "";
export const getIconPath = (path: string) => `${basePath}${path.startsWith('/') ? path : `/${path}`}`;

export interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Occupants Icon: Man, Woman, Boy, Girl standing together (User-provided family vector artwork)
 */
export function OccupantsFamilySvg({ size = 110, className, style }: IconProps) {
  return (
    <img
      src={getIconPath("/icons/family_survivors_hero.png")}
      alt="Occupants Family"
      width={typeof size === "number" ? size * 0.83 : size}
      height={size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * High-Definition Airplane Passenger Seat Hero Graphic (Side profile)
 */
export function AirplaneSeatSvg({ size = 100, className, style }: IconProps) {
  return (
    <img
      src={getIconPath("/icons/airplane_seat_hero.png")}
      alt="Airplane Passenger Seat"
      width={typeof size === "number" ? size * 0.72 : size}
      height={size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * High-Definition Ground Fatalities Vector Graphic: House with Explosion & Crashing Airliner (User-provided vector artwork)
 */
export function HousePlaneCrashSvg({ size = 110, className, style }: IconProps) {
  return (
    <img
      src={getIconPath("/icons/ground_fatality_house_crash.png")}
      alt="House Plane Crash"
      width={typeof size === "number" ? size * 1.25 : size}
      height={size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

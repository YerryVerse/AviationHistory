"use client";
import React from "react";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
const basePath = rawBasePath && rawBasePath !== "/" ? `/${rawBasePath.replace(/^\/+|\/+$/g, "")}` : "";
export const getIconPath = (path: string) => `${basePath}${path.startsWith('/') ? path : `/${path}`}`;

export interface AircraftIconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Propeller: Light Aircraft (Cessna 172) - High-Definition Side Profile Facing Right (Imagen 3 AI Asset)
 */
export function CessnaSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/cessna_propeller_hero.png")}
      alt="Cessna Propeller Aircraft"
      width={size}
      height={typeof size === "number" ? size * 0.42 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * Jet: Airbus A380 Double-Deck Passenger Airliner - High-Definition Side Profile Facing Right (Imagen 3 AI Asset)
 */
export function JetSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/airbus_a380_jet_hero.png")}
      alt="Airbus A380 Passenger Jet"
      width={size}
      height={typeof size === "number" ? size * 0.42 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * Helicopter: Sikorsky CH-53K Heavy Transport Helicopter - High-Definition Side Profile Facing Right (Imagen 3 AI Asset)
 */
export function HelicopterSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/passenger_helicopter_hero.png")}
      alt="Passenger Helicopter"
      width={size}
      height={typeof size === "number" ? size * 0.45 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * Glider: Ventus 3 High-Performance Sailplane - High-Definition Side Profile Facing Right (Imagen 3 AI Asset)
 */
export function GliderSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/modern_glider_hero.png")}
      alt="Modern Sailplane Glider"
      width={size}
      height={typeof size === "number" ? size * 0.32 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * KPI Occurrence - Accident: Aircraft Crashing (High-Definition AI Vector Graphic)
 */
export function AccidentCrashSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/accident_crash.png")}
      alt="Accident Crash"
      width={size}
      height={typeof size === "number" ? size * 0.868 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

/**
 * KPI Occurrence - Incident: Airplane with Engine Smoke (High-Definition AI Vector Graphic)
 */
export function IncidentSmokeSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/incident_smoke.png")}
      alt="Incident Engine Smoke"
      width={size}
      height={typeof size === "number" ? size * 0.379 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.25))",
        ...style,
      }}
    />
  );
}

/**
 * KPI Occurrence - Shotdown: Military Jet Missile Explosion (High-Definition AI Vector Graphic)
 */
export function MilitaryShotdownSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/military_shotdown.png")}
      alt="Shotdown Military Jet"
      width={size}
      height={typeof size === "number" ? size * 0.648 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.25))",
        ...style,
      }}
    />
  );
}

/**
 * Era 1 - Pioneer Era: Wright Brothers Flyer (3/4 Perspective View)
 */
export function WrightFlyerSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/wright_flyer.png")}
      alt="Wright Flyer 1903"
      width={size}
      height={typeof size === "number" ? size * 0.55 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

/**
 * Era 2 - World War I: WWI Biplane Side Profile
 */
export function Ww1BiplaneSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/ww1_biplane.png")}
      alt="WWI Biplane"
      width={size}
      height={typeof size === "number" ? size * 0.52 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

/**
 * Era 3 - Interwar Era: 1930s Propeller Monoplane Side Profile
 */
export function InterwarPlaneSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/interwar_plane.png")}
      alt="Interwar Monoplane"
      width={size}
      height={typeof size === "number" ? size * 0.45 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

/**
 * Era 4 - World War II: P-51 Mustang Fighter Side Profile
 */
export function P51MustangSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/p51_mustang.png")}
      alt="P-51 Mustang WWII"
      width={size}
      height={typeof size === "number" ? size * 0.42 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

/**
 * Era 5 - Cold War: F-16 Fighting Falcon Jet Side Profile
 */
export function F16FalconSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/f16_falcon.png")}
      alt="F-16 Falcon Cold War"
      width={size}
      height={typeof size === "number" ? size * 0.4 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

/**
 * Military Aircraft: F-22 Raptor Stealth Fighter Side Profile (Facing Left)
 */
export function F22RaptorSideSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/f22_raptor_side.png")}
      alt="F-22 Raptor Military Jet Side Profile"
      width={size}
      height={typeof size === "number" ? size * 0.244 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

/**
 * Era 6 - Commercial Era: Boeing 747 Jumbo Jet Side Profile
 */
export function Boeing747Svg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/boeing_747.png")}
      alt="Boeing 747 Commercial Jet"
      width={size}
      height={typeof size === "number" ? size * 0.38 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

/**
 * Era 7 - Modern Digital Era: Airbus A380 Superjumbo Side Profile
 */
export function AirbusA380Svg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/airbus_a380.png")}
      alt="Airbus A380 Superjumbo"
      width={size}
      height={typeof size === "number" ? size * 0.42 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

/**
 * Boeing 777 En-Route Cruise (Facing Right, Side Profile)
 */
export function Boeing777EnRouteSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/boeing_777_enroute.png")}
      alt="Boeing 777 En-Route Cruise"
      width={size}
      height={typeof size === "number" ? size * 0.248 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * Boeing 777 Landing Flare (Facing Right, Side Profile)
 */
export function Boeing777LandingSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/boeing_777_landing.png")}
      alt="Boeing 777 Landing Flare"
      width={size}
      height={typeof size === "number" ? size * 0.277 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * Boeing 777 Takeoff Climb (Facing Right, Side Profile)
 */
export function Boeing777TakeoffSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/boeing_777_takeoff.png")}
      alt="Boeing 777 Takeoff Climb"
      width={size}
      height={typeof size === "number" ? size * 0.396 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * Ground / Taxi: Top-Down Airplane Connected to Airport Jet Bridge Ramp
 */
export function AirportGroundRampSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/airport_ground_ramp.png")}
      alt="Airplane Connected to Airport Jet Bridge Ramp"
      width={size}
      height={typeof size === "number" ? size * 0.766 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * Destroyed Aircraft Top Down - Generated with Imagen 3
 */
export function DestroyedTopDownSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/destroyed_plane_damage.png")}
      alt="Destroyed Passenger Aircraft Top Down"
      width={size}
      height={typeof size === "number" ? size * 0.82 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))",
        ...style,
      }}
    />
  );
}

/**
 * Substantial Damage Aircraft Top Down - Generated with Imagen 3
 */
export function SubstantialTopDownSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/substantial_plane_damage.png")}
      alt="Substantial Damage Passenger Aircraft Top Down"
      width={size}
      height={typeof size === "number" ? size * 0.82 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * Minor Damage Aircraft Top Down - Generated with Imagen 3
 */
export function MinorTopDownSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/minor_plane_damage.png")}
      alt="Minor Damage Passenger Aircraft Top Down"
      width={size}
      height={typeof size === "number" ? size * 0.82 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.35))",
        ...style,
      }}
    />
  );
}

/**
 * Ghost Missing Aircraft Top Down - Generated with Imagen 3
 */
export function GhostPlaneTopDownSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/ghost_plane_missing.png")}
      alt="Ghost Missing Passenger Aircraft Top Down"
      width={size}
      height={typeof size === "number" ? size * 0.82 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        opacity: 0.85,
        filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.25))",
        ...style,
      }}
    />
  );
}

/**
 * Top Aircraft Common Models - Side Profiles Facing Left
 */
export function SkyhawkSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_skyhawk.png")}
      alt="Cessna 172 Skyhawk"
      width={size}
      height={typeof size === "number" ? size * 0.55 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function CherokeeSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_cherokee.png")}
      alt="Piper PA-28 Cherokee"
      width={size}
      height={typeof size === "number" ? size * 0.4 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function Cessna150Svg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_cessna150.png")}
      alt="Cessna 150"
      width={size}
      height={typeof size === "number" ? size * 0.55 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function SkylaneSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_skylane.png")}
      alt="Cessna 182 Skylane"
      width={size}
      height={typeof size === "number" ? size * 0.55 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function MosquitoSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_mosquito.png")}
      alt="de Havilland DH.98 Mosquito"
      width={size}
      height={typeof size === "number" ? size * 0.55 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function CorsairSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_corsair.png")}
      alt="Vought F4U Corsair"
      width={size}
      height={typeof size === "number" ? size * 0.55 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function BonanzaSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_bonanza.png")}
      alt="Beechcraft Bonanza"
      width={size}
      height={typeof size === "number" ? size * 0.55 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function Dc3Svg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_dc3.png")}
      alt="Douglas DC-3"
      width={size}
      height={typeof size === "number" ? size * 0.33 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function GliderModelSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_glider.png")}
      alt="Sailplane Glider"
      width={size}
      height={typeof size === "number" ? size * 0.22 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function SuperCubSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_supercub.png")}
      alt="Piper PA-18 Super Cub"
      width={size}
      height={typeof size === "number" ? size * 0.36 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function CenturionSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_centurion.png")}
      alt="Cessna 210 Centurion"
      width={size}
      height={typeof size === "number" ? size * 0.43 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function StationairSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_stationair.png")}
      alt="Cessna 206 Stationair"
      width={size}
      height={typeof size === "number" ? size * 0.43 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function SpitfireSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_spitfire.png")}
      alt="Supermarine Spitfire"
      width={size}
      height={typeof size === "number" ? size * 0.43 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function ThunderboltSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_thunderbolt.png")}
      alt="Republic P-47 Thunderbolt"
      width={size}
      height={typeof size === "number" ? size * 0.43 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function LiberatorSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_liberator.png")}
      alt="Consolidated B-24 Liberator"
      width={size}
      height={typeof size === "number" ? size * 0.43 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function TexanSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_texan.png")}
      alt="North American T-6 Texan"
      width={size}
      height={typeof size === "number" ? size * 0.43 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function BlenheimSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_blenheim.png")}
      alt="Bristol Blenheim"
      width={size}
      height={typeof size === "number" ? size * 0.43 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export function ShootingStarSvg({ size = 32, className, style }: AircraftIconProps) {
  return (
    <img
      src={getIconPath("/icons/model_shootingstar.png")}
      alt="Lockheed P-80 / F-80 Shooting Star"
      width={size}
      height={typeof size === "number" ? size * 0.43 : size}
      className={className}
      style={{
        display: "inline-block",
        objectFit: "contain",
        filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))",
        ...style,
      }}
    />
  );
}

export {
  F22RaptorTopDownSvg,
  BoeingPassengerTopDownSvg,
  AirbusA380TopDownSvg,
  T38TalonTopDownSvg,
  VtolElectricTopDownSvg,
  AgriDusterTopDownSvg,
  ExecBizjetTopDownSvg,
  CargoPropTopDownSvg,
} from "./AircraftIconsSvg";

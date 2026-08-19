"use client";
import React from "react";

interface MapProps {
  opacity?: number;
  color?: string;
}

// 1. North America Imagen 3 Map Component
export function NorthAmericaMapSvg({ opacity = 0.45 }: MapProps) {
  return (
    <img
      src="/maps/north_america.png"
      alt="North America Map"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.1)",
        opacity,
        display: "block",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))",
        pointerEvents: "none",
      }}
    />
  );
}

// 1b. Entire Americas (Pan-America: North, Central, South America) Map Component
export function AmericasMapSvg({ opacity = 0.45 }: MapProps) {
  return (
    <img
      src="/maps/americas.png"
      alt="Americas Continent Map"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        transform: "scale(1.08)",
        opacity,
        display: "block",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))",
        pointerEvents: "none",
      }}
    />
  );
}


// 2. Europe Imagen 3 Map Component
export function EuropeMapSvg({ opacity = 0.45 }: MapProps) {
  return (
    <img
      src="/maps/europe.png"
      alt="Europe Map"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.1)",
        opacity,
        display: "block",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))",
        pointerEvents: "none",
      }}
    />
  );
}

// 3. Asia Imagen 3 Map Component
export function AsiaMapSvg({ opacity = 0.45 }: MapProps) {
  return (
    <img
      src="/maps/asia.png"
      alt="Asia Map"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.1)",
        opacity,
        display: "block",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))",
        pointerEvents: "none",
      }}
    />
  );
}

// 4. South America Imagen 3 Map Component
export function SouthAmericaMapSvg({ opacity = 0.45 }: MapProps) {
  return (
    <img
      src="/maps/south_america.png"
      alt="South America Map"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.1)",
        opacity,
        display: "block",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))",
        pointerEvents: "none",
      }}
    />
  );
}

export const LatinAmericaMapSvg = SouthAmericaMapSvg;

// 5. Oceania Imagen 3 Map Component
export function OceaniaMapSvg({ opacity = 0.45 }: MapProps) {
  return (
    <img
      src="/maps/oceania.png"
      alt="Oceania Map"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.1)",
        opacity,
        display: "block",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))",
        pointerEvents: "none",
      }}
    />
  );
}

// 6. Africa Imagen 3 Map Component
export function AfricaMapSvg({ opacity = 0.45 }: MapProps) {
  return (
    <img
      src="/maps/africa.png"
      alt="Africa Map"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.1)",
        opacity,
        display: "block",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))",
        pointerEvents: "none",
      }}
    />
  );
}

// 7. Oceans & Other World Imagen 3 Map Component
export function OceansMapSvg({ opacity = 0.45 }: MapProps) {
  return (
    <img
      src="/maps/oceans.png"
      alt="Oceans & World Map"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.1)",
        opacity,
        display: "block",
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))",
        pointerEvents: "none",
      }}
    />
  );
}

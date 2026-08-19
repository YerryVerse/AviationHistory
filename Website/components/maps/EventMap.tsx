"use client";

import { useComputedColorScheme } from "@mantine/core";
import { useEffect, useMemo, useRef } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";


interface MapPoint { latitude: number; longitude: number; events: number }

export default function EventMap({ points, label = "Geographic event concentrations" }: { points: MapPoint[]; label?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const scheme = useComputedColorScheme("light");
  const geojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(() => ({
    type: "FeatureCollection",
    features: points.map((point) => ({ type: "Feature", properties: { events: point.events }, geometry: { type: "Point", coordinates: [point.longitude, point.latitude] } })),
  }), [points]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.clientWidth === 0) return;
    let active = true;
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (!active || !containerRef.current) return;
      const tileUrl = scheme === "dark"
        ? "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            "carto-basemap": {
              type: "raster",
              tiles: [tileUrl],
              tileSize: 256,
              attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>"
            }
          },
          layers: [
            {
              id: "carto-basemap-layer",
              type: "raster",
              source: "carto-basemap",
              minzoom: 0,
              maxzoom: 20
            }
          ]
        },
        center: [0, 20], zoom: .45,
      });
      mapRef.current = map;
      map.on("load", () => {
        map.addSource("events", { type: "geojson", data: geojson });
        map.addLayer({ id: "event-points", type: "circle", source: "events", paint: { "circle-color": "#168b83", "circle-opacity": .72, "circle-stroke-color": scheme === "dark" ? "#b9eee9" : "#ffffff", "circle-stroke-width": 1, "circle-radius": ["interpolate", ["linear"], ["get", "events"], 1, 3, 100, 8, 1000, 16] } });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      });
    });
    return () => { active = false; mapRef.current?.remove(); mapRef.current = null; };
  }, [geojson, scheme]);

  useEffect(() => {
    const source = mapRef.current?.getSource("events") as GeoJSONSource | undefined;
    source?.setData(geojson);
  }, [geojson]);

  return <div ref={containerRef} className="map-canvas" role="img" aria-label={label} />;
}

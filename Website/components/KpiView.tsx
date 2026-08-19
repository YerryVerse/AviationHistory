"use client";

import { Button, Card, Flex, Group, Paper, RingProgress, Skeleton, Stack, Text, Title, Tooltip } from "@mantine/core";
import { Activity, Briefcase, Calendar, CheckCircle2, Clock, Compass, Cpu, Crosshair, Database, Flame, Globe, GraduationCap, Layers, MapPin, Package, Plane, PlaneLanding, PlaneTakeoff, Radar, RotateCcw, ShieldAlert, ShieldCheck, Skull, Sparkles, Sprout, Tag, TrendingUp, UserCheck, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AccidentCrashSvg, AirbusA380Svg, AirbusA380TopDownSvg, AgriDusterTopDownSvg, AirportGroundRampSvg, BlenheimSvg, Boeing747Svg, Boeing777EnRouteSvg, Boeing777LandingSvg, Boeing777TakeoffSvg, BoeingPassengerTopDownSvg, BonanzaSvg, CargoPropTopDownSvg, CenturionSvg, Cessna150Svg, CessnaSvg, CherokeeSvg, CorsairSvg, Dc3Svg, DestroyedTopDownSvg, ExecBizjetTopDownSvg, F16FalconSvg, F22RaptorSideSvg, F22RaptorTopDownSvg, GhostPlaneTopDownSvg, GliderModelSvg, GliderSvg, HelicopterSvg, IncidentSmokeSvg, InterwarPlaneSvg, JetSvg, LiberatorSvg, MilitaryShotdownSvg, MinorTopDownSvg, MosquitoSvg, P51MustangSvg, ShootingStarSvg, SkyhawkSvg, SkylaneSvg, SpitfireSvg, StationairSvg, SubstantialTopDownSvg, SuperCubSvg, T38TalonTopDownSvg, TexanSvg, ThunderboltSvg, VtolElectricTopDownSvg, WrightFlyerSvg, Ww1BiplaneSvg } from "./AircraftIcons";
import { FranceMapSvg, GermanyMapSvg, UKMapSvg, USAMapSvg, WorldMapSvg } from "./CountryMaps";
import { AfricaMapSvg, AmericasMapSvg, AsiaMapSvg, EuropeMapSvg, LatinAmericaMapSvg, NorthAmericaMapSvg, OceaniaMapSvg, OceansMapSvg } from "./ContinentMaps";
import { AirplaneSeatSvg, HousePlaneCrashSvg, OccupantsFamilySvg } from "./SeverityIcons";
import { CountryFlagSvg } from "./FlagIcons";
import { KpiWindowCard } from "./KpiWindowCard";
import { fetchQualityReport } from "@/lib/staticData/quality";
import type { QualityReport } from "@/lib/staticData/types";

const FATALITY_COLOR = "#900000";
const SURVIVOR_COLOR = "#005020";

const ALL_CARD_IDS = ["kpi-1-quality", "kpi-2-occurrence", "kpi-12-confidence", "kpi-3-timeline", "kpi-field-8-event_month", "kpi-field-9-event_day", "kpi-field-10-event_weekday", "kpi-field-11-local_time", "kpi-6-propulsion", "kpi-field-13-aircraft_designation", "kpi-11-manufacturer", "kpi-field-18-aircraft_common_name", "kpi-field-18-civil_model", "kpi-field-18-military_model", "kpi-10-operator", "kpi-field-22-year_of_manufacture", "kpi-field-24-cycles", "kpi-field-25-total_airframe_hrs", "kpi-9-damage", "kpi-4-severity", "kpi-field-35-fatality_rate_onboard", "kpi-5-geography", "kpi-field-38-continent", "kpi-13-region", "kpi-7-phase", "kpi-field-42-phase", "kpi-8-nature", "kpi-field-45-departure_airport", "kpi-field-47-destination_airport", "kpi-field-51-investigating_agency", "kpi-field-52-accident_investigation_duration", "kpi-field-53-accident_investigation_report", "kpi-field-55-accident_investigation_status"];

export default function KpiView() {
  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Window State Controls for KPI Cards
  const [hiddenCardIds, setHiddenCardIds] = useState<Set<string>>(new Set());
  const [minimizedCardIds, setMinimizedCardIds] = useState<Set<string>>(
    () => new Set(ALL_CARD_IDS)
  );
  const [maximizedCardId, setMaximizedCardId] = useState<string | null>(null);

  const handleMinimizeAll = () => {
    setMinimizedCardIds(new Set(ALL_CARD_IDS));
  };

  const handleExpandAll = () => {
    setMinimizedCardIds(new Set());
  };

  const handleHide = (id: string) => {
    if (maximizedCardId === id) {
      setMaximizedCardId(null);
      return;
    }
    setHiddenCardIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleRestoreAll = () => {
    setHiddenCardIds(new Set());
  };

  const handleToggleMinimize = (id: string) => {
    if (maximizedCardId === id) {
      setMaximizedCardId(null);
    }
    setMinimizedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleMaximize = (id: string) => {
    setMaximizedCardId((prev) => {
      const isCurrentlyMax = prev === id;
      if (!isCurrentlyMax) {
        setMinimizedCardIds((prevMin) => {
          const next = new Set(prevMin);
          next.delete(id);
          return next;
        });
        return id;
      }
      return null;
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchQualityReport(process.env.NEXT_PUBLIC_BASE_PATH ?? "", controller.signal)
      .then((data) => setReport(data))
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Handle ESC key press to restore maximized KPI card to normal size
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && maximizedCardId !== null) {
        setMaximizedCardId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [maximizedCardId]);

  const kpi1Data = useMemo(() => {
    if (!report) return { totalRows: 396753, avgQuality: 100, fieldCount: 57 };
    const totalCols = report.columns.length;
    const avgQuality = report.columns.reduce((sum, c) => sum + c.qualityPercent, 0) / (totalCols || 1);
    return {
      totalRows: report.totalRows,
      avgQuality,
      fieldCount: totalCols,
    };
  }, [report]);

  // Field #1 KPI Data: asn_id
  const kpiField1Data = useMemo(() => {
    return {
      field: "asn_id",
      label: "Asn Id",
      dataType: "integer",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 396753,
      topValue: "1000",
      topCount: 1,
    };
  }, []);

  // Field #2 KPI Data: title
  const kpiField2Data = useMemo(() => {
    return {
      field: "title",
      label: "Title",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 392042,
      topValue: "Accident Junkers Ju-52/3m , Friday 10 May 1940",
      topCount: 148,
    };
  }, []);



  // Field #7 KPI Data: event_year
  const kpiField7Data = useMemo(() => {
    return {
      field: "event_year",
      label: "Event Year",
      dataType: "integer",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 125,
      topValue: "1944",
      topCount: 23029,
    };
  }, []);

  // Field #8 KPI Data: event_month
  const kpiField8Data = useMemo(() => {
    return {
      field: "event_month",
      label: "Month",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 13,
      topValue: "7",
      topCount: 41002,
      months: [
        { name: "July", num: "7", label: "July", pct: "10.3%", count: 41002, bg: "#e8590c" },
        { name: "August", num: "8", label: "August", pct: "9.9%", count: 39312, bg: "#f59f00" },
        { name: "June", num: "6", label: "June", pct: "9.8%", count: 39010, bg: "#fd7e14" },
        { name: "May", num: "5", label: "May", pct: "9.6%", count: 38256, bg: "#0ca678" },
        { name: "September", num: "9", label: "September", pct: "8.9%", count: 35342, bg: "#1c7ed6" },
        { name: "April", num: "4", label: "April", pct: "8.3%", count: 32870, bg: "#37b24d" },
        { name: "March", num: "3", label: "March", pct: "8.1%", count: 32078, bg: "#748ffc" },
        { name: "October", num: "10", label: "October", pct: "7.7%", count: 30402, bg: "#ae3ec9" },
        { name: "January", num: "1", label: "January", pct: "7.0%", count: 27680, bg: "#4263eb" },
        { name: "February", num: "2", label: "February", pct: "6.8%", count: 27116, bg: "#4c6ef5" },
        { name: "November", num: "11", label: "November", pct: "6.6%", count: 26203, bg: "#7950f2" },
        { name: "December", num: "12", label: "December", pct: "6.3%", count: 24935, bg: "#15aabf" },
        { name: "Not Recorded", num: "N/R", label: "Not Recorded", pct: "0.6%", count: 2547, bg: "#495057" },
      ],
    };
  }, []);

  // Field #9 KPI Data: event_day
  const kpiField9Data = useMemo(() => {
    return {
      field: "event_day",
      label: "Day",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 32,
      topValue: "1",
      topCount: 13653,
      days: [
        { day: "1", label: "1st", pct: "3.4%", count: 13653, bg: "#0ca678" },
        { day: "17", label: "17th", pct: "3.4%", count: 13415, bg: "#1c7ed6" },
        { day: "10", label: "10th", pct: "3.4%", count: 13307, bg: "#e8590c" },
        { day: "18", label: "18th", pct: "3.4%", count: 13293, bg: "#37b24d" },
        { day: "15", label: "15th", pct: "3.3%", count: 13176, bg: "#7950f2" },
        { day: "16", label: "16th", pct: "3.3%", count: 13122, bg: "#f59f00" },
        { day: "23", label: "23rd", pct: "3.3%", count: 13082, bg: "#d6336c" },
        { day: "6", label: "6th", pct: "3.3%", count: 13072, bg: "#1098ad" },
        { day: "4", label: "4th", pct: "3.3%", count: 13009, bg: "#748ffc" },
        { day: "19", label: "19th", pct: "3.3%", count: 13007, bg: "#ae3ec9" },
        { day: "12", label: "12th", pct: "3.3%", count: 12993, bg: "#4263eb" },
        { day: "24", label: "24th", pct: "3.3%", count: 12967, bg: "#0ca678" },
        { day: "21", label: "21st", pct: "3.3%", count: 12964, bg: "#1c7ed6" },
        { day: "27", label: "27th", pct: "3.3%", count: 12947, bg: "#e8590c" },
        { day: "20", label: "20th", pct: "3.3%", count: 12946, bg: "#37b24d" },
        { day: "8", label: "8th", pct: "3.3%", count: 12914, bg: "#7950f2" },
        { day: "7", label: "7th", pct: "3.3%", count: 12910, bg: "#f59f00" },
        { day: "22", label: "22nd", pct: "3.3%", count: 12904, bg: "#d6336c" },
        { day: "5", label: "5th", pct: "3.3%", count: 12877, bg: "#1098ad" },
        { day: "14", label: "14th", pct: "3.2%", count: 12864, bg: "#748ffc" },
        { day: "11", label: "11th", pct: "3.2%", count: 12861, bg: "#ae3ec9" },
        { day: "13", label: "13th", pct: "3.2%", count: 12847, bg: "#4263eb" },
        { day: "26", label: "26th", pct: "3.2%", count: 12846, bg: "#0ca678" },
        { day: "9", label: "9th", pct: "3.2%", count: 12678, bg: "#1c7ed6" },
        { day: "2", label: "2nd", pct: "3.2%", count: 12674, bg: "#e8590c" },
        { day: "28", label: "28th", pct: "3.2%", count: 12659, bg: "#37b24d" },
        { day: "25", label: "25th", pct: "3.2%", count: 12562, bg: "#7950f2" },
        { day: "3", label: "3rd", pct: "3.2%", count: 12538, bg: "#f59f00" },
        { day: "29", label: "29th", pct: "3.0%", count: 12067, bg: "#d6336c" },
        { day: "30", label: "30th", pct: "3.0%", count: 11755, bg: "#1098ad" },
        { day: "31", label: "31st", pct: "1.8%", count: 7297, bg: "#748ffc" },
        { day: "N/R", label: "Not Recorded", pct: "0.6%", count: 2547, bg: "#495057" },
      ],
    };
  }, []);

  // Field #10 KPI Data: event_weekday
  const kpiField10Data = useMemo(() => {
    return {
      field: "event_weekday",
      label: "Weekday",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 8,
      topValue: "Saturday",
      topCount: 60692,
      weekdays: [
        { name: "Saturday", label: "Saturday", pct: "15.3%", count: 60692, bg: "#748ffc" },
        { name: "Friday", label: "Friday", pct: "14.7%", count: 58377, bg: "#1c7ed6" },
        { name: "Sunday", label: "Sunday", pct: "14.4%", count: 57019, bg: "#0ca678" },
        { name: "Thursday", label: "Thursday", pct: "14.3%", count: 56584, bg: "#fd7e14" },
        { name: "Wednesday", label: "Wednesday", pct: "13.8%", count: 54870, bg: "#ae3ec9" },
        { name: "Tuesday", label: "Tuesday", pct: "13.7%", count: 54414, bg: "#37b24d" },
        { name: "Monday", label: "Monday", pct: "13.2%", count: 52250, bg: "#4263eb" },
        { name: "Not Recorded", label: "Not Recorded", pct: "0.6%", count: 2547, bg: "#495057" },
      ],
    };
  }, []);

  // Field #11 KPI Data: local_time
  const kpiField11Data = useMemo(() => {
    return {
      field: "local_time",
      label: "Local Time",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 5050,
      topValue: "Not Recorded",
      topCount: 151569,
      times: [
        { name: "Not Recorded", label: "Not Recorded", pct: "38.2%", count: 151569, bg: "#495057" },
        { name: "Afternoon (12:00–17:59)", label: "Afternoon", pct: "25.8%", count: 102266, bg: "#f59f00" },
        { name: "Morning (06:00–11:59)", label: "Morning", pct: "16.3%", count: 64569, bg: "#37b24d" },
        { name: "Evening (18:00–21:59)", label: "Evening", pct: "9.2%", count: 36345, bg: "#1c7ed6" },
        { name: "Night (22:00–05:59)", label: "Night", pct: "5.0%", count: 19813, bg: "#7950f2" },
        { name: "Day (Unspecified)", label: "Day (General)", pct: "4.0%", count: 15836, bg: "#0ca678" },
        { name: "Night (Unspecified)", label: "Night (General)", pct: "1.4%", count: 5409, bg: "#ae3ec9" },
        { name: "Other Times", label: "Other", pct: "0.2%", count: 946, bg: "#868e96" },
      ],
    };
  }, []);

  // Field #13 KPI Data: aircraft_designation
  const kpiField13Data = useMemo(() => {
    return {
      field: "aircraft_designation",
      label: "Designation",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 2,
      topValue: "Civil",
      topCount: 255526,
      designations: [
        { name: "Civil", label: "Civil", pct: "64.4%", count: 255526, bg: "#f59f00", deaths: "213,236", deathRate: "11.8%", survivors: "1,597,906", survivorRate: "88.2%" },
        { name: "Military", label: "Military", pct: "35.6%", count: 141227, bg: "#1c7ed6", deaths: "186,544", deathRate: "42.7%", survivors: "250,194", survivorRate: "57.3%" },
      ],
    };
  }, []);

  // Field #15 KPI Data: aircraft_name
  const kpiField15Data = useMemo(() => {
    return {
      field: "aircraft_name",
      label: "Aircraft Name",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 12456,
      topValue: "172",
      topCount: 10615,
      aircraftNames: [
        { name: "Other Aircraft Names", label: "Other", pct: "85.5%", count: 339306, bg: "#1c7ed6" },
        { name: "172", label: "172", pct: "2.7%", count: 10615, bg: "#f59f00" },
        { name: "PA-28", label: "PA-28", pct: "2.5%", count: 9741, bg: "#37b24d" },
        { name: "150", label: "150", pct: "1.4%", count: 5529, bg: "#7950f2" },
        { name: "DH-98", label: "DH-98", pct: "1.3%", count: 5068, bg: "#ae3ec9" },
        { name: "182", label: "182", pct: "1.2%", count: 4745, bg: "#d6336c" },
        { name: "737", label: "737", pct: "1.1%", count: 4285, bg: "#1098ad" },
        { name: "F4U", label: "F4U", pct: "1.1%", count: 4180, bg: "#748ffc" },
        { name: "C-47", label: "C-47", pct: "0.9%", count: 3586, bg: "#4263eb" },
        { name: "Spitfire", label: "Spitfire", pct: "0.9%", count: 3586, bg: "#e8590c" },
        { name: "PA-18", label: "PA-18", pct: "0.9%", count: 3440, bg: "#0ca678" },
        { name: "Not Recorded", label: "Not Recorded", pct: "0.7%", count: 2672, bg: "#495057" },
      ],
    };
  }, []);

  // Field #16 KPI Data: aircraft_model
  const kpiField16Data = useMemo(() => {
    return {
      field: "aircraft_model",
      label: "Model",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 25405,
      topValue: "DH.98",
      topCount: 5057,
      models: [
        { name: "Other Models", label: "Other", pct: "92.8%", count: 368356, bg: "#7950f2" },
        { name: "DH.98", label: "DH.98", pct: "1.3%", count: 5057, bg: "#1c7ed6" },
        { name: "Aircraft", label: "Aircraft", pct: "1.2%", count: 4949, bg: "#f59f00" },
        { name: "152", label: "152", pct: "0.8%", count: 3199, bg: "#37b24d" },
        { name: "Blenheim", label: "Blenheim", pct: "0.7%", count: 2580, bg: "#ae3ec9" },
        { name: "Beaufighter", label: "Beaufighter", pct: "0.6%", count: 2517, bg: "#d6336c" },
        { name: "PA-28-140", label: "PA-28-140", pct: "0.6%", count: 2415, bg: "#1098ad" },
        { name: "R22", label: "R22", pct: "0.5%", count: 2120, bg: "#748ffc" },
        { name: "172N", label: "172N", pct: "0.5%", count: 2015, bg: "#4263eb" },
        { name: "P-47D", label: "P-47D", pct: "0.5%", count: 1862, bg: "#e8590c" },
        { name: "R44", label: "R44", pct: "0.4%", count: 1677, bg: "#0ca678" },
        { name: "Not Recorded", label: "Not Recorded", pct: "0.0%", count: 6, bg: "#495057" },
      ],
    };
  }, []);

  // Field #17 KPI Data: aircraft_variant
  const kpiField17Data = useMemo(() => {
    return {
      field: "aircraft_variant",
      label: "Variant",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 7407,
      topValue: "Not Recorded",
      topCount: 144445,
      variants: [
        { name: "Other Variants", label: "Other", pct: "39.0%", count: 154724, bg: "#d6336c" },
        { name: "Not Recorded", label: "Not Recorded", pct: "36.7%", count: 145662, bg: "#495057" },
        { name: "A", label: "A", pct: "5.9%", count: 23497, bg: "#1c7ed6" },
        { name: "B", label: "B", pct: "4.6%", count: 18103, bg: "#f59f00" },
        { name: "C", label: "C", pct: "2.9%", count: 11377, bg: "#37b24d" },
        { name: "D", label: "D", pct: "2.8%", count: 11106, bg: "#7950f2" },
        { name: "G", label: "G", pct: "2.1%", count: 8299, bg: "#ae3ec9" },
        { name: "F", label: "F", pct: "1.8%", count: 7002, bg: "#1098ad" },
        { name: "E", label: "E", pct: "1.7%", count: 6564, bg: "#748ffc" },
        { name: "M", label: "M", pct: "1.3%", count: 5273, bg: "#4263eb" },
        { name: "N", label: "N", pct: "1.3%", count: 5146, bg: "#0ca678" },
      ],
    };
  }, []);

  // Field #18 KPI Data: aircraft_common_name
  const kpiField18Data = useMemo(() => {
    return {
      field: "aircraft_common_name",
      label: "Aircraft Model",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 21011,
      topValue: "Skyhawk",
      topCount: 11830,
      commonModels: [
        { name: "Other Common Models", label: "Other", pct: "85.1%", count: 337653, bg: "#37b24d", deaths: "348,349", deathRate: "16.4%", survivors: "1,774,271", survivorRate: "83.6%", Icon: BoeingPassengerTopDownSvg },
        { name: "Skyhawk", label: "Skyhawk", pct: "3.0%", count: 11830, bg: "#1c7ed6", deaths: "6,503", deathRate: "28.2%", survivors: "16,531", survivorRate: "71.8%", Icon: SkyhawkSvg },
        { name: "Cherokee", label: "Cherokee", pct: "2.5%", count: 9785, bg: "#f59f00", deaths: "6,311", deathRate: "31.3%", survivors: "13,844", survivorRate: "68.7%", Icon: CherokeeSvg },
        { name: "Cessna 150", label: "Cessna 150", pct: "1.4%", count: 5530, bg: "#7950f2", deaths: "1,940", deathRate: "24.5%", survivors: "5,967", survivorRate: "75.5%", Icon: Cessna150Svg },
        { name: "Skylane", label: "Skylane", pct: "1.4%", count: 5404, bg: "#ae3ec9", deaths: "3,132", deathRate: "28.3%", survivors: "7,919", survivorRate: "71.7%", Icon: SkylaneSvg },
        { name: "Mosquito", label: "Mosquito", pct: "1.3%", count: 5072, bg: "#d6336c", deaths: "3,261", deathRate: "32.1%", survivors: "6,894", survivorRate: "67.9%", Icon: MosquitoSvg },
        { name: "Corsair", label: "Corsair", pct: "1.1%", count: 4272, bg: "#1098ad", deaths: "1,185", deathRate: "65.2%", survivors: "633", survivorRate: "34.8%", Icon: CorsairSvg },
        { name: "Bonanza", label: "Bonanza", pct: "1.1%", count: 4257, bg: "#748ffc", deaths: "4,409", deathRate: "47.1%", survivors: "4,956", survivorRate: "52.9%", Icon: BonanzaSvg },
        { name: "DC-3", label: "DC-3", pct: "1.1%", count: 4168, bg: "#4263eb", deaths: "14,086", deathRate: "55.5%", survivors: "11,275", survivorRate: "44.5%", Icon: Dc3Svg },
        { name: "Glider", label: "Glider", pct: "1.0%", count: 3936, bg: "#e8590c", deaths: "1,238", deathRate: "34.4%", survivors: "2,360", survivorRate: "65.6%", Icon: GliderModelSvg },
        { name: "Super Cub", label: "Super Cub", pct: "0.9%", count: 3629, bg: "#0ca678", deaths: "1,223", deathRate: "26.0%", survivors: "3,471", survivorRate: "74.0%", Icon: SuperCubSvg },
        { name: "Not Recorded", label: "Not Recorded", pct: "0.3%", count: 1217, bg: "#495057", deaths: "1,043", deathRate: "51.6%", survivors: "979", survivorRate: "48.4%", Icon: null },
      ],
    };
  }, []);

  // Civil Model KPI Data (Filtered aircraft_designation = 'Civil', strictly exact unrounded DB metrics, no Other / Not Recorded)
  const kpiCivilModelData = useMemo(() => {
    return {
      field: "civil_aircraft_model",
      label: "Civil Model",
      dataType: "string",
      totalRows: 255526,
      validRows: 255526,
      nullCount: 0,
      uniqueCount: 14820,
      topValue: "Skyhawk",
      topCount: 11510,
      models: [
        { name: "Skyhawk", label: "Skyhawk", pct: "4.5%", count: 11510, bg: "#1c7ed6", deaths: "4,897", deathRate: "23.0%", survivors: "16,399", survivorRate: "77.0%", Icon: SkyhawkSvg },
        { name: "Cherokee", label: "Cherokee", pct: "3.8%", count: 9785, bg: "#f59f00", deaths: "6,311", deathRate: "31.3%", survivors: "13,844", survivorRate: "68.7%", Icon: CherokeeSvg },
        { name: "Cessna 150", label: "Cessna 150", pct: "2.2%", count: 5530, bg: "#7950f2", deaths: "1,940", deathRate: "24.5%", survivors: "5,967", survivorRate: "75.5%", Icon: Cessna150Svg },
        { name: "Skylane", label: "Skylane", pct: "2.1%", count: 5403, bg: "#ae3ec9", deaths: "3,132", deathRate: "28.3%", survivors: "7,916", survivorRate: "71.7%", Icon: SkylaneSvg },
        { name: "Bonanza", label: "Bonanza", pct: "1.7%", count: 4257, bg: "#748ffc", deaths: "4,409", deathRate: "47.1%", survivors: "4,956", survivorRate: "52.9%", Icon: BonanzaSvg },
        { name: "Glider", label: "Glider", pct: "1.5%", count: 3923, bg: "#e8590c", deaths: "1,235", deathRate: "34.4%", survivors: "2,356", survivorRate: "65.6%", Icon: GliderModelSvg },
        { name: "Super Cub", label: "Super Cub", pct: "1.4%", count: 3628, bg: "#0ca678", deaths: "1,222", deathRate: "26.0%", survivors: "3,471", survivorRate: "74.0%", Icon: SuperCubSvg },
        { name: "Cessna 152", label: "Cessna 152", pct: "1.3%", count: 3355, bg: "#1098ad", deaths: "655", deathRate: "14.8%", survivors: "3,775", survivorRate: "85.2%", Icon: Cessna150Svg },
        { name: "Centurion", label: "Centurion", pct: "1.3%", count: 3314, bg: "#20c997", deaths: "2,001", deathRate: "28.9%", survivors: "4,930", survivorRate: "71.1%", Icon: CenturionSvg },
        { name: "Stationair", label: "Stationair", pct: "0.9%", count: 2305, bg: "#339af0", deaths: "1,795", deathRate: "31.5%", survivors: "3,895", survivorRate: "68.5%", Icon: StationairSvg },
      ],
    };
  }, []);

  // Military Model KPI Data (Filtered aircraft_designation = 'Military', strictly exact unrounded DB metrics, no Other / Not Recorded)
  const kpiMilitaryModelData = useMemo(() => {
    return {
      field: "military_aircraft_model",
      label: "Military Model",
      dataType: "string",
      totalRows: 141227,
      validRows: 141227,
      nullCount: 0,
      uniqueCount: 6812,
      topValue: "Mosquito",
      topCount: 5072,
      models: [
        { name: "Mosquito", label: "Mosquito", pct: "3.6%", count: 5072, bg: "#d6336c", deaths: "3,261", deathRate: "32.1%", survivors: "6,894", survivorRate: "67.9%", Icon: MosquitoSvg },
        { name: "Corsair", label: "Corsair", pct: "3.0%", count: 4271, bg: "#1098ad", deaths: "1,183", deathRate: "65.1%", survivors: "633", survivorRate: "34.9%", Icon: CorsairSvg },
        { name: "DC-3", label: "DC-3", pct: "2.7%", count: 3767, bg: "#4263eb", deaths: "12,637", deathRate: "58.6%", survivors: "8,911", survivorRate: "41.4%", Icon: Dc3Svg },
        { name: "Spitfire", label: "Spitfire", pct: "2.5%", count: 3581, bg: "#748ffc", deaths: "1,512", deathRate: "41.9%", survivors: "2,095", survivorRate: "58.1%", Icon: SpitfireSvg },
        { name: "Mustang", label: "Mustang", pct: "2.5%", count: 3475, bg: "#f59f00", deaths: "1,099", deathRate: "57.0%", survivors: "829", survivorRate: "43.0%", Icon: P51MustangSvg },
        { name: "Thunderbolt", label: "Thunderbolt", pct: "2.1%", count: 3022, bg: "#e8590c", deaths: "481", deathRate: "55.8%", survivors: "381", survivorRate: "44.2%", Icon: ThunderboltSvg },
        { name: "Liberator", label: "Liberator", pct: "2.1%", count: 2918, bg: "#7950f2", deaths: "8,265", deathRate: "65.4%", survivors: "4,372", survivorRate: "34.6%", Icon: LiberatorSvg },
        { name: "Texan", label: "Texan", pct: "1.9%", count: 2687, bg: "#ae3ec9", deaths: "1,239", deathRate: "61.4%", survivors: "780", survivorRate: "38.6%", Icon: TexanSvg },
        { name: "Blenheim", label: "Blenheim", pct: "1.8%", count: 2584, bg: "#0ca678", deaths: "3,263", deathRate: "48.5%", survivors: "3,459", survivorRate: "51.5%", Icon: BlenheimSvg },
        { name: "Shooting Star", label: "Shooting Star", pct: "1.8%", count: 2578, bg: "#1c7ed6", deaths: "1,452", deathRate: "73.7%", survivors: "518", survivorRate: "26.3%", Icon: ShootingStarSvg },
      ],
    };
  }, []);

  // Field #20 KPI Data: registration
  const kpiField20Data = useMemo(() => {
    return {
      field: "registration",
      label: "Registration",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 315299,
      topValue: "Unregistered",
      topCount: 43870,
    };
  }, []);

  // Field #21 KPI Data: msn
  const kpiField21Data = useMemo(() => {
    return {
      field: "msn",
      label: "Msn",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 171089,
      topValue: "Not Recorded",
      topCount: 135734,
    };
  }, []);

  // Field #22 KPI Data: year_of_manufacture (Treemap Breakdown across Decades / Eras)
  const kpiField22Data = useMemo(() => {
    return {
      field: "year_of_manufacture",
      label: "Manufacture Year",
      dataType: "integer",
      totalRows: 396753,
      validRows: 117204,
      nullCount: 279549,
      uniqueCount: 111,
      topValue: "Not Recorded (0)",
      topCount: 279549,
      decades: [
        { name: "Not Recorded", label: "Not Recorded", pct: "70.5%", count: 279549, bg: "#495057", deaths: "238,186", deathRate: "34.9%", survivors: "443,670", survivorRate: "65.1%" },
        { name: "1970s", label: "1970s", pct: "7.4%", count: 29213, bg: "#1c7ed6", deaths: "34,534", deathRate: "18.3%", survivors: "153,895", survivorRate: "81.7%" },
        { name: "1960s", label: "1960s", pct: "5.1%", count: 20292, bg: "#f59f00", deaths: "33,600", deathRate: "31.0%", survivors: "74,887", survivorRate: "69.0%" },
        { name: "1980s", label: "1980s", pct: "3.8%", count: 14945, bg: "#7950f2", deaths: "24,137", deathRate: "12.5%", survivors: "169,234", survivorRate: "87.5%" },
        { name: "2000s", label: "2000s", pct: "3.3%", count: 13117, bg: "#1098ad", deaths: "7,020", deathRate: "2.1%", survivors: "331,480", survivorRate: "97.9%" },
        { name: "1990s", label: "1990s", pct: "2.8%", count: 10946, bg: "#ae3ec9", deaths: "12,426", deathRate: "3.8%", survivors: "314,887", survivorRate: "96.2%" },
        { name: "1940s", label: "1940s", pct: "2.6%", count: 10188, bg: "#d6336c", deaths: "27,658", deathRate: "50.9%", survivors: "26,653", survivorRate: "49.1%" },
        { name: "2010s", label: "2010s", pct: "2.1%", count: 8269, bg: "#0ca678", deaths: "3,089", deathRate: "1.1%", survivors: "275,996", survivorRate: "98.9%" },
        { name: "1950s", label: "1950s", pct: "2.0%", count: 8132, bg: "#e8590c", deaths: "16,684", deathRate: "40.4%", survivors: "24,656", survivorRate: "59.6%" },
        { name: "2020s", label: "2020s", pct: "0.3%", count: 1220, bg: "#4263eb", deaths: "211", deathRate: "0.7%", survivors: "30,348", survivorRate: "99.3%" },
        { name: "1900–1939", label: "1900–1939", pct: "0.2%", count: 882, bg: "#748ffc", deaths: "2,235", deathRate: "48.3%", survivors: "2,394", survivorRate: "51.7%" },
      ],
    };
  }, []);

  // Field #24 KPI Data: cycles (Treemap Breakdown across Flight Cycle Ranges)
  const kpiField24Data = useMemo(() => {
    return {
      field: "cycles",
      label: "Airframe Cycles",
      dataType: "string",
      totalRows: 396753,
      validRows: 1903,
      nullCount: 394850,
      uniqueCount: 1829,
      topValue: "Not Recorded",
      topCount: 394850,
      cycleBins: [
        { name: "Not Recorded", label: "Not Recorded", pct: "99.5%", count: 394850, bg: "#495057", deaths: "360,873", deathRate: "16.9%", survivors: "1,779,772", survivorRate: "83.1%" },
        { name: "10k–20k", label: "10k–20k", pct: "0.12%", count: 462, bg: "#1c7ed6", deaths: "12,609", deathRate: "38.1%", survivors: "20,500", survivorRate: "61.9%" },
        { name: "1k–5k", label: "1k–5k", pct: "0.10%", count: 382, bg: "#f59f00", deaths: "6,552", deathRate: "33.9%", survivors: "12,776", survivorRate: "66.1%" },
        { name: "5k–10k", label: "5k–10k", pct: "0.09%", count: 358, bg: "#7950f2", deaths: "8,646", deathRate: "46.2%", survivors: "10,079", survivorRate: "53.8%" },
        { name: "20k–30k", label: "20k–30k", pct: "0.06%", count: 240, bg: "#1098ad", deaths: "2,981", deathRate: "21.6%", survivors: "10,813", survivorRate: "78.4%" },
        { name: "30k–50k", label: "30k–50k", pct: "0.05%", count: 212, bg: "#ae3ec9", deaths: "3,505", deathRate: "33.4%", survivors: "7,004", survivorRate: "66.6%" },
        { name: "< 1k", label: "< 1k", pct: "0.04%", count: 160, bg: "#d6336c", deaths: "3,349", deathRate: "44.1%", survivors: "4,247", survivorRate: "55.9%" },
        { name: "50k–75k", label: "50k–75k", pct: "0.02%", count: 65, bg: "#0ca678", deaths: "941", deathRate: "29.4%", survivors: "2,265", survivorRate: "70.6%" },
        { name: "75k+", label: "75k+", pct: "0.01%", count: 24, bg: "#e8590c", deaths: "324", deathRate: "33.5%", survivors: "644", survivorRate: "66.5%" },
      ],
    };
  }, []);

  // Field #25 KPI Data: total_airframe_hrs (Treemap Breakdown across Flight Hours Ranges)
  const kpiField25Data = useMemo(() => {
    return {
      field: "total_airframe_hrs",
      label: "Flight Hours",
      dataType: "string",
      totalRows: 396753,
      validRows: 70051,
      nullCount: 326785,
      uniqueCount: 15385,
      topValue: "Not Recorded",
      topCount: 326702,
      hourBins: [
        { name: "Not Recorded", label: "Not Recorded", pct: "82.4%", count: 326785, bg: "#495057", deaths: "316,624", deathRate: "17.6%", survivors: "1,485,014", survivorRate: "82.4%" },
        { name: "2k–5k hrs", label: "2k–5k", pct: "6.7%", count: 26458, bg: "#1c7ed6", deaths: "15,467", deathRate: "20.8%", survivors: "58,920", survivorRate: "79.2%" },
        { name: "500–2k hrs", label: "500–2k", pct: "3.7%", count: 14554, bg: "#f59f00", deaths: "10,188", deathRate: "23.1%", survivors: "33,992", survivorRate: "76.9%" },
        { name: "5k–10k hrs", label: "5k–10k", pct: "3.1%", count: 12333, bg: "#7950f2", deaths: "10,392", deathRate: "19.1%", survivors: "44,054", survivorRate: "80.9%" },
        { name: "< 500 hrs", label: "< 500", pct: "2.3%", count: 9316, bg: "#1098ad", deaths: "5,204", deathRate: "24.2%", survivors: "16,299", survivorRate: "75.8%" },
        { name: "10k–20k hrs", label: "10k–20k", pct: "1.1%", count: 4329, bg: "#ae3ec9", deaths: "14,314", deathRate: "23.7%", survivors: "46,195", survivorRate: "76.3%" },
        { name: "20k–40k hrs", label: "20k–40k", pct: "0.5%", count: 1839, bg: "#d6336c", deaths: "15,647", deathRate: "17.5%", survivors: "73,758", survivorRate: "82.5%" },
        { name: "40k–60k hrs", label: "40k–60k", pct: "0.2%", count: 769, bg: "#0ca678", deaths: "8,040", deathRate: "12.5%", survivors: "56,053", survivorRate: "87.5%" },
        { name: "60k+ hrs", label: "60k+", pct: "0.1%", count: 370, bg: "#e8590c", deaths: "3,904", deathRate: "10.4%", survivors: "33,815", survivorRate: "89.6%" },
      ],
    };
  }, []);


  // Field #28 KPI Data: history_of_this_aircraft
  const kpiField28Data = useMemo(() => {
    return {
      field: "history_of_this_aircraft",
      label: "History Of This Aircraft",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 34440,
      topValue: "Not Recorded",
      topCount: 362281,
    };
  }, []);


  // Field #33 KPI Data: fatalities_total
  const kpiField33Data = useMemo(() => {
    return {
      field: "fatalities_total",
      label: "Fatalities Total",
      dataType: "integer",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 206,
      topValue: "0",
      topCount: 278868,
    };
  }, []);

  // Field #35 KPI Data: fatality_rate_onboard (Treemap Breakdown across Fatality Rate Ranges)
  const kpiField35Data = useMemo(() => {
    return {
      field: "fatality_rate_onboard",
      label: "Onboard Fatality Percentage",
      dataType: "float",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 786,
      topValue: "0.0 (0%)",
      topCount: 281435,
      rateBins: [
        { name: "0%", label: "0%", pct: "70.9%", count: 281435, bg: "#2f9e44", deaths: "0", deathRate: "0.0%", survivors: "1,750,189", survivorRate: "100.0%" },
        { name: "100%", label: "100%", pct: "23.5%", count: 93349, bg: "#c92a2a", deaths: "287,244", deathRate: "100.0%", survivors: "0", survivorRate: "0.0%" },
        { name: "41%–55%", label: "41%–55%", pct: "2.2%", count: 8682, bg: "#f59f00", deaths: "14,588", deathRate: "48.9%", survivors: "15,225", survivorRate: "51.1%" },
        { name: "26%–40%", label: "26%–40%", pct: "0.8%", count: 3000, bg: "#7950f2", deaths: "6,654", deathRate: "33.7%", survivors: "13,068", survivorRate: "66.3%" },
        { name: "11%–25%", label: "11%–25%", pct: "0.7%", count: 2888, bg: "#1098ad", deaths: "4,768", deathRate: "18.4%", survivors: "21,203", survivorRate: "81.6%" },
        { name: "56%–70%", label: "56%–70%", pct: "0.7%", count: 2764, bg: "#ae3ec9", deaths: "12,200", deathRate: "63.3%", survivors: "7,065", survivorRate: "36.7%" },
        { name: "71%–85%", label: "71%–85%", pct: "0.6%", count: 2553, bg: "#d6336c", deaths: "17,251", deathRate: "77.5%", survivors: "5,002", survivorRate: "22.5%" },
        { name: "86%–99%", label: "86%–99%", pct: "0.3%", count: 1283, bg: "#e8590c", deaths: "23,891", deathRate: "91.9%", survivors: "2,102", survivorRate: "8.1%" },
        { name: "1%–10%", label: "1%–10%", pct: "0.2%", count: 799, bg: "#1c7ed6", deaths: "1,229", deathRate: "3.5%", survivors: "34,246", survivorRate: "96.5%" },
      ],
    };
  }, []);


  // Field #38 KPI Data: continent (Strictly Exact Unrounded DuckDB Metrics)
  const kpiField38Data = useMemo(() => {
    return {
      field: "continent",
      label: "Continent",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 9,
      topValue: "America",
      topCount: 196221,
      continents: [
        { name: "America", code: "AME", value: 49.5, count: 196221, color: "#3b5bdb", deaths: "133,782", deathRate: "15.2%", survivors: "744,885", survivorRate: "84.8%", MapSvg: AmericasMapSvg },
        { name: "Europe", code: "EUR", value: 30.4, count: 120804, color: "#1c7ed6", deaths: "129,636", deathRate: "19.7%", survivors: "527,617", survivorRate: "80.3%", MapSvg: EuropeMapSvg },
        { name: "Asia", code: "ASI", value: 8.8, count: 34727, color: "#0ca678", deaths: "61,763", deathRate: "14.2%", survivors: "374,255", survivorRate: "85.8%", MapSvg: AsiaMapSvg },
        { name: "Oceania", code: "OCE", value: 4.6, count: 18195, color: "#7950f2", deaths: "9,299", deathRate: "14.5%", survivors: "54,949", survivorRate: "85.5%", MapSvg: OceaniaMapSvg },
        { name: "Other & Oceans", code: "OTH", value: 3.5, count: 14025, color: "#495057", deaths: "11,817", deathRate: "14.7%", survivors: "68,384", survivorRate: "85.3%", MapSvg: OceansMapSvg },
        { name: "Africa", code: "AFR", value: 3.2, count: 12781, color: "#e8590c", deaths: "21,528", deathRate: "21.6%", survivors: "78,010", survivorRate: "78.4%", MapSvg: AfricaMapSvg },
      ],
    };
  }, []);

  // Field #40 KPI Data: gps_latitude
  const kpiField40Data = useMemo(() => {
    return {
      field: "gps_latitude",
      label: "Gps Latitude",
      dataType: "float",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 87659,
      topValue: "38.4876",
      topCount: 55574,
    };
  }, []);

  // Field #41 KPI Data: gps_longitude
  const kpiField41Data = useMemo(() => {
    return {
      field: "gps_longitude",
      label: "Gps Longitude",
      dataType: "float",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 88561,
      topValue: "-95.7129",
      topCount: 56823,
    };
  }, []);

  // Field #42 KPI Data: phase (Strictly Exact Unrounded DuckDB Metrics)
  const kpiField42Data = useMemo(() => {
    return {
      field: "phase",
      label: "Phase",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 16,
      phases: [
        { name: "En Route", fullLabel: "En Route / Cruise", value: 37.2, count: 147495, color: "#e8590c", deaths: "193,238", deathRate: "24.8%", survivors: "586,034", survivorRate: "75.2%" },
        { name: "Landing", fullLabel: "Landing / Rollout", value: 23.2, count: 92072, color: "#1c7ed6", deaths: "17,252", deathRate: "3.8%", survivors: "437,080", survivorRate: "96.2%" },
        { name: "Take Off", fullLabel: "Take Off / Ground Roll", value: 9.8, count: 38821, color: "#e03131", deaths: "30,495", deathRate: "11.6%", survivors: "232,356", survivorRate: "88.4%" },
        { name: "Combat", fullLabel: "Combat / Tactical", value: 7.0, count: 27877, color: "#d6336c", deaths: "45,766", deathRate: "64.3%", survivors: "25,366", survivorRate: "35.7%" },
        { name: "Approach", fullLabel: "Final Approach", value: 6.4, count: 25586, color: "#7950f2", deaths: "57,753", deathRate: "28.1%", survivors: "147,677", survivorRate: "71.9%" },
        { name: "Initial Climb", fullLabel: "Initial Climb", value: 5.0, count: 19892, color: "#1098ad", deaths: "26,986", deathRate: "14.9%", survivors: "154,565", survivorRate: "85.1%" },
        { name: "Manoeuvring", fullLabel: "Manoeuvring", value: 3.5, count: 13909, color: "#f59f00", deaths: "14,277", deathRate: "59.1%", survivors: "9,862", survivorRate: "40.9%" },
        { name: "Standing", fullLabel: "Standing / Parked", value: 3.1, count: 12476, color: "#495057", deaths: "6,470", deathRate: "7.7%", survivors: "77,426", survivorRate: "92.3%" },
        { name: "Taxi", fullLabel: "Taxi / Ramp", value: 2.0, count: 7762, color: "#0ca678", deaths: "1,355", deathRate: "1.0%", survivors: "131,024", survivorRate: "99.0%" },
        { name: "Other Phases", fullLabel: "Airshow, Towing & Other", value: 2.8, count: 10863, color: "#4263eb", deaths: "6,188", deathRate: "11.7%", survivors: "46,710", survivorRate: "88.3%" },
      ],
      otherPhasesSummary: {
        count: 64902,
        value: 16.4,
        deaths: "55,276",
        deathRate: "11.6%",
        survivors: "419,587",
        survivorRate: "88.4%",
      },
    };
  }, []);



  // Field #45 KPI Data: departure_airport (Strictly Exact Unrounded DuckDB Metrics)
  const kpiField45Data = useMemo(() => {
    return {
      field: "departure_airport",
      label: "Departure",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 72574,
      recordedEvents: 227620,
      unrecordedEvents: 169133,
      categories: [
        { name: "Regional & Bush", count: 101586, pct: "44.6%", color: "#0ca678", deaths: "84,092", deathRate: "28.1%", survivors: "215,524", survivorRate: "71.9%" },
        { name: "Civil & Commercial", count: 92350, pct: "40.5%", color: "#1c7ed6", deaths: "154,527", deathRate: "9.8%", survivors: "1,425,821", survivorRate: "90.2%" },
        { name: "Military & Defense", count: 33684, pct: "14.8%", color: "#d6336c", deaths: "63,156", deathRate: "57.6%", survivors: "46,514", survivorRate: "42.4%" },
      ],
      topAirports: [
        { name: "Anchorage Int'l", code: "ANC", full: "Ted Stevens Anchorage Int'l Airport", country: "United States", flag: "🇺🇸", count: 540, deaths: "813", deathRate: "21.7%", survivors: "2,936", survivorRate: "78.3%", color: "#1c7ed6" },
        { name: "Amsterdam Schiphol", code: "AMS", full: "Amsterdam Airport Schiphol", country: "Netherlands", flag: "🇳🇱", count: 521, deaths: "940", deathRate: "7.5%", survivors: "11,573", survivorRate: "92.5%", color: "#e8590c" },
        { name: "London Heathrow", code: "LHR", full: "London Heathrow Airport", country: "United Kingdom", flag: "🇬🇧", count: 413, deaths: "945", deathRate: "1.9%", survivors: "48,263", survivorRate: "98.1%", color: "#7950f2" },
        { name: "Gilze-Rijen Base", code: "GLZ", full: "Gilze-Rijen Air Base", country: "Netherlands", flag: "🇳🇱", count: 397, deaths: "385", deathRate: "43.8%", survivors: "494", survivorRate: "56.2%", color: "#d6336c" },
        { name: "Houston Hobby", code: "HOU", full: "William P. Hobby Airport", country: "United States", flag: "🇺🇸", count: 385, deaths: "267", deathRate: "11.2%", survivors: "2,108", survivorRate: "88.8%", color: "#0ca678" },
        { name: "Miami Int'l", code: "MIA", full: "Miami International Airport", country: "United States", flag: "🇺🇸", count: 370, deaths: "677", deathRate: "4.5%", survivors: "14,523", survivorRate: "95.5%", color: "#f59f00" },
        { name: "RAF Manston", code: "MSE", full: "RAF Station Manston", country: "United Kingdom", flag: "🇬🇧", count: 368, deaths: "280", deathRate: "46.7%", survivors: "319", survivorRate: "53.3%", color: "#495057" },
        { name: "Chicago O'Hare", code: "ORD", full: "O'Hare International Airport", country: "United States", flag: "🇺🇸", count: 338, deaths: "728", deathRate: "3.7%", survivors: "18,709", survivorRate: "96.3%", color: "#1098ad" },
        { name: "Fairbanks Int'l", code: "FAI", full: "Fairbanks International Airport", country: "United States", flag: "🇺🇸", count: 310, deaths: "83", deathRate: "8.5%", survivors: "889", survivorRate: "91.5%", color: "#20c997" },
        { name: "Las Vegas Reid", code: "LAS", full: "Harry Reid International Airport", country: "United States", flag: "🇺🇸", count: 307, deaths: "269", deathRate: "3.6%", survivors: "7,232", survivorRate: "96.4%", color: "#e03131" },
        { name: "Los Angeles Int'l", code: "LAX", full: "Los Angeles International Airport", country: "United States", flag: "🇺🇸", count: 305, deaths: "952", deathRate: "3.8%", survivors: "24,073", survivorRate: "96.2%", color: "#fab005" },
      ],
    };
  }, []);

  // Field #46 KPI Data: departure_iata
  const kpiField46Data = useMemo(() => {
    return {
      field: "departure_iata",
      label: "Departure Iata",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 4484,
      topValue: "Not Recorded",
      topCount: 359044,
    };
  }, []);

  // Field #47 KPI Data: destination_airport (Strictly Exact Unrounded DuckDB Metrics)
  const kpiField47Data = useMemo(() => {
    return {
      field: "destination_airport",
      label: "Arrival",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 60926,
      recordedEvents: 176551,
      unrecordedEvents: 220202,
      categories: [
        { name: "Regional & Bush", count: 79773, pct: "45.2%", color: "#0ca678", deaths: "62,361", deathRate: "23.4%", survivors: "204,508", survivorRate: "76.6%" },
        { name: "Civil & Commercial", count: 79667, pct: "45.1%", color: "#1c7ed6", deaths: "148,283", deathRate: "9.7%", survivors: "1,375,705", survivorRate: "90.3%" },
        { name: "Military & Defense", count: 17111, pct: "9.7%", color: "#d6336c", deaths: "22,436", deathRate: "46.0%", survivors: "26,368", survivorRate: "54.0%" },
      ],
      topAirports: [
        { name: "Anchorage Int'l", code: "ANC", full: "Ted Stevens Anchorage Int'l Airport", country: "United States", flag: "🇺🇸", count: 414, deaths: "506", deathRate: "9.6%", survivors: "4,773", survivorRate: "90.4%", color: "#1c7ed6" },
        { name: "Miami Int'l", code: "MIA", full: "Miami International Airport", country: "United States", flag: "🇺🇸", count: 388, deaths: "976", deathRate: "4.5%", survivors: "20,571", survivorRate: "95.5%", color: "#f59f00" },
        { name: "London Heathrow", code: "LHR", full: "London Heathrow Airport", country: "United Kingdom", flag: "🇬🇧", count: 373, deaths: "983", deathRate: "2.2%", survivors: "42,769", survivorRate: "97.8%", color: "#7950f2" },
        { name: "Chicago O'Hare", code: "ORD", full: "O'Hare International Airport", country: "United States", flag: "🇺🇸", count: 355, deaths: "426", deathRate: "2.3%", survivors: "18,417", survivorRate: "97.7%", color: "#1098ad" },
        { name: "Amsterdam Schiphol", code: "AMS", full: "Amsterdam Airport Schiphol", country: "Netherlands", flag: "🇳🇱", count: 310, deaths: "179", deathRate: "1.4%", survivors: "12,987", survivorRate: "98.6%", color: "#e8590c" },
        { name: "Houston Hobby", code: "HOU", full: "William P. Hobby Airport", country: "United States", flag: "🇺🇸", count: 304, deaths: "100", deathRate: "4.4%", survivors: "2,182", survivorRate: "95.6%", color: "#0ca678" },
        { name: "New York JFK", code: "JFK", full: "John F. Kennedy International Airport", country: "United States", flag: "🇺🇸", count: 301, deaths: "1,335", deathRate: "4.6%", survivors: "27,985", survivorRate: "95.4%", color: "#3b5bdb" },
        { name: "Los Angeles Int'l", code: "LAX", full: "Los Angeles International Airport", country: "United States", flag: "🇺🇸", count: 293, deaths: "3,731", deathRate: "15.8%", survivors: "19,886", survivorRate: "84.2%", color: "#fab005" },
        { name: "Denver Int'l", code: "DEN", full: "Denver International Airport", country: "United States", flag: "🇺🇸", count: 287, deaths: "234", deathRate: "2.0%", survivors: "11,249", survivorRate: "98.0%", color: "#4dabf7" },
        { name: "Las Vegas Reid", code: "LAS", full: "Harry Reid International Airport", country: "United States", flag: "🇺🇸", count: 278, deaths: "565", deathRate: "7.6%", survivors: "6,832", survivorRate: "92.4%", color: "#e03131" },
        { name: "Frankfurt Airport", code: "FRA", full: "Frankfurt Airport", country: "Germany", flag: "🇩🇪", count: 268, deaths: "269", deathRate: "1.8%", survivors: "14,703", survivorRate: "98.2%", color: "#ae3ec9" },
      ],
    };
  }, []);

  // Field #48 KPI Data: destination_iata
  const kpiField48Data = useMemo(() => {
    return {
      field: "destination_iata",
      label: "Destination Iata",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 4605,
      topValue: "Not Recorded",
      topCount: 362866,
    };
  }, []);

  // Field #49 KPI Data: metar
  const kpiField49Data = useMemo(() => {
    return {
      field: "metar",
      label: "Metar",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 1772,
      topValue: "Not Recorded",
      topCount: 394910,
    };
  }, []);

  // Field #50 KPI Data: weather_or_visibility_mentioned
  const kpiField50Data = useMemo(() => {
    return {
      field: "weather_or_visibility_mentioned",
      label: "Weather Or Visibility Mentioned",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 2,
      topValue: "Not Recorded",
      topCount: 346818,
    };
  }, []);

  // Field #51 KPI Data: investigating_agency (Strictly Exact Unrounded DuckDB Metrics)
  const kpiField51Data = useMemo(() => {
    return {
      field: "investigating_agency",
      label: "Investigation Authority",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 254,
      recordedEvents: 156572,
      unrecordedEvents: 240181,
      primaryAgencies: [
        { code: "NTSB", name: "National Transportation Safety Board", country: "United States", flag: "🇺🇸", count: 106397, pct: "68.0%", pctTotal: "26.8%", deaths: "58,371", deathRate: "12.5%", survivors: "408,028", survivorRate: "87.5%", color: "#1c7ed6" },
        { code: "BFU", name: "Federal Bureau of Aircraft Accident Investigation", country: "Germany", flag: "🇩🇪", count: 5403, pct: "3.5%", pctTotal: "1.4%", deaths: "1,267", deathRate: "5.1%", survivors: "23,490", survivorRate: "94.9%", color: "#e8590c" },
        { code: "AAIB", name: "Air Accidents Investigation Branch", country: "United Kingdom", flag: "🇬🇧", count: 5127, pct: "3.3%", pctTotal: "1.3%", deaths: "1,492", deathRate: "1.1%", survivors: "140,081", survivorRate: "98.9%", color: "#7950f2" },
        { code: "CENIPA", name: "Aeronautical Accidents Investigation Center", country: "Brazil", flag: "🇧🇷", count: 4161, pct: "2.7%", pctTotal: "1.0%", deaths: "3,395", deathRate: "14.4%", survivors: "20,126", survivorRate: "85.6%", color: "#0ca678" },
        { code: "BEA", name: "Bureau of Enquiry and Analysis for Civil Aviation", country: "France", flag: "🇫🇷", count: 3648, pct: "2.3%", pctTotal: "0.9%", deaths: "4,158", deathRate: "15.6%", survivors: "22,430", survivorRate: "84.4%", color: "#3b5bdb" },
        { code: "ATSB/BASI", name: "Australian Transport Safety Bureau", country: "Australia", flag: "🇦🇺", count: 5333, pct: "3.4%", pctTotal: "1.3%", deaths: "1,415", deathRate: "5.0%", survivors: "28,525", survivorRate: "95.0%", color: "#1098ad" },
        { code: "TSB", name: "Transportation Safety Board", country: "Canada", flag: "🇨🇦", count: 2638, pct: "1.7%", pctTotal: "0.7%", deaths: "1,484", deathRate: "3.7%", survivors: "38,502", survivorRate: "96.3%", color: "#d6336c" },
        { code: "CAA S.A.", name: "Civil Aviation Authority", country: "South Africa", flag: "🇿🇦", count: 2296, pct: "1.5%", pctTotal: "0.6%", deaths: "690", deathRate: "5.7%", survivors: "11,377", survivorRate: "94.3%", color: "#e03131" },
        { code: "Others", name: "245+ Global Investigation Bodies", country: "Global", flag: "🌐", count: 21569, pct: "13.8%", pctTotal: "5.4%", deaths: "34,731", deathRate: "9.5%", survivors: "331,613", survivorRate: "90.5%", color: "#495057" },
      ],
      secondaryAgencies: [
        { code: "FAA", name: "Federal Aviation Administration", country: "United States", count: 2138, deaths: "9", deathRate: "0.1%", survivors: "9,649", survivorRate: "99.9%" },
        { code: "SUST", name: "Swiss Transportation Safety Investigation Board", country: "Switzerland", count: 1946, deaths: "851", deathRate: "8.3%", survivors: "9,429", survivorRate: "91.7%" },
        { code: "CIAIAC", name: "Civil Aviation Accident & Incident Commission", country: "Spain", count: 1252, deaths: "2,234", deathRate: "6.9%", survivors: "30,323", survivorRate: "93.1%" },
        { code: "SHK", name: "Swedish Accident Investigation Authority", country: "Sweden", count: 1245, deaths: "251", deathRate: "3.6%", survivors: "6,809", survivorRate: "96.4%" },
        { code: "JIAAC", name: "Civil Aviation Accident Investigation Board", country: "Argentina", count: 1228, deaths: "479", deathRate: "6.0%", survivors: "7,497", survivorRate: "94.0%" },
        { code: "Aerocivil", name: "Special Administrative Unit of Civil Aeronautics", country: "Colombia", count: 911, deaths: "1,251", deathRate: "14.4%", survivors: "7,411", survivorRate: "85.6%" },
        { code: "CAA NZ", name: "Civil Aviation Authority of New Zealand", country: "New Zealand", count: 840, deaths: "216", deathRate: "16.2%", survivors: "1,116", survivorRate: "83.8%" },
        { code: "STSB", name: "Swiss / Singapore Transport Safety Board", country: "International", count: 622, deaths: "107", deathRate: "1.3%", survivors: "7,992", survivorRate: "98.7%" },
      ],
    };
  }, []);

  // Field #52 KPI Data: accident_investigation_duration (Strictly Exact Unrounded DuckDB Metrics)
  const kpiField52Data = useMemo(() => {
    return {
      field: "accident_investigation_duration",
      label: "Investigation Timeframe",
      dataType: "string",
      totalRows: 396753,
      validRows: 396753,
      nullCount: 0,
      uniqueCount: 233,
      recordedEvents: 89845,
      unrecordedEvents: 306908,
      avgDurationMonths: "12.1",
      medianDurationMonths: "9.0",
      tiers: [
        {
          tier: "Rapid Inquiry",
          timeframe: "< 6 Months",
          count: 29887,
          pct: "33.3%",
          pctTotal: "7.5%",
          deaths: "16,090",
          deathRate: "15.8%",
          survivors: "85,827",
          survivorRate: "84.2%",
          color: "#0ca678",
          gradient: "linear-gradient(135deg, #099268 0%, #0ca678 100%)",
        },
        {
          tier: "Standard Review",
          timeframe: "6–12 Months",
          count: 28615,
          pct: "31.8%",
          pctTotal: "7.2%",
          deaths: "19,091",
          deathRate: "9.9%",
          survivors: "173,051",
          survivorRate: "90.1%",
          color: "#1c7ed6",
          gradient: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)",
        },
        {
          tier: "Extended Analysis",
          timeframe: "1–2 Years",
          count: 21836,
          pct: "24.3%",
          pctTotal: "5.5%",
          deaths: "17,774",
          deathRate: "8.4%",
          survivors: "194,911",
          survivorRate: "91.6%",
          color: "#f59f00",
          gradient: "linear-gradient(135deg, #d9480f 0%, #f59f00 100%)",
        },
        {
          tier: "Complex Inquiry",
          timeframe: "> 2 Years",
          count: 9507,
          pct: "10.6%",
          pctTotal: "2.4%",
          deaths: "15,359",
          deathRate: "9.9%",
          survivors: "139,120",
          survivorRate: "90.1%",
          color: "#e03131",
          gradient: "linear-gradient(135deg, #c92a2a 0%, #e03131 100%)",
        },
      ],
    };
  }, []);



  // KPI #2 Occurrence Breakdown (Exact Total Fatalities & Survivors Calculated from DuckDB)
  const kpi2Data = useMemo(() => {
    return {
      total: 396753,
      categories: [
        { name: "Accident", value: 78.8, count: 312552, color: "#fd7e14", deaths: "343,984", deathRate: "27.9%", survivors: "888,087", survivorRate: "72.1%" },
        { name: "Incident", value: 14.5, count: 57493, color: "#1c7ed6", deaths: "5,505", deathRate: "0.6%", survivors: "863,072", survivorRate: "99.4%" },
        { name: "Shotdown", value: 6.3, count: 24850, color: "#e03131", deaths: "43,943", deathRate: "65.2%", survivors: "23,446", survivorRate: "34.8%" },
        { name: "Other", value: 0.4, count: 1858, color: "#868e96", deaths: "6,348", deathRate: "8.0%", survivors: "73,495", survivorRate: "92.0%" },
      ],
    };
  }, []);

  // KPI #3 Event Date / Timeline Breakdown (Exact Raw Dataset Counts)
  const kpi3Data = useMemo(() => {
    return {
      minYear: 1902,
      maxYear: 2026,
      spanYears: 125,
      peakYear: 1944,
      peakEvents: 23029,
      yearlyAvg: 3174,
      eras: [
        {
          id: "pioneer",
          title: "Pioneer Era",
          years: "1902 – 1913",
          deaths: "455",
          survivors: "363",
          deathRate: "55.6%",
          survivorRate: "44.4%",
          Icon: WrightFlyerSvg,
        },
        {
          id: "ww1",
          title: "World War I",
          years: "1914 – 1918",
          deaths: "1,497",
          survivors: "975",
          deathRate: "60.6%",
          survivorRate: "39.4%",
          Icon: Ww1BiplaneSvg,
        },
        {
          id: "interwar",
          title: "Interwar Era",
          years: "1919 – 1938",
          deaths: "11,648",
          survivors: "10,696",
          deathRate: "52.1%",
          survivorRate: "47.9%",
          Icon: InterwarPlaneSvg,
        },
        {
          id: "ww2",
          title: "World War II",
          years: "1939 – 1945",
          deaths: "97,380",
          survivors: "60,612",
          deathRate: "61.6%",
          survivorRate: "38.4%",
          Icon: P51MustangSvg,
        },
        {
          id: "coldwar",
          title: "Cold War",
          years: "1946 – 1970",
          deaths: "104,194",
          survivors: "109,289",
          deathRate: "48.8%",
          survivorRate: "51.2%",
          Icon: F16FalconSvg,
        },
        {
          id: "commercial",
          title: "Commercial Era",
          years: "1971 – 1999",
          deaths: "122,883",
          survivors: "485,153",
          deathRate: "20.2%",
          survivorRate: "79.8%",
          Icon: Boeing747Svg,
        },
        {
          id: "modern",
          title: "Modern Digital Era",
          years: "2000 – 2026",
          deaths: "61,723",
          survivors: "1,181,012",
          deathRate: "5.0%",
          survivorRate: "95.0%",
          Icon: AirbusA380Svg,
        },
      ],
    };
  }, []);

  // KPI #4 Fatalities / Severity Breakdown (Exact Raw Dataset Counts)
  const kpi4Data = useMemo(() => {
    return {
      totalOccupants: 2215925,
      survivors: 1848100,
      survivalRate: 83.40,
      onboardFatalities: 367825,
      onboardFatalityRate: 16.60,
      groundFatalities: 31955,
      totalFatalities: 399780,
    };
  }, []);

  // KPI #5 Geography / Country Breakdown (Strictly Exact Unrounded DuckDB Metrics)
  const kpi5Data = useMemo(() => {
    return {
      totalCountries: 224,
      countries: [
        { name: "United States", code: "USA", flag: "🇺🇸", value: 39.5, count: 156714, color: "#3b5bdb", deaths: "87,286", deathRate: "14.2%", survivors: "525,484", survivorRate: "85.8%" },
        { name: "Rest of World", code: "ROW", flag: "🌐", value: 44.7, count: 177393, color: "#495057", deaths: "224,142", deathRate: "17.2%", survivors: "1,076,498", survivorRate: "82.8%" },
        { name: "United Kingdom", code: "UK", flag: "🇬🇧", value: 7.8, count: 30786, color: "#1c7ed6", deaths: "22,135", deathRate: "11.9%", survivors: "163,873", survivorRate: "88.1%" },
        { name: "Germany", code: "DEU", flag: "🇩🇪", value: 4.7, count: 18713, color: "#0ca678", deaths: "20,725", deathRate: "31.8%", survivors: "44,502", survivorRate: "68.2%" },
        { name: "France", code: "FRA", flag: "🇫🇷", value: 3.3, count: 13147, color: "#12b886", deaths: "13,537", deathRate: "26.4%", survivors: "37,743", survivorRate: "73.6%" },
      ],
    };
  }, []);

  // KPI #6 Fleet Propulsion / Aircraft Type Breakdown
  const kpi6Data = useMemo(() => {
    return {
      totalTypes: 12,
      types: [
        { name: "Propeller", value: 74.6, count: 295997, color: "#f59f00", deaths: "288,125", deathRate: "71.2%", survivors: "434,877", survivorRate: "60.1%" },
        { name: "Jet", value: 13.6, count: 53789, color: "#1c7ed6", deaths: "79,274", deathRate: "19.6%", survivors: "1,344,150", survivorRate: "94.4%" },
        { name: "Helicopter", value: 8.0, count: 31720, color: "#0ca678", deaths: "27,684", deathRate: "6.8%", survivors: "51,002", survivorRate: "64.8%" },
        { name: "Glider", value: 2.6, count: 10173, color: "#7950f2", deaths: "2,385", deathRate: "0.6%", survivors: "6,421", survivorRate: "72.9%" },
        { name: "UAV", value: 0.6, count: 2385, color: "#e03131", deaths: "505", deathRate: "0.1%", survivors: "5,267", survivorRate: "91.2%" },
        { name: "Other", value: 0.6, count: 2689, color: "#868e96", deaths: "1,807", deathRate: "0.5%", survivors: "6,383", survivorRate: "77.9%" },
      ],
    };
  }, []);

  // KPI #7 Flight Phase / Mission Profile Breakdown
  const kpi7Data = useMemo(() => {
    return {
      totalPhases: 4,
      phases: [
        { name: "En-Route", fullLabel: "En-Route / Cruise", value: 50.2, count: 199355, color: "#e8590c", deaths: "259,340", deathRate: "28.9%", survivors: "636,746", survivorRate: "71.1%" },
        { name: "Landing", fullLabel: "Landing / Approach", value: 29.7, count: 117658, color: "#1c7ed6", deaths: "75,005", deathRate: "11.4%", survivors: "584,757", survivorRate: "88.6%" },
        { name: "Takeoff", fullLabel: "Takeoff / Climb", value: 14.8, count: 58810, color: "#e03131", deaths: "57,538", deathRate: "12.9%", survivors: "388,622", survivorRate: "87.1%" },
        { name: "Ground", fullLabel: "Ground / Taxi", value: 5.3, count: 20874, color: "#0ca678", deaths: "7,878", deathRate: "3.2%", survivors: "237,897", survivorRate: "96.8%" },
      ],
    };
  }, []);

  // KPI #8 Flight Nature / Mission Type Breakdown
  const kpi8Data = useMemo(() => {
    return {
      totalMissions: 15,
      missions: [
        { name: "Military", code: "MIL", value: 39.1, count: 155285, color: "#d6336c", deaths: "185,203", deathRate: "46.3%", survivors: "129,280", survivorRate: "41.1%" },
        { name: "Private", code: "GA", value: 34.4, count: 136536, color: "#f59f00", deaths: "67,998", deathRate: "17.0%", survivors: "169,160", survivorRate: "71.3%" },
        { name: "Passenger", code: "PAX", value: 7.5, count: 29632, color: "#1c7ed6", deaths: "99,907", deathRate: "25.0%", survivors: "1,418,773", survivorRate: "93.4%" },
        { name: "Training", code: "TRN", value: 6.5, count: 25611, color: "#0ca678", deaths: "9,688", deathRate: "2.4%", survivors: "33,247", survivorRate: "77.4%" },
        { name: "Others & Special", code: "SPC", value: 6.5, count: 25836, color: "#748ffc", deaths: "14,801", deathRate: "3.7%", survivors: "22,230", survivorRate: "60.0%" },
        { name: "Agricultural", code: "AGR", value: 3.2, count: 12625, color: "#37b24d", deaths: "2,649", deathRate: "0.7%", survivors: "10,229", survivorRate: "79.4%" },
        { name: "Executive", code: "BIZ", value: 1.9, count: 7564, color: "#7048e8", deaths: "7,384", deathRate: "1.8%", survivors: "13,891", survivorRate: "65.3%" },
        { name: "Cargo", code: "CGO", value: 1.5, count: 5896, color: "#e8590c", deaths: "7,330", deathRate: "1.8%", survivors: "10,684", survivorRate: "59.3%" },
      ],
    };
  }, []);

  // KPI #9 Airframe Damage Severity Breakdown
  const kpi9Data = useMemo(() => {
    return {
      totalLevels: 4,
      totalClassified: 396753,
      damages: [
        { name: "Destroyed / Hull Loss", code: "DEST", value: 60.4, count: 239831, color: "#c92a2a", deaths: "380,195", deathRate: "95.1%", survivors: "297,118", survivorRate: "43.9%" },
        { name: "Substantial Damage", code: "SUBST", value: 28.5, count: 113089, color: "#e67700", deaths: "9,910", deathRate: "2.5%", survivors: "542,503", survivorRate: "98.2%" },
        { name: "Minor Damage", code: "MIN", value: 10.3, count: 40995, color: "#2b8a3e", deaths: "866", deathRate: "0.2%", survivors: "1,000,649", survivorRate: "99.9%" },
        { name: "Missing / Unknown", code: "UNK", value: 0.8, count: 2820, color: "#868e96", deaths: "8,775", deathRate: "2.2%", survivors: "463", survivorRate: "5.0%" },
      ],
    };
  }, []);

  // KPI #10 Fleet Operator / Commercial vs Military Fleet Breakdown
  const kpi10Data = useMemo(() => {
    return {
      totalOperators: 90103,
      totalEvents: 396753,
      categories: [
        { name: "General & Private", fullLabel: "General Aviation & Private Operators", value: 62.3, count: 247159, color: "#f59f00", bg: "linear-gradient(135deg, #e67700 0%, #f59f00 100%)", deaths: "184,463", deathRate: "19.7%", survivors: "752,362", survivorRate: "80.3%", Icon: ExecBizjetTopDownSvg },
        { name: "Military & Defense", fullLabel: "Military & Defense Air Arms", value: 30.1, count: 119609, color: "#d6336c", bg: "linear-gradient(135deg, #a61e4d 0%, #d6336c 100%)", deaths: "142,554", deathRate: "59.8%", survivors: "95,677", survivorRate: "40.2%", Icon: F22RaptorTopDownSvg },
        { name: "Commercial Airlines", fullLabel: "Commercial Airlines & Freight", value: 7.6, count: 29985, color: "#1c7ed6", bg: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)", deaths: "72,763", deathRate: "6.8%", survivors: "1,000,061", survivorRate: "93.2%", Icon: AirbusA380TopDownSvg },
      ],
      topOperators: [
        { name: "Royal Air Force", count: 30000, deaths: "47,712", flag: "🇬🇧" },
        { name: "US Army Air Forces", count: 25992, deaths: "15,848", flag: "🇺🇸" },
        { name: "United States Air Force", count: 11569, deaths: "12,675", flag: "🇺🇸" },
        { name: "United States Navy", count: 9282, deaths: "12,518", flag: "🇺🇸" },
      ],
    };
  }, []);

  // KPI #11 Aircraft Manufacturer Breakdown
  const kpi11Data = useMemo(() => {
    return {
      totalManufacturers: 5100,
      totalEvents: 396747,
      manufacturers: [
        { name: "Other", fullLabel: "Other & Custom Manufacturers", value: 69.5, count: 275902, color: "#495057", bg: "linear-gradient(135deg, #343a40 0%, #495057 100%)", deaths: "239,357", deathRate: "33.1%", survivors: "483,939", survivorRate: "66.9%" },
        { name: "Cessna", fullLabel: "Cessna Aircraft Company", value: 13.2, count: 52426, color: "#f59f00", bg: "linear-gradient(135deg, #e67700 0%, #f59f00 100%)", deaths: "26,866", deathRate: "26.9%", survivors: "73,135", survivorRate: "73.1%" },
        { name: "Piper", fullLabel: "Piper Aircraft Corporation", value: 8.3, count: 32860, color: "#1c7ed6", bg: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)", deaths: "19,799", deathRate: "32.0%", survivors: "42,031", survivorRate: "68.0%" },
        { name: "Douglas", fullLabel: "Douglas / McDonnell Douglas", value: 3.9, count: 15597, color: "#0ca678", bg: "linear-gradient(135deg, #099268 0%, #0ca678 100%)", deaths: "41,663", deathRate: "23.7%", survivors: "134,280", survivorRate: "76.3%" },
        { name: "Boeing", fullLabel: "Boeing Commercial & Defense", value: 3.8, count: 14896, color: "#7950f2", bg: "linear-gradient(135deg, #6741d9 0%, #7950f2 100%)", deaths: "35,849", deathRate: "4.6%", survivors: "739,935", survivorRate: "95.4%" },
        { name: "Airbus", fullLabel: "Airbus Commercial Airliners", value: 1.3, count: 5066, color: "#1098ad", bg: "linear-gradient(135deg, #0c8599 0%, #1098ad 100%)", deaths: "4,291", deathRate: "1.1%", survivors: "374,735", survivorRate: "98.9%" },
      ],
    };
  }, []);

  // KPI #12 Confidence Rating Breakdown (Exact DuckDB Totals)
  const kpi12Data = useMemo(() => {
    return {
      totalRatings: 4,
      totalEvents: 396753,
      ratings: [
        { name: "Limited Info", fullLabel: "Little or no information is available", value: 44.5, count: 176391, color: "#c92a2a", bg: "linear-gradient(135deg, #e03131 0%, #c92a2a 100%)", deaths: "227,182", deathRate: "46.1%", survivors: "265,523", survivorRate: "53.9%" },
        { name: "Official Report", fullLabel: "Accident investigation report completed and information captured", value: 27.1, count: 107336, color: "#2f9e44", bg: "linear-gradient(135deg, #2b8a3e 0%, #2f9e44 100%)", deaths: "90,137", deathRate: "9.4%", survivors: "871,004", survivorRate: "90.6%" },
        { name: "Verified Data", fullLabel: "Information verified through data from accident investigation authorities", value: 15.1, count: 60075, color: "#1c7ed6", bg: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)", deaths: "34,451", deathRate: "11.5%", survivors: "265,549", survivorRate: "88.5%" },
        { name: "Media / Unofficial", fullLabel: "Information is only available from news, social media or unofficial sources", value: 13.3, count: 52879, color: "#f59f00", bg: "linear-gradient(135deg, #e67700 0%, #f59f00 100%)", deaths: "47,945", deathRate: "9.7%", survivors: "445,980", survivorRate: "90.3%" },
      ],
    };
  }, []);

  // KPI #13 Global Region Breakdown (Strictly Exact Unrounded DuckDB Metrics)
  const kpi13Data = useMemo(() => {
    return {
      totalRegions: 6,
      totalEvents: 396753,
      regions: [
        { name: "North America", value: 43.3, count: 171600, color: "#1c7ed6", deaths: "100,252", deathRate: "14.2%", survivors: "603,898", survivorRate: "85.8%", MapSvg: NorthAmericaMapSvg },
        { name: "Europe & UK", value: 30.4, count: 120804, color: "#7950f2", deaths: "129,636", deathRate: "19.7%", survivors: "527,617", survivorRate: "80.3%", MapSvg: EuropeMapSvg },
        { name: "Asia & Oceania", value: 11.8, count: 46625, color: "#0ca678", deaths: "60,274", deathRate: "14.0%", survivors: "370,040", survivorRate: "86.0%", MapSvg: AsiaMapSvg },
        { name: "Latin America", value: 6.2, count: 24621, color: "#d6336c", deaths: "33,530", deathRate: "19.2%", survivors: "140,987", survivorRate: "80.8%", MapSvg: LatinAmericaMapSvg },
        { name: "Africa & M. East", value: 4.8, count: 19078, color: "#f59f00", deaths: "32,316", deathRate: "19.1%", survivors: "137,174", survivorRate: "80.9%", MapSvg: AfricaMapSvg },
        { name: "Oceans & Other", value: 3.5, count: 14025, color: "#495057", deaths: "11,817", deathRate: "14.7%", survivors: "68,384", survivorRate: "85.3%", MapSvg: OceansMapSvg },
      ],
    };
  }, []);

  return (
    <Stack gap="md" className="kpi-view-container">
      {/* Section Header with All KPIs Restore Button */}
      <Paper p="xs" radius="md" withBorder style={{ background: "linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(18, 184, 134, 0.05) 100%)" }}>
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #1c7ed6 0%, #0ca678 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(28, 126, 214, 0.3)",
                color: "#fff",
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <Title order={3} style={{ fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.2 }}>
                Key Performance Indicators (KPI)
              </Title>
              <Text size="xs" c="dimmed" style={{ fontSize: "0.68rem" }}>
                Field safety metrics & dataset health
              </Text>
            </div>
          </Group>

          {/* Header Action Controls */}
          <Group gap="xs">
            {minimizedCardIds.size > 0 ? (
              <Button
                size="xs"
                variant="light"
                color="blue"
                radius="md"
                onClick={handleExpandAll}
                style={{ fontWeight: 700, fontSize: "0.72rem" }}
              >
                Expand All KPIs ({minimizedCardIds.size} Minimized)
              </Button>
            ) : (
              <Button
                size="xs"
                variant="light"
                color="gray"
                radius="md"
                onClick={handleMinimizeAll}
                style={{ fontWeight: 700, fontSize: "0.72rem" }}
              >
                Minimize All KPIs
              </Button>
            )}

            {hiddenCardIds.size > 0 && (
              <Button
                size="xs"
                variant="filled"
                color="blue"
                radius="md"
                leftSection={<RotateCcw size={13} />}
                onClick={handleRestoreAll}
                style={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  boxShadow: "0 3px 10px rgba(28, 126, 214, 0.35)",
                  transition: "all 0.2s ease",
                }}
              >
                All KPIs ({hiddenCardIds.size} Hidden)
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Independent Cards Flex Container */}
      <Flex wrap="wrap" gap="md" align="flex-start">
        {/* KPI #1: Data Quality */}
        {loading ? (
          <Card padding="xs" radius="md" withBorder style={{ minWidth: 260, flex: "0 1 auto" }}>
            <Skeleton height={110} radius="md" />
          </Card>
        ) : (
          <KpiWindowCard
            id="kpi-1-quality"
            title="Data Quality"
            badgeKey="asn_id"
            badgeColor="#1c7ed6"
            minWidth={minimizedCardIds.has("kpi-1-quality") ? "fit-content" : 260}
            bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(28, 126, 214, 0.08) 100%)"
            borderColor="rgba(28, 126, 214, 0.3)"
            iconBgGradient="linear-gradient(135deg, #1c7ed6 0%, #339af0 100%)"
            iconBoxShadow="0 3px 10px rgba(28, 126, 214, 0.35)"
            icon={<Database size={15} color="#ffffff" />}
            subIcon={<CheckCircle2 size={8} color="#ffffff" />}
            hiddenCardIds={hiddenCardIds}
            minimizedCardIds={minimizedCardIds}
            maximizedCardId={maximizedCardId}
            allowMaximize={false}
            onHide={handleHide}
            onToggleMinimize={handleToggleMinimize}
            onToggleMaximize={handleToggleMaximize}
          >
            {(isMaximized) => (
              <>
                <Group justify="space-between" align="center" mt={2} wrap="nowrap">
                  <div>
                    <Text size="xs" fw={700} c="dimmed" style={{ fontSize: isMaximized ? "0.9rem" : "0.6rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Total Records
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "1.25rem", lineHeight: 1.1, color: "#1c7ed6" }}>
                      {kpi1Data.totalRows.toLocaleString()}
                    </Text>
                  </div>

                  <RingProgress
                    size={isMaximized ? 130 : 46}
                    thickness={isMaximized ? 10 : 4}
                    roundCaps
                    sections={[{ value: kpi1Data.avgQuality, color: "teal" }]}
                    label={
                      <Text fw={900} ta="center" style={{ fontSize: isMaximized ? "1.2rem" : "0.6rem" }}>
                        {Math.round(kpi1Data.avgQuality)}%
                      </Text>
                    }
                  />
                </Group>

                <Group justify="space-between" align="center" mt={isMaximized ? 24 : 6} pt={6} style={{ borderTop: "1px solid rgba(140, 140, 140, 0.12)" }}>
                  <Group gap={4} wrap="nowrap">
                    <CheckCircle2 size={isMaximized ? 18 : 10} color="#0ca678" />
                    <Text size="xs" fw={700} c="teal" style={{ fontSize: isMaximized ? "1rem" : "0.65rem" }}>
                      Quality: {kpi1Data.avgQuality.toFixed(1)}%
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed" fw={600} style={{ fontSize: isMaximized ? "1rem" : "0.65rem" }}>
                    {kpi1Data.fieldCount} Fields
                  </Text>
                </Group>
              </>
            )}
          </KpiWindowCard>
        )}

        

        

        {/* KPI #2: Occurrence */}
        <KpiWindowCard
          id="kpi-2-occurrence"
          title="Occurrence"
          badgeKey="category"
          badgeColor="#fd7e14"
          minWidth={420}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(253, 126, 20, 0.08) 100%)"
          borderColor="rgba(253, 126, 20, 0.3)"
          iconBgGradient="linear-gradient(135deg, #fd7e14 0%, #ff922b 100%)"
          iconBoxShadow="0 4px 12px rgba(253, 126, 20, 0.35)"
          icon={<Layers size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#1c7ed6"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Side: Accident (78.8%) */}
              <Tooltip label={`Accident: 78.8% (${kpi2Data.categories[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-2-occurrence")}
                  style={{
                    flex: 75,
                    backgroundColor: "#fd7e14",
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <AccidentCrashSvg
                    size={isMaximized ? 360 : 70}
                    color="#ffffff"
                    style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))", marginBottom: isMaximized ? 8 : 3, maxWidth: isMaximized ? "78%" : "85%" }}
                  />
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.5rem" : "1.05rem", color: "#fff", lineHeight: 1.1 }}>
                    Accident
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "5.8rem" : "1.25rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                    78.8%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "2.2rem" : "0.72rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                    312,552 events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 2} mt={isMaximized ? 14 : 4} align="center">
                    <Group gap={4} align="center">
                      <Skull size={isMaximized ? 28 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.8rem" : "0.7rem", opacity: 0.95 }}>
                        {kpi2Data.categories[0].deaths} {kpi2Data.categories[0].deathRate}
                      </Text>
                    </Group>
                    <Group gap={4} align="center">
                      <UserCheck size={isMaximized ? 28 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.8rem" : "0.7rem", opacity: 0.95 }}>
                        {kpi2Data.categories[0].survivors} {kpi2Data.categories[0].survivorRate}
                      </Text>
                    </Group>
                  </Stack>
                  )}
                </div>
              </Tooltip>

              {/* Right Side: Incident, Shotdown, Other */}
              <div style={{ flex: 25, display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Incident (14.5%) */}
                <Tooltip label={`Incident: 14.5% (${kpi2Data.categories[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-2-occurrence")}
                    style={{
                      flex: 52,
                      backgroundColor: "#1c7ed6",
                      borderRadius: 5,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <IncidentSmokeSvg
                      size={isMaximized ? 220 : 30}
                      color="#ffffff"
                      style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 6 : 2, maxWidth: isMaximized ? "75%" : "82%" }}
                    />
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.4rem" : "0.72rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                      Incident
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.4rem" : "0.78rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                      14.5%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.6rem" : "0.58rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                      57,493 events
                    </Text>

                    {isMaximized && (
                      <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 8 : 2} align="center">
                        <Group gap={3} align="center">
                          <Skull size={isMaximized ? 22 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.3rem" : "0.6rem", opacity: 0.95 }}>
                            {kpi2Data.categories[1].deaths} {kpi2Data.categories[1].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={isMaximized ? 22 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.3rem" : "0.6rem", opacity: 0.95 }}>
                            {kpi2Data.categories[1].survivors} {kpi2Data.categories[1].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Shotdown (6.3%) */}
                <Tooltip label={`Shotdown: 6.3% (${kpi2Data.categories[2].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-2-occurrence")}
                    style={{
                      flex: 32,
                      backgroundColor: "#e03131",
                      borderRadius: 5,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 12 : "2px 4px",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <MilitaryShotdownSvg
                      size={isMaximized ? 140 : 20}
                      color="#ffffff"
                      style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 4 : 2, maxWidth: isMaximized ? "70%" : "78%" }}
                    />
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.65rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                      Shotdown
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "0.72rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                      6.3%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.4rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                      24,850 events
                    </Text>

                    {isMaximized && (
                      <Stack gap={isMaximized ? 2 : 1} mt={isMaximized ? 6 : 1} align="center">
                        <Group gap={3} align="center">
                          <Skull size={isMaximized ? 18 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.56rem", opacity: 0.95 }}>
                            {kpi2Data.categories[2].deaths} {kpi2Data.categories[2].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={isMaximized ? 18 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.56rem", opacity: 0.95 }}>
                            {kpi2Data.categories[2].survivors} {kpi2Data.categories[2].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Other (0.4%) */}
                <Tooltip label={`Other: 0.4% (${kpi2Data.categories[3].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-2-occurrence")}
                    style={{
                      flex: 16,
                      backgroundColor: "#868e96",
                      borderRadius: 5,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? "8px 16px" : "2px 4px",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.6rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                      Other
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.65rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                      0.4%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.50rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                      1,858 events
                    </Text>

                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 16 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.9rem" : "0.52rem", opacity: 0.95 }}>
                            {kpi2Data.categories[3].deaths} {kpi2Data.categories[3].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 16 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.9rem" : "0.52rem", opacity: 0.95 }}>
                            {kpi2Data.categories[3].survivors} {kpi2Data.categories[3].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
        </KpiWindowCard>



        {/* KPI #12: Confidence Rating */}
        <KpiWindowCard
          id="kpi-12-confidence"
          title="Confidence"
          badgeKey="confidence_rating"
          badgeColor="#20c997"
          subBadgeText="4 Verification Tiers"
          minWidth={minimizedCardIds.has("kpi-12-confidence") ? "fit-content" : maximizedCardId === "kpi-12-confidence" ? "100%" : 440}
          flexWidth={maximizedCardId === "kpi-12-confidence" ? "1 1 100%" : "1 1 440px"}
          bgGradient="linear-gradient(145deg, rgba(32, 201, 151, 0.04) 0%, rgba(28, 126, 214, 0.08) 100%)"
          borderColor="rgba(32, 201, 151, 0.3)"
          iconBgGradient="linear-gradient(135deg, #0ca678 0%, #20c997 100%)"
          iconBoxShadow="0 4px 12px rgba(32, 201, 151, 0.35)"
          icon={<ShieldCheck size={18} color="#ffffff" />}
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Main Tile: Limited Info (44.5%) */}
              <Tooltip label={`Limited Info: 44.5% (${kpi12Data.ratings[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-12-confidence")}
                  style={{
                    flex: 445,
                    background: kpi12Data.ratings[0].bg,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 4 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "1.05rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    Limited Info
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "4.5rem" : "1.4rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                    44.5%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.75rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                    176,391 events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 14 : 4} align="center">
                    <Group gap={4} align="center">
                      <Skull size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.75rem", opacity: 0.95 }}>
                        {kpi12Data.ratings[0].deaths} {kpi12Data.ratings[0].deathRate}
                      </Text>
                    </Group>
                    <Group gap={4} align="center">
                      <UserCheck size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.75rem", opacity: 0.95 }}>
                        {kpi12Data.ratings[0].survivors} {kpi12Data.ratings[0].survivorRate}
                      </Text>
                    </Group>
                  </Stack>
                  )}
                </div>
              </Tooltip>

              {/* Right Stack: Official Report, Verified Data & Media/Unofficial */}
              <div style={{ display: "flex", flexDirection: "column", flex: 555, gap: 4 }}>
                {/* Top Row: Official Report (27.1%) */}
                <Tooltip label={`Official Report: 27.1% (${kpi12Data.ratings[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-12-confidence")}
                    style={{
                      flex: 271,
                      background: kpi12Data.ratings[1].bg,
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      gap: isMaximized ? 2 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.92rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                      Official Report
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.6rem" : "1.25rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1, textAlign: "center" }}>
                      27.1%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.6rem" : "0.68rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                      107,336 events
                    </Text>
                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                      <Group gap={3} align="center">
                        <Skull size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.62rem", opacity: 0.95 }}>
                          {kpi12Data.ratings[1].deaths} {kpi12Data.ratings[1].deathRate}
                        </Text>
                      </Group>
                      <Group gap={3} align="center">
                        <UserCheck size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.62rem", opacity: 0.95 }}>
                          {kpi12Data.ratings[1].survivors} {kpi12Data.ratings[1].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Bottom Row: Verified Data (15.1%) & Media / Unofficial (13.3%) */}
                <div style={{ display: "flex", flex: 284, gap: 4, width: "100%" }}>
                  {/* Verified Data (15.1%) */}
                  <Tooltip label={`Verified Data: 15.1% (${kpi12Data.ratings[2].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-12-confidence")}
                      style={{
                        flex: 151,
                        background: kpi12Data.ratings[2].bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#ffffff",
                        padding: isMaximized ? 12 : 3,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.78rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                        Verified Data
                      </Text>
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.8rem" : "1.05rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1, textAlign: "center" }}>
                        15.1%
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.4rem" : "0.60rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                        60,075 events
                      </Text>
                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.55rem" }}>
                            {kpi12Data.ratings[2].deaths} {kpi12Data.ratings[2].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.55rem" }}>
                            {kpi12Data.ratings[2].survivors} {kpi12Data.ratings[2].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>

                  {/* Media / Unofficial (13.3%) */}
                  <Tooltip label={`Media / Unofficial: 13.3% (${kpi12Data.ratings[3].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-12-confidence")}
                      style={{
                        flex: 133,
                        background: kpi12Data.ratings[3].bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#ffffff",
                        padding: isMaximized ? 12 : 3,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.78rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                        Media / Unofficial
                      </Text>
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.8rem" : "1.05rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1, textAlign: "center" }}>
                        13.3%
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.4rem" : "0.60rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                        52,879 events
                      </Text>
                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.55rem" }}>
                            {kpi12Data.ratings[3].deaths} {kpi12Data.ratings[3].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.55rem" }}>
                            {kpi12Data.ratings[3].survivors} {kpi12Data.ratings[3].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* KPI #3: Timeline */}
        <KpiWindowCard
          id="kpi-3-timeline"
          title="Timeline"
          badgeKey="event_date"
          badgeColor="#0ca678"
          minWidth={minimizedCardIds.has("kpi-3-timeline") ? "fit-content" : 460}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(12, 166, 120, 0.08) 100%)"
          borderColor="rgba(12, 166, 120, 0.3)"
          iconBgGradient="linear-gradient(135deg, #0ca678 0%, #20c997 100%)"
          iconBoxShadow="0 4px 12px rgba(12, 166, 120, 0.35)"
          icon={<Calendar size={18} color="#ffffff" />}
          subIcon={<Clock size={9} color="#ffffff" />}
          subIconBgColor="#1c7ed6"
          badgeText={`${kpi3Data.spanYears} YEARS`}
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              onClick={() => !isMaximized && handleToggleMaximize("kpi-3-timeline")}
              style={{
                marginTop: 6,
                display: "flex",
                flexDirection: "column",
                gap: isMaximized ? 14 : 8,
                cursor: isMaximized ? "default" : "pointer",
              }}
            >
              {/* Header Range & Peak Banner */}
              <Paper
                p="xs"
                radius="md"
                style={{
                  backgroundColor: "rgba(0,0,0,0.03)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  padding: isMaximized ? 14 : 8,
                  cursor: isMaximized ? "default" : "pointer",
                }}
              >
                <Group justify="space-between" align="center">
                  <div>
                    <Text size="xs" fw={700} c="dimmed" style={{ fontSize: isMaximized ? "0.85rem" : "0.58rem", textTransform: "uppercase" }}>
                      Historical Span
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.1rem", color: "#0ca678", lineHeight: 1.1 }}>
                      {kpi3Data.minYear} – {kpi3Data.maxYear}
                    </Text>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Text size="xs" fw={800} style={{ fontSize: isMaximized ? "1rem" : "0.68rem" }}>
                      Peak: <span style={{ color: "#e03131", fontWeight: 900 }}>{kpi3Data.peakYear}</span> ({kpi3Data.peakEvents.toLocaleString()})
                    </Text>
                    <Text size="xs" c="dimmed" fw={600} style={{ fontSize: isMaximized ? "0.95rem" : "0.6rem" }}>
                      ~{kpi3Data.yearlyAvg.toLocaleString()}/yr
                    </Text>
                  </div>
                </Group>
              </Paper>

              {/* 7 Historical Eras Grid / Cards List */}
              <div
                style={{
                  display: isMaximized ? "grid" : "flex",
                  gridTemplateColumns: isMaximized ? "repeat(auto-fill, minmax(320px, 1fr))" : undefined,
                  flexDirection: isMaximized ? undefined : "column",
                  gap: isMaximized ? 14 : 8,
                  maxHeight: isMaximized ? "calc(100vh - 250px)" : 260,
                  overflowY: "auto",
                  paddingRight: 4,
                  width: "100%",
                }}
              >
                {kpi3Data.eras.map((era) => {
                  const EraIcon = era.Icon;
                  return (
                    <Paper
                      key={era.id}
                      p="xs"
                      radius="md"
                      onClick={(e) => {
                        if (!isMaximized) {
                          e.stopPropagation();
                          handleToggleMaximize("kpi-3-timeline");
                        }
                      }}
                      style={{
                        background: isMaximized
                          ? "linear-gradient(135deg, rgba(15, 23, 42, 0.78) 0%, rgba(30, 41, 59, 0.70) 100%)"
                          : "linear-gradient(145deg, rgba(255, 255, 255, 0.45) 0%, rgba(12, 166, 120, 0.07) 100%)",
                        border: isMaximized ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(12, 166, 120, 0.18)",
                        padding: isMaximized ? "16px 20px" : "8px 12px",
                        boxShadow: isMaximized ? "0 4px 14px rgba(0,0,0,0.25)" : "0 2px 6px rgba(0,0,0,0.03)",
                        backdropFilter: "blur(8px)",
                        width: "100%",
                        display: "flex",
                        flexDirection: isMaximized ? "column" : "row",
                        alignItems: "center",
                        gap: isMaximized ? 12 : 12,
                        transition: "all 0.2s ease-in-out",
                        cursor: isMaximized ? "default" : "pointer",
                      }}
                    >
                      {/* AIRCRAFT GRAPHIC COLUMN */}
                      <div
                        style={{
                          width: isMaximized ? "100%" : 105,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: isMaximized ? "12px 0 16px 0" : "2px 4px",
                          borderBottom: isMaximized ? "1px solid rgba(255, 255, 255, 0.08)" : undefined,
                          borderRight: !isMaximized ? "1px solid rgba(12, 166, 120, 0.15)" : undefined,
                          marginBottom: isMaximized ? 12 : 0,
                          paddingRight: !isMaximized ? 8 : 0,
                          flexShrink: 0,
                        }}
                      >
                        <EraIcon
                          size={isMaximized ? 260 : 95}
                          style={{
                            maxWidth: isMaximized ? "92%" : 95,
                            height: "auto",
                            filter: isMaximized
                              ? "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))"
                              : "brightness(0) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))",
                          }}
                        />
                      </div>

                      {/* DATA & METRICS COLUMN */}
                      <div style={{ flex: 1, minWidth: 0, width: isMaximized ? "100%" : undefined }}>
                        {/* Era Title & Years */}
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.35rem" : "0.85rem", color: isMaximized ? "#f8fafc" : "#111827", lineHeight: 1.1 }}>
                            {era.title}
                          </Text>
                          <Text fw={800} style={{ fontSize: isMaximized ? "1.05rem" : "0.68rem", color: isMaximized ? "#38bdf8" : "#374151" }}>
                            {era.years}
                          </Text>
                        </Group>

                        {isMaximized && (
                          <>
                            {/* Line 1: Deaths */}
                        <Group gap={6} align="center" mt={isMaximized ? 8 : 2}>
                          <Skull size={isMaximized ? 18 : 12} color={isMaximized ? "#ff6b6b" : "#e03131"} strokeWidth={2.5} />
                          <Text fw={800} style={{ fontSize: isMaximized ? "1.15rem" : "0.72rem", color: isMaximized ? "#ff6b6b" : "#e03131" }}>
                            {era.deaths}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.15rem" : "0.72rem", color: isMaximized ? "#ff6b6b" : "#e03131" }}>
                            {era.deathRate}
                          </Text>
                        </Group>

                        {/* Line 2: Survivors */}
                        <Group gap={6} align="center" mt={2}>
                          <UserCheck size={isMaximized ? 18 : 12} color={isMaximized ? "#51cf66" : "#0ca678"} strokeWidth={2.5} />
                          <Text fw={800} style={{ fontSize: isMaximized ? "1.15rem" : "0.72rem", color: isMaximized ? "#51cf66" : "#0ca678" }}>
                            {era.survivors}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.15rem" : "0.72rem", color: isMaximized ? "#51cf66" : "#0ca678" }}>
                            {era.survivorRate}
                          </Text>
                        </Group>
                          </>
                        )}
                      </div>
                    </Paper>
                  );
                })}
              </div>
            </div>
          )}
        </KpiWindowCard>

        

        {/* Field #8 KPI Card: event_month (Treemap) */}
        <KpiWindowCard
          id="kpi-field-8-event_month"
          title="Month"
          badgeKey="event_month"
          badgeColor="#1c7ed6"
          badgeText="Field 8 / 57 • 12 Months"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(28, 126, 214, 0.08) 100%)"
          borderColor="rgba(28, 126, 214, 0.3)"
          iconBgGradient="linear-gradient(135deg, #1c7ed6 0%, #3b5bdb 100%)"
          iconBoxShadow="0 4px 12px rgba(28, 126, 214, 0.35)"
          icon={<Calendar size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Main Tile: July (Peak Month - 10.3%) */}
              <Tooltip label={`July: 10.3% (${kpiField8Data.months[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-field-8-event_month")}
                  style={{
                    flex: 32,
                    backgroundColor: kpiField8Data.months[0].bg,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.05rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    July
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "5.2rem" : "1.35rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                    10.3%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "1.9rem" : "0.75rem", color: "rgba(255,255,255,0.9)", marginTop: 2, lineHeight: 1.1 }}>
                    41,002 events
                  </Text>
                </div>
              </Tooltip>

              {/* Right Side: Grid of 3 Rows */}
              <div style={{ flex: 68, display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Row 1: August (9.9%), June (9.8%), May (9.6%) */}
                <div style={{ flex: 34, display: "flex", gap: 4 }}>
                  {kpiField8Data.months.slice(1, 4).map((m) => (
                    <Tooltip key={m.name} label={`${m.name}: ${m.pct} (${m.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-8-event_month")}
                        style={{
                          flex: 1,
                          backgroundColor: m.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 12 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.7rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {m.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.7rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {m.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.6rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({m.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 2: September (8.9%), April (8.3%), March (8.1%), October (7.7%) */}
                <div style={{ flex: 33, display: "flex", gap: 4 }}>
                  {kpiField8Data.months.slice(4, 8).map((m) => (
                    <Tooltip key={m.name} label={`${m.name}: ${m.pct} (${m.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-8-event_month")}
                        style={{
                          flex: 1,
                          backgroundColor: m.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 10 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.65rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {m.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.66rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {m.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.56rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({m.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 3: January, February, November, December, N/R */}
                <div style={{ flex: 33, display: "flex", gap: 4 }}>
                  {kpiField8Data.months.slice(8, 13).map((m) => (
                    <Tooltip key={m.name} label={`${m.name}: ${m.pct} (${m.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-8-event_month")}
                        style={{
                          flex: m.name === "Not Recorded" ? 0.9 : 1,
                          backgroundColor: m.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 8 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.58rem", color: "#fff", lineHeight: 1.05, textAlign: "center" }}>
                          {m.label === "Not Recorded" ? (
                            <>
                              <span>Not</span>
                              <br />
                              <span>Recorded</span>
                            </>
                          ) : (
                            m.label
                          )}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.6rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {m.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.52rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({m.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #9 KPI Card: event_day (Treemap) */}
        <KpiWindowCard
          id="kpi-field-9-event_day"
          title="Day"
          badgeKey="event_day"
          badgeColor="#0ca678"
          badgeText="Field 9 / 57 • Days 1 - 31"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(12, 166, 120, 0.08) 100%)"
          borderColor="rgba(12, 166, 120, 0.3)"
          iconBgGradient="linear-gradient(135deg, #0ca678 0%, #1098ad 100%)"
          iconBoxShadow="0 4px 12px rgba(12, 166, 120, 0.35)"
          icon={<Calendar size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#1c7ed6"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Main Tile: Day 1 (Peak Day - 3.4%) */}
              <Tooltip label={`Day 1: 3.4% (${kpiField9Data.days[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-field-9-event_day")}
                  style={{
                    flex: 20,
                    backgroundColor: kpiField9Data.days[0].bg,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.05rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    1st
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "5.2rem" : "1.35rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                    3.4%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "1.9rem" : "0.72rem", color: "rgba(255,255,255,0.9)", marginTop: 2, lineHeight: 1.1 }}>
                    13,653 events
                  </Text>
                </div>
              </Tooltip>

              {/* Right Side: 4 Grid Rows of Remaining Days */}
              <div style={{ flex: 80, display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Row 1: Days 17, 10, 18, 15, 16, 23, 6 */}
                <div style={{ flex: 25, display: "flex", gap: 4 }}>
                  {kpiField9Data.days.slice(1, 8).map((d) => (
                    <Tooltip key={d.day} label={`${d.label}: ${d.pct} (${d.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-9-event_day")}
                        style={{
                          flex: 1,
                          backgroundColor: d.bg,
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 8 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.6rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {d.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.55rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {d.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.5rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({d.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 2: Days 4, 19, 12, 24, 21, 27, 20, 8 */}
                <div style={{ flex: 25, display: "flex", gap: 4 }}>
                  {kpiField9Data.days.slice(8, 16).map((d) => (
                    <Tooltip key={d.day} label={`${d.label}: ${d.pct} (${d.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-9-event_day")}
                        style={{
                          flex: 1,
                          backgroundColor: d.bg,
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 8 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.58rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {d.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.55rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {d.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.5rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({d.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 3: Days 7, 22, 5, 14, 11, 13, 26, 9 */}
                <div style={{ flex: 25, display: "flex", gap: 4 }}>
                  {kpiField9Data.days.slice(16, 24).map((d) => (
                    <Tooltip key={d.day} label={`${d.label}: ${d.pct} (${d.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-9-event_day")}
                        style={{
                          flex: 1,
                          backgroundColor: d.bg,
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 8 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.58rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {d.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.55rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {d.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.5rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({d.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 4: Days 2, 28, 25, 3, 29, 30, 31, Not Recorded */}
                <div style={{ flex: 25, display: "flex", gap: 4 }}>
                  {kpiField9Data.days.slice(24, 32).map((d) => (
                    <Tooltip key={d.day} label={`${d.label}: ${d.pct} (${d.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-9-event_day")}
                        style={{
                          flex: d.day === "N/R" ? 0.9 : 1,
                          backgroundColor: d.bg,
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 8 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.55rem", color: "#fff", lineHeight: 1.05, textAlign: "center" }}>
                          {d.label === "Not Recorded" ? (
                            <>
                              <span>Not</span>
                              <br />
                              <span>Recorded</span>
                            </>
                          ) : (
                            d.label
                          )}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.52rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {d.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.48rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({d.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #10 KPI Card: event_weekday (Treemap) */}
        <KpiWindowCard
          id="kpi-field-10-event_weekday"
          title="Weekday"
          badgeKey="event_weekday"
          badgeColor="#748ffc"
          badgeText="Field 10 / 57 • 7 Days"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(116, 143, 252, 0.08) 100%)"
          borderColor="rgba(116, 143, 252, 0.3)"
          iconBgGradient="linear-gradient(135deg, #748ffc 0%, #4c6ef5 100%)"
          iconBoxShadow="0 4px 12px rgba(116, 143, 252, 0.35)"
          icon={<Clock size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Main Tile: Saturday (Peak Weekday - 15.3%) */}
              <Tooltip label={`Saturday: 15.3% (${kpiField10Data.weekdays[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-field-10-event_weekday")}
                  style={{
                    flex: 32,
                    backgroundColor: kpiField10Data.weekdays[0].bg,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.05rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    Saturday
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "5.2rem" : "1.35rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                    15.3%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "1.9rem" : "0.75rem", color: "rgba(255,255,255,0.9)", marginTop: 2, lineHeight: 1.1 }}>
                    60,692 events
                  </Text>
                </div>
              </Tooltip>

              {/* Right Side: Grid of 2 Rows */}
              <div style={{ flex: 68, display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Row 1: Friday (14.7%), Sunday (14.4%), Thursday (14.3%) */}
                <div style={{ flex: 50, display: "flex", gap: 4 }}>
                  {kpiField10Data.weekdays.slice(1, 4).map((w) => (
                    <Tooltip key={w.name} label={`${w.name}: ${w.pct} (${w.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-10-event_weekday")}
                        style={{
                          flex: 1,
                          backgroundColor: w.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 12 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.7rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {w.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.72rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {w.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.6rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({w.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 2: Wednesday (13.8%), Tuesday (13.7%), Monday (13.2%), Not Recorded (0.6%) */}
                <div style={{ flex: 50, display: "flex", gap: 4 }}>
                  {kpiField10Data.weekdays.slice(4, 8).map((w) => (
                    <Tooltip key={w.name} label={`${w.name}: ${w.pct} (${w.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-10-event_weekday")}
                        style={{
                          flex: w.name === "Not Recorded" ? 0.9 : 1,
                          backgroundColor: w.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 10 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.65rem", color: "#fff", lineHeight: 1.05, textAlign: "center" }}>
                          {w.label === "Not Recorded" ? (
                            <>
                              <span>Not</span>
                              <br />
                              <span>Recorded</span>
                            </>
                          ) : (
                            w.label
                          )}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.66rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {w.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.56rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({w.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #11 KPI Card: local_time (Treemap) */}
        <KpiWindowCard
          id="kpi-field-11-local_time"
          title="Local Time"
          badgeKey="local_time"
          badgeColor="#1098ad"
          badgeText="Field 11 / 57 • 5,050 Times"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(16, 152, 173, 0.08) 100%)"
          borderColor="rgba(16, 152, 173, 0.3)"
          iconBgGradient="linear-gradient(135deg, #1098ad 0%, #0c8599 100%)"
          iconBoxShadow="0 4px 12px rgba(16, 152, 173, 0.35)"
          icon={<Clock size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Main Tile: Not Recorded (Peak - 38.2%) */}
              <Tooltip label={`Not Recorded: 38.2% (${kpiField11Data.times[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-field-11-local_time")}
                  style={{
                    flex: 32,
                    backgroundColor: kpiField11Data.times[0].bg,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.05rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    Not
                    <br />
                    Recorded
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "5.2rem" : "1.35rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                    38.2%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "1.9rem" : "0.75rem", color: "rgba(255,255,255,0.9)", marginTop: 2, lineHeight: 1.1 }}>
                    151,569 events
                  </Text>
                </div>
              </Tooltip>

              {/* Right Side: Grid of 2 Rows */}
              <div style={{ flex: 68, display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Row 1: Afternoon (25.8%), Morning (16.3%), Evening (9.2%) */}
                <div style={{ flex: 50, display: "flex", gap: 4 }}>
                  {kpiField11Data.times.slice(1, 4).map((t) => (
                    <Tooltip key={t.name} label={`${t.name}: ${t.pct} (${t.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-11-local_time")}
                        style={{
                          flex: 1,
                          backgroundColor: t.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 12 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.7rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {t.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.72rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {t.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.6rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({t.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 2: Night (5.0%), Day General (4.0%), Night General (1.4%), Other (0.2%) */}
                <div style={{ flex: 50, display: "flex", gap: 4 }}>
                  {kpiField11Data.times.slice(4, 8).map((t) => (
                    <Tooltip key={t.name} label={`${t.name}: ${t.pct} (${t.count.toLocaleString()} events)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-11-local_time")}
                        style={{
                          flex: 1,
                          backgroundColor: t.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 10 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.62rem", color: "#fff", lineHeight: 1.05, textAlign: "center" }} truncate>
                          {t.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.66rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {t.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.56rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({t.count.toLocaleString()})
                        </Text>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* KPI #6: Fleet Propulsion */}
        <KpiWindowCard
          id="kpi-6-propulsion"
          title="Propulsion"
          badgeKey="aircraft_type"
          badgeColor="#f59f00"
          minWidth={minimizedCardIds.has("kpi-6-propulsion") ? "fit-content" : 420}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(245, 159, 0, 0.08) 100%)"
          borderColor="rgba(245, 159, 0, 0.3)"
          iconBgGradient="linear-gradient(135deg, #f59f00 0%, #ffc078 100%)"
          iconBoxShadow="0 4px 12px rgba(245, 159, 0, 0.35)"
          icon={<Plane size={18} color="#ffffff" />}
          subIcon={<Zap size={9} color="#ffffff" />}
          subIconBgColor="#1c7ed6"
          badgeText="12 Types"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Side: Propeller (74.6%) */}
              <Tooltip label={`Propeller: 74.6% (${kpi6Data.types[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-6-propulsion")}
                  style={{
                    flex: 72,
                    backgroundColor: "#f59f00",
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <CessnaSvg size={isMaximized ? 340 : 50} color="#ffffff" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 8 : 3 }} />
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.5rem" : "1.05rem", color: "#fff", lineHeight: 1.1 }}>
                    Propeller
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "5.8rem" : "1.25rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                    74.6%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "2.2rem" : "0.72rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                    295,997 events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 2} mt={isMaximized ? 14 : 4} align="center">
                    <Group gap={4} align="center">
                      <Skull size={isMaximized ? 28 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.8rem" : "0.7rem", opacity: 0.95 }}>
                        {kpi6Data.types[0].deaths} {kpi6Data.types[0].deathRate}
                      </Text>
                    </Group>
                    <Group gap={4} align="center">
                      <UserCheck size={isMaximized ? 28 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.8rem" : "0.7rem", opacity: 0.95 }}>
                        {kpi6Data.types[0].survivors} {kpi6Data.types[0].survivorRate}
                      </Text>
                    </Group>
                  </Stack>
                  )}
                </div>
              </Tooltip>

              {/* Right Side: Jet, Helicopter, Glider, UAV/Other */}
              <div style={{ flex: 28, display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Jet (13.6%) */}
                <Tooltip label={`Jet: 13.6% (${kpi6Data.types[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-6-propulsion")}
                    style={{
                      flex: 52,
                      backgroundColor: "#1c7ed6",
                      borderRadius: 5,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <JetSvg size={isMaximized ? 200 : 26} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 6 : 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.4rem" : "0.72rem", color: "#fff", lineHeight: 1.1 }}>
                      Jet 13.6%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.4rem" : "0.58rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                      53,812 events
                    </Text>

                    {isMaximized && (
                      <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 8 : 2} align="center">
                      <Group gap={3} align="center">
                        <Skull size={isMaximized ? 22 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.3rem" : "0.58rem", opacity: 0.95 }}>
                          {kpi6Data.types[1].deaths} {kpi6Data.types[1].deathRate}
                        </Text>
                      </Group>
                      <Group gap={3} align="center">
                        <UserCheck size={isMaximized ? 22 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.3rem" : "0.58rem", opacity: 0.95 }}>
                          {kpi6Data.types[1].survivors} {kpi6Data.types[1].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Helicopter (8.0%) */}
                <Tooltip label={`Helicopter: 8.0% (${kpi6Data.types[2].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-6-propulsion")}
                    style={{
                      flex: 32,
                      backgroundColor: "#0ca678",
                      borderRadius: 5,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 12 : "2px 4px",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <HelicopterSvg size={isMaximized ? 140 : 20} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 4 : 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.65rem", color: "#fff", lineHeight: 1.1 }}>
                      Helicopter 8.0%
                    </Text>

                    {isMaximized && (
                      <Stack gap={isMaximized ? 2 : 1} mt={isMaximized ? 6 : 1} align="center">
                      <Group gap={3} align="center">
                        <Skull size={isMaximized ? 18 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.54rem", opacity: 0.95 }}>
                          {kpi6Data.types[2].deaths} {kpi6Data.types[2].deathRate}
                        </Text>
                      </Group>
                      <Group gap={3} align="center">
                        <UserCheck size={isMaximized ? 18 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.54rem", opacity: 0.95 }}>
                          {kpi6Data.types[2].survivors} {kpi6Data.types[2].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Bottom Row: Glider + UAV/Other */}
                <div style={{ flex: 20, display: "flex", gap: 4 }}>
                  <Tooltip label={`Glider: 2.6% (${kpi6Data.types[3].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-6-propulsion")}
                      style={{
                        flex: 60,
                        backgroundColor: "#7950f2",
                        borderRadius: 4,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: isMaximized ? 4 : 1,
                        color: "#ffffff",
                        padding: isMaximized ? "12px 8px" : "2px 4px",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.58rem", color: "#fff", lineHeight: 1.1 }}>
                        Glider 2.6%
                      </Text>

                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 16 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.9rem" : "0.5rem", opacity: 0.95 }}>
                            {kpi6Data.types[3].deaths} {kpi6Data.types[3].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 16 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.9rem" : "0.5rem", opacity: 0.95 }}>
                            {kpi6Data.types[3].survivors} {kpi6Data.types[3].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>

                  <Tooltip label={`UAV & Other: 1.2% (${(kpi6Data.types[4].count + kpi6Data.types[5].count).toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-6-propulsion")}
                      style={{
                        flex: 40,
                        backgroundColor: "#868e96",
                        borderRadius: 4,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: isMaximized ? 4 : 1,
                        color: "#ffffff",
                        padding: isMaximized ? "8px 12px" : "2px 4px",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.56rem", color: "#fff", lineHeight: 1.1 }}>
                        Other 1.2%
                      </Text>

                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 16 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.9rem" : "0.48rem", opacity: 0.95 }}>
                            3.3k 0.8%
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 16 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.9rem" : "0.48rem", opacity: 0.95 }}>
                            10.5k 0.6%
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #13 KPI Card: aircraft_designation (Treemap) */}
        <KpiWindowCard
          id="kpi-field-13-aircraft_designation"
          title="Designation"
          badgeKey="aircraft_designation"
          badgeColor="#f59f00"
          badgeText="Field 13 / 57 • 2 Designations"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(245, 159, 0, 0.08) 100%)"
          borderColor="rgba(245, 159, 0, 0.3)"
          iconBgGradient="linear-gradient(135deg, #f59f00 0%, #ffc078 100%)"
          iconBoxShadow="0 4px 12px rgba(245, 159, 0, 0.35)"
          icon={<Plane size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Main Tile: Civil (64.4%) */}
              <Tooltip label={`Civil: 64.4% (${kpiField13Data.designations[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-field-13-aircraft_designation")}
                  style={{
                    flex: 644,
                    backgroundColor: kpiField13Data.designations[0].bg,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <AirbusA380Svg
                    size={isMaximized ? 340 : 65}
                    color="#ffffff"
                    style={{
                      filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
                      marginBottom: isMaximized ? 8 : 3,
                      maxWidth: isMaximized ? "80%" : "85%",
                    }}
                  />
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.5rem" : "1.2rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    Civil
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "5.5rem" : "1.6rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1, textAlign: "center" }}>
                    64.4%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "2.0rem" : "0.8rem", color: "rgba(255,255,255,0.9)", marginTop: 2, lineHeight: 1.1, textAlign: "center" }}>
                    255,526 events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 2} mt={isMaximized ? 14 : 4} align="center">
                      <Group gap={4} align="center">
                        <Skull size={isMaximized ? 28 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.8rem" : "0.7rem", opacity: 0.95 }}>
                          {kpiField13Data.designations[0].deaths} {kpiField13Data.designations[0].deathRate}
                        </Text>
                      </Group>
                      <Group gap={4} align="center">
                        <UserCheck size={isMaximized ? 28 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.8rem" : "0.7rem", opacity: 0.95 }}>
                          {kpiField13Data.designations[0].survivors} {kpiField13Data.designations[0].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                  )}
                </div>
              </Tooltip>

              {/* Right Main Tile: Military (35.6%) */}
              <Tooltip label={`Military: 35.6% (${kpiField13Data.designations[1].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-field-13-aircraft_designation")}
                  style={{
                    flex: 356,
                    backgroundColor: kpiField13Data.designations[1].bg,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <F22RaptorSideSvg
                    size={isMaximized ? 320 : 60}
                    color="#ffffff"
                    style={{
                      filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
                      marginBottom: isMaximized ? 8 : 3,
                      maxWidth: isMaximized ? "80%" : "85%",
                    }}
                  />
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.1rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    Military
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "4.8rem" : "1.45rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1, textAlign: "center" }}>
                    35.6%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.75rem", color: "rgba(255,255,255,0.9)", marginTop: 2, lineHeight: 1.1, textAlign: "center" }}>
                    141,227 events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 2} mt={isMaximized ? 14 : 4} align="center">
                      <Group gap={4} align="center">
                        <Skull size={isMaximized ? 28 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.8rem" : "0.7rem", opacity: 0.95 }}>
                          {kpiField13Data.designations[1].deaths} {kpiField13Data.designations[1].deathRate}
                        </Text>
                      </Group>
                      <Group gap={4} align="center">
                        <UserCheck size={isMaximized ? 28 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.8rem" : "0.7rem", opacity: 0.95 }}>
                          {kpiField13Data.designations[1].survivors} {kpiField13Data.designations[1].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                  )}
                </div>
              </Tooltip>
            </div>
          )}
        </KpiWindowCard>

        {/* KPI #11: Aircraft Manufacturer */}
        <KpiWindowCard
          id="kpi-11-manufacturer"
          title="Aircraft Manufacturer"
          badgeKey="aircraft_manufacturer"
          badgeColor="#e8590c"
          subBadgeText={`${kpi11Data.totalManufacturers.toLocaleString()} Registered Makers`}
          minWidth={minimizedCardIds.has("kpi-11-manufacturer") ? "fit-content" : maximizedCardId === "kpi-11-manufacturer" ? "100%" : 440}
          flexWidth={maximizedCardId === "kpi-11-manufacturer" ? "1 1 100%" : "1 1 440px"}
          bgGradient="linear-gradient(145deg, rgba(232, 89, 12, 0.04) 0%, rgba(28, 126, 214, 0.08) 100%)"
          borderColor="rgba(232, 89, 12, 0.3)"
          iconBgGradient="linear-gradient(135deg, #e8590c 0%, #f76707 100%)"
          iconBoxShadow="0 4px 12px rgba(232, 89, 12, 0.35)"
          icon={<Cpu size={18} color="#ffffff" />}
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Main Tile: Other & Custom Manufacturers (69.5%) */}
              <Tooltip label={`Other: 69.5% (${kpi11Data.manufacturers[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-11-manufacturer")}
                  style={{
                    flex: 695,
                    background: kpi11Data.manufacturers[0].bg,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 4 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Text fw={900} style={{ fontSize: isMaximized ? "2.8rem" : "1.15rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    Other
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "4.5rem" : "1.4rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                    69.5%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.75rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                    275,902 events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 14 : 4} align="center">
                    <Group gap={4} align="center">
                      <Skull size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.75rem", opacity: 0.95 }}>
                        {kpi11Data.manufacturers[0].deaths} {kpi11Data.manufacturers[0].deathRate}
                      </Text>
                    </Group>
                    <Group gap={4} align="center">
                      <UserCheck size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.75rem", opacity: 0.95 }}>
                        {kpi11Data.manufacturers[0].survivors} {kpi11Data.manufacturers[0].survivorRate}
                      </Text>
                    </Group>
                  </Stack>
                  )}
                </div>
              </Tooltip>

              {/* Right Stack: Cessna, Piper, Douglas, Boeing & Airbus */}
              <div style={{ display: "flex", flexDirection: "column", flex: 305, gap: 4 }}>
                {/* Top Row: Cessna (13.2%) */}
                <Tooltip label={`Cessna: 13.2% (${kpi11Data.manufacturers[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-11-manufacturer")}
                    style={{
                      flex: 132,
                      background: kpi11Data.manufacturers[1].bg,
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      gap: isMaximized ? 2 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.88rem", color: "#fff", lineHeight: 1.1 }}>
                      Cessna 13.2%
                    </Text>
                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                      <Group gap={3} align="center">
                        <Skull size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.62rem", opacity: 0.95 }}>
                          {kpi11Data.manufacturers[1].deaths} {kpi11Data.manufacturers[1].deathRate}
                        </Text>
                      </Group>
                      <Group gap={3} align="center">
                        <UserCheck size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.62rem", opacity: 0.95 }}>
                          {kpi11Data.manufacturers[1].survivors} {kpi11Data.manufacturers[1].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Bottom Row: Piper (8.3%), Douglas (3.9%), Boeing (3.8%) & Airbus (1.3%) */}
                <div style={{ display: "flex", flex: 173, gap: 4, width: "100%" }}>
                  {/* Piper (8.3%) */}
                  <Tooltip label={`Piper: 8.3% (${kpi11Data.manufacturers[2].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-11-manufacturer")}
                      style={{
                        flex: 83,
                        background: kpi11Data.manufacturers[2].bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#ffffff",
                        padding: isMaximized ? 12 : 3,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.72rem", color: "#fff", lineHeight: 1.1 }}>
                        Piper 8.3%
                      </Text>
                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.52rem" }}>
                            {kpi11Data.manufacturers[2].deaths} {kpi11Data.manufacturers[2].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.52rem" }}>
                            {kpi11Data.manufacturers[2].survivors} {kpi11Data.manufacturers[2].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>

                  {/* Douglas (3.9%) */}
                  <Tooltip label={`Douglas: 3.9% (${kpi11Data.manufacturers[3].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-11-manufacturer")}
                      style={{
                        flex: 39,
                        background: kpi11Data.manufacturers[3].bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#ffffff",
                        padding: isMaximized ? 12 : 3,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.65rem", color: "#fff", lineHeight: 1.1 }}>
                        Douglas 3.9%
                      </Text>
                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.52rem" }}>
                            {kpi11Data.manufacturers[3].deaths} {kpi11Data.manufacturers[3].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.52rem" }}>
                            {kpi11Data.manufacturers[3].survivors} {kpi11Data.manufacturers[3].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>

                  {/* Boeing (3.8%) */}
                  <Tooltip label={`Boeing: 3.8% (${kpi11Data.manufacturers[4].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-11-manufacturer")}
                      style={{
                        flex: 38,
                        background: kpi11Data.manufacturers[4].bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#ffffff",
                        padding: isMaximized ? 12 : 3,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.65rem", color: "#fff", lineHeight: 1.1 }}>
                        Boeing 3.8%
                      </Text>
                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.52rem" }}>
                            {kpi11Data.manufacturers[4].deaths} {kpi11Data.manufacturers[4].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.52rem" }}>
                            {kpi11Data.manufacturers[4].survivors} {kpi11Data.manufacturers[4].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>

                  {/* Airbus (1.3%) */}
                  <Tooltip label={`Airbus: 1.3% (${kpi11Data.manufacturers[5].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-11-manufacturer")}
                      style={{
                        flex: 13,
                        background: kpi11Data.manufacturers[5].bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#ffffff",
                        padding: isMaximized ? 12 : 2,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "#fff", lineHeight: 1.1 }}>
                        Airbus 1.3%
                      </Text>
                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 12 : 6} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.75rem" : "0.45rem" }}>
                            {kpi11Data.manufacturers[5].deaths} {kpi11Data.manufacturers[5].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 12 : 6} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.75rem" : "0.45rem" }}>
                            {kpi11Data.manufacturers[5].survivors} {kpi11Data.manufacturers[5].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #18 KPI Card: aircraft_common_name (Treemap) */}
        <KpiWindowCard
          id="kpi-field-18-aircraft_common_name"
          title="Aircraft Model"
          badgeKey="aircraft_common_name"
          badgeColor="#37b24d"
          badgeText="Field 18 / 57 • 21,011 Common Names"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(55, 178, 77, 0.08) 100%)"
          borderColor="rgba(55, 178, 77, 0.3)"
          iconBgGradient="linear-gradient(135deg, #37b24d 0%, #2b8a3e 100%)"
          iconBoxShadow="0 4px 12px rgba(55, 178, 77, 0.35)"
          icon={<Plane size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Main Tile: Other Common Models (85.1%) */}
              <Tooltip label={`Other Common Models: 85.1% (${kpiField18Data.commonModels[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-field-18-aircraft_common_name")}
                  style={{
                    flex: 40,
                    backgroundColor: kpiField18Data.commonModels[0].bg,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <Plane size={isMaximized ? 180 : 38} color="#ffffff" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 8 : 2 }} />
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.5rem" : "1.1rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    Other
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "5.5rem" : "1.45rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1, textAlign: "center" }}>
                    85.1%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "2.0rem" : "0.75rem", color: "rgba(255,255,255,0.9)", marginTop: 2, lineHeight: 1.1, textAlign: "center" }}>
                    337,653 events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 2} mt={isMaximized ? 14 : 4} align="center">
                      <Group gap={4} align="center">
                        <Skull size={isMaximized ? 28 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.8rem" : "0.7rem", opacity: 0.95 }}>
                          {kpiField18Data.commonModels[0].deaths} {kpiField18Data.commonModels[0].deathRate}
                        </Text>
                      </Group>
                      <Group gap={4} align="center">
                        <UserCheck size={isMaximized ? 28 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.8rem" : "0.7rem", opacity: 0.95 }}>
                          {kpiField18Data.commonModels[0].survivors} {kpiField18Data.commonModels[0].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                  )}
                </div>
              </Tooltip>

              {/* Right Side: Grid of 3 Rows for Common Models */}
              <div style={{ flex: 60, display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Row 1: Skyhawk (3.0%), Cherokee (2.5%), Cessna 150 (1.4%), Skylane (1.4%) */}
                <div style={{ flex: 34, display: "flex", gap: 4 }}>
                  {kpiField18Data.commonModels.slice(1, 5).map((cm) => {
                    const ModelIcon = cm.Icon;
                    return (
                      <Tooltip key={cm.name} label={`${cm.name}: ${cm.pct} (${cm.count.toLocaleString()} events)`} withArrow>
                        <div
                          onClick={() => handleToggleMaximize("kpi-field-18-aircraft_common_name")}
                          style={{
                            flex: 1,
                            backgroundColor: cm.bg,
                            borderRadius: 5,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "#ffffff",
                            padding: isMaximized ? 12 : 2,
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                            cursor: "pointer",
                            overflow: "hidden",
                          }}
                        >
                          {ModelIcon && (
                            <ModelIcon
                              size={isMaximized ? 150 : 28}
                              style={{
                                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
                                marginBottom: isMaximized ? 6 : 1,
                                maxWidth: "90%",
                              }}
                            />
                          )}
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.65rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                            {cm.label}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.68rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            {cm.pct}
                          </Text>
                          <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.58rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            ({cm.count.toLocaleString()})
                          </Text>

                          {isMaximized && (
                            <Stack gap={1} mt={6} align="center">
                              <Group gap={3} align="center">
                                <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.deaths} {cm.deathRate}
                                </Text>
                              </Group>
                              <Group gap={3} align="center">
                                <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.survivors} {cm.survivorRate}
                                </Text>
                              </Group>
                            </Stack>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Row 2: Mosquito (1.3%), Corsair (1.1%), Bonanza (1.1%), DC-3 (1.1%) */}
                <div style={{ flex: 33, display: "flex", gap: 4 }}>
                  {kpiField18Data.commonModels.slice(5, 9).map((cm) => {
                    const ModelIcon = cm.Icon;
                    return (
                      <Tooltip key={cm.name} label={`${cm.name}: ${cm.pct} (${cm.count.toLocaleString()} events)`} withArrow>
                        <div
                          onClick={() => handleToggleMaximize("kpi-field-18-aircraft_common_name")}
                          style={{
                            flex: 1,
                            backgroundColor: cm.bg,
                            borderRadius: 5,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "#ffffff",
                            padding: isMaximized ? 10 : 2,
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                            cursor: "pointer",
                            overflow: "hidden",
                          }}
                        >
                          {ModelIcon && (
                            <ModelIcon
                              size={isMaximized ? 140 : 26}
                              style={{
                                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
                                marginBottom: isMaximized ? 6 : 1,
                                maxWidth: "90%",
                              }}
                            />
                          )}
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.65rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                            {cm.label}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.65rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            {cm.pct}
                          </Text>
                          <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            ({cm.count.toLocaleString()})
                          </Text>

                          {isMaximized && (
                            <Stack gap={1} mt={6} align="center">
                              <Group gap={3} align="center">
                                <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.deaths} {cm.deathRate}
                                </Text>
                              </Group>
                              <Group gap={3} align="center">
                                <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.survivors} {cm.survivorRate}
                                </Text>
                              </Group>
                            </Stack>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Row 3: Glider (1.0%), Super Cub (0.9%), Not Recorded (0.3%) */}
                <div style={{ flex: 33, display: "flex", gap: 4 }}>
                  {kpiField18Data.commonModels.slice(9, 12).map((cm) => {
                    const ModelIcon = cm.Icon;
                    return (
                      <Tooltip key={cm.name} label={`${cm.name}: ${cm.pct} (${cm.count.toLocaleString()} events)`} withArrow>
                        <div
                          onClick={() => handleToggleMaximize("kpi-field-18-aircraft_common_name")}
                          style={{
                            flex: cm.name === "Not Recorded" ? 1.2 : 1,
                            backgroundColor: cm.bg,
                            borderRadius: 5,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "#ffffff",
                            padding: isMaximized ? 8 : 2,
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                            cursor: "pointer",
                            overflow: "hidden",
                          }}
                        >
                          {ModelIcon && (
                            <ModelIcon
                              size={isMaximized ? 130 : 25}
                              style={{
                                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
                                marginBottom: isMaximized ? 4 : 1,
                                maxWidth: "90%",
                              }}
                            />
                          )}
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.58rem", color: "#fff", lineHeight: 1.05, textAlign: "center" }}>
                            {cm.label === "Not Recorded" ? (
                              <>
                                <span>Not</span>
                                <br />
                                <span>Recorded</span>
                              </>
                            ) : (
                              cm.label
                            )}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.62rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            {cm.pct}
                          </Text>
                          <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.52rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            ({cm.count.toLocaleString()})
                          </Text>

                          {isMaximized && (
                            <Stack gap={1} mt={6} align="center">
                              <Group gap={3} align="center">
                                <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.deaths} {cm.deathRate}
                                </Text>
                              </Group>
                              <Group gap={3} align="center">
                                <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.survivors} {cm.survivorRate}
                                </Text>
                              </Group>
                            </Stack>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* KPI: Civil Model (Filtered aircraft_designation = 'Civil', Top 10, No Other / Not Recorded) */}
        <KpiWindowCard
          id="kpi-field-18-civil_model"
          title="Civil Model"
          badgeKey="aircraft_common_name"
          badgeColor="#f59f00"
          badgeText="255,526 Civil Events • Top 10 Models"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(245, 159, 0, 0.05) 0%, rgba(28, 126, 214, 0.05) 100%)"
          borderColor="rgba(245, 159, 0, 0.35)"
          iconBgGradient="linear-gradient(135deg, #f59f00 0%, #d9480f 100%)"
          iconBoxShadow="0 4px 12px rgba(245, 159, 0, 0.35)"
          icon={<Plane size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#f59f00"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              onClick={() => handleToggleMaximize("kpi-field-18-civil_model")}
              style={{
                display: "flex",
                gap: 6,
                height: isMaximized ? "calc(100vh - 175px)" : 180,
                minHeight: isMaximized ? 640 : 180,
                width: "100%",
                boxSizing: "border-box",
                cursor: "pointer",
                alignItems: "stretch",
              }}
            >
              {/* Left Main Hero Tile: Skyhawk */}
              {(() => {
                const lead = kpiCivilModelData.models[0];
                const LeadIcon = lead.Icon;
                return (
                  <Tooltip label={`${lead.name}: ${lead.pct} (${lead.count.toLocaleString()} events)`} withArrow>
                    <div
                      style={{
                        flex: 38,
                        backgroundColor: lead.bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        alignSelf: "stretch",
                        height: "100%",
                        padding: isMaximized ? "24px 16px" : "8px 4px",
                        position: "relative",
                        overflow: "hidden",
                        boxSizing: "border-box",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {LeadIcon && (
                        <LeadIcon
                          size={isMaximized ? 260 : 54}
                          style={{
                            marginBottom: isMaximized ? 12 : 2,
                            maxWidth: "92%",
                          }}
                        />
                      )}
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.95rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                        {lead.label}
                      </Text>
                      <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.4rem", color: "#fff", lineHeight: 1.1, marginTop: 2, textAlign: "center" }}>
                        {lead.pct}
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.6rem" : "0.72rem", color: "rgba(255,255,255,0.9)", marginTop: 2, textAlign: "center" }}>
                        {lead.count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={14} align="center">
                          <Group gap={6} align="center">
                            <Skull size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.deaths} {lead.deathRate}
                            </Text>
                          </Group>
                          <Group gap={6} align="center">
                            <UserCheck size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.survivors} {lead.survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>
                );
              })()}

              {/* Right Side: 3 rows of 3 models each */}
              <div style={{ flex: 62, display: "flex", flexDirection: "column", gap: 4, height: "100%", alignSelf: "stretch" }}>
                {/* Row 1: Cherokee (3.8%), Cessna 150 (2.2%), Skylane (2.1%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiCivilModelData.models.slice(1, 4).map((cm) => {
                    const ModelIcon = cm.Icon;
                    return (
                      <Tooltip key={cm.name} label={`${cm.name}: ${cm.pct} (${cm.count.toLocaleString()} events)`} withArrow>
                        <div
                          style={{
                            flex: 1,
                            backgroundColor: cm.bg,
                            borderRadius: 5,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            alignSelf: "stretch",
                            height: "100%",
                            padding: isMaximized ? "12px 6px" : "2px 2px",
                            position: "relative",
                            overflow: "hidden",
                            boxSizing: "border-box",
                          }}
                        >
                          {ModelIcon && (
                            <ModelIcon
                              size={isMaximized ? 140 : 34}
                              style={{
                                marginBottom: isMaximized ? 6 : 1,
                                maxWidth: "90%",
                              }}
                            />
                          )}
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.65rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                            {cm.label}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.65rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            {cm.pct}
                          </Text>
                          <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            ({cm.count.toLocaleString()})
                          </Text>

                          {isMaximized && (
                            <Stack gap={1} mt={6} align="center">
                              <Group gap={3} align="center">
                                <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.deaths} {cm.deathRate}
                                </Text>
                              </Group>
                              <Group gap={3} align="center">
                                <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.survivors} {cm.survivorRate}
                                </Text>
                              </Group>
                            </Stack>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Row 2: Bonanza (1.7%), Glider (1.5%), Super Cub (1.4%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiCivilModelData.models.slice(4, 7).map((cm) => {
                    const ModelIcon = cm.Icon;
                    return (
                      <Tooltip key={cm.name} label={`${cm.name}: ${cm.pct} (${cm.count.toLocaleString()} events)`} withArrow>
                        <div
                          style={{
                            flex: 1,
                            backgroundColor: cm.bg,
                            borderRadius: 5,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            alignSelf: "stretch",
                            height: "100%",
                            padding: isMaximized ? "12px 6px" : "2px 2px",
                            position: "relative",
                            overflow: "hidden",
                            boxSizing: "border-box",
                          }}
                        >
                          {ModelIcon && (
                            <ModelIcon
                              size={isMaximized ? 140 : 34}
                              style={{
                                marginBottom: isMaximized ? 6 : 1,
                                maxWidth: "90%",
                              }}
                            />
                          )}
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.65rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                            {cm.label}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.65rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            {cm.pct}
                          </Text>
                          <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            ({cm.count.toLocaleString()})
                          </Text>

                          {isMaximized && (
                            <Stack gap={1} mt={6} align="center">
                              <Group gap={3} align="center">
                                <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.deaths} {cm.deathRate}
                                </Text>
                              </Group>
                              <Group gap={3} align="center">
                                <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.survivors} {cm.survivorRate}
                                </Text>
                              </Group>
                            </Stack>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Row 3: Cessna 152 (1.3%), Centurion (1.3%), Stationair (0.9%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiCivilModelData.models.slice(7, 10).map((cm) => {
                    const ModelIcon = cm.Icon;
                    return (
                      <Tooltip key={cm.name} label={`${cm.name}: ${cm.pct} (${cm.count.toLocaleString()} events)`} withArrow>
                        <div
                          style={{
                            flex: 1,
                            backgroundColor: cm.bg,
                            borderRadius: 5,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            alignSelf: "stretch",
                            height: "100%",
                            padding: isMaximized ? "12px 6px" : "2px 2px",
                            position: "relative",
                            overflow: "hidden",
                            boxSizing: "border-box",
                          }}
                        >
                          {ModelIcon && (
                            <ModelIcon
                              size={isMaximized ? 140 : 34}
                              style={{
                                marginBottom: isMaximized ? 6 : 1,
                                maxWidth: "90%",
                              }}
                            />
                          )}
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.65rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                            {cm.label}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.65rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            {cm.pct}
                          </Text>
                          <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            ({cm.count.toLocaleString()})
                          </Text>

                          {isMaximized && (
                            <Stack gap={1} mt={6} align="center">
                              <Group gap={3} align="center">
                                <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.deaths} {cm.deathRate}
                                </Text>
                              </Group>
                              <Group gap={3} align="center">
                                <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.survivors} {cm.survivorRate}
                                </Text>
                              </Group>
                            </Stack>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* KPI: Military Model (Filtered aircraft_designation = 'Military', Top 10, No Other / Not Recorded) */}
        <KpiWindowCard
          id="kpi-field-18-military_model"
          title="Military Model"
          badgeKey="aircraft_common_name"
          badgeColor="#1c7ed6"
          badgeText="141,227 Military Events • Top 10 Models"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(28, 126, 214, 0.05) 0%, rgba(214, 51, 108, 0.05) 100%)"
          borderColor="rgba(28, 126, 214, 0.35)"
          iconBgGradient="linear-gradient(135deg, #1c7ed6 0%, #1864ab 100%)"
          iconBoxShadow="0 4px 12px rgba(28, 126, 214, 0.35)"
          icon={<Plane size={18} color="#ffffff" />}
          subIcon={<Crosshair size={9} color="#ffffff" />}
          subIconBgColor="#1c7ed6"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              onClick={() => handleToggleMaximize("kpi-field-18-military_model")}
              style={{
                display: "flex",
                gap: 6,
                height: isMaximized ? "calc(100vh - 175px)" : 180,
                minHeight: isMaximized ? 640 : 180,
                width: "100%",
                boxSizing: "border-box",
                cursor: "pointer",
                alignItems: "stretch",
              }}
            >
              {/* Left Main Hero Tile: Mosquito */}
              {(() => {
                const lead = kpiMilitaryModelData.models[0];
                const LeadIcon = lead.Icon;
                return (
                  <Tooltip label={`${lead.name}: ${lead.pct} (${lead.count.toLocaleString()} events)`} withArrow>
                    <div
                      style={{
                        flex: 38,
                        backgroundColor: lead.bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        alignSelf: "stretch",
                        height: "100%",
                        padding: isMaximized ? "24px 16px" : "8px 4px",
                        position: "relative",
                        overflow: "hidden",
                        boxSizing: "border-box",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {LeadIcon && (
                        <LeadIcon
                          size={isMaximized ? 260 : 54}
                          style={{
                            marginBottom: isMaximized ? 12 : 2,
                            maxWidth: "92%",
                          }}
                        />
                      )}
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.95rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                        {lead.label}
                      </Text>
                      <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.4rem", color: "#fff", lineHeight: 1.1, marginTop: 2, textAlign: "center" }}>
                        {lead.pct}
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.6rem" : "0.72rem", color: "rgba(255,255,255,0.9)", marginTop: 2, textAlign: "center" }}>
                        {lead.count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={14} align="center">
                          <Group gap={6} align="center">
                            <Skull size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.deaths} {lead.deathRate}
                            </Text>
                          </Group>
                          <Group gap={6} align="center">
                            <UserCheck size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.survivors} {lead.survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>
                );
              })()}

              {/* Right Side: 3 rows of 3 models each */}
              <div style={{ flex: 62, display: "flex", flexDirection: "column", gap: 4, height: "100%", alignSelf: "stretch" }}>
                {/* Row 1: Corsair (3.0%), DC-3 (2.7%), Spitfire (2.5%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiMilitaryModelData.models.slice(1, 4).map((cm) => {
                    const ModelIcon = cm.Icon;
                    return (
                      <Tooltip key={cm.name} label={`${cm.name}: ${cm.pct} (${cm.count.toLocaleString()} events)`} withArrow>
                        <div
                          style={{
                            flex: 1,
                            backgroundColor: cm.bg,
                            borderRadius: 5,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            alignSelf: "stretch",
                            height: "100%",
                            padding: isMaximized ? "12px 6px" : "2px 2px",
                            position: "relative",
                            overflow: "hidden",
                            boxSizing: "border-box",
                          }}
                        >
                          {ModelIcon && (
                            <ModelIcon
                              size={isMaximized ? 140 : 34}
                              style={{
                                marginBottom: isMaximized ? 6 : 1,
                                maxWidth: "90%",
                              }}
                            />
                          )}
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.65rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                            {cm.label}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.65rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            {cm.pct}
                          </Text>
                          <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            ({cm.count.toLocaleString()})
                          </Text>

                          {isMaximized && (
                            <Stack gap={1} mt={6} align="center">
                              <Group gap={3} align="center">
                                <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.deaths} {cm.deathRate}
                                </Text>
                              </Group>
                              <Group gap={3} align="center">
                                <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.survivors} {cm.survivorRate}
                                </Text>
                              </Group>
                            </Stack>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Row 2: Mustang (2.5%), Thunderbolt (2.1%), Liberator (2.1%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiMilitaryModelData.models.slice(4, 7).map((cm) => {
                    const ModelIcon = cm.Icon;
                    return (
                      <Tooltip key={cm.name} label={`${cm.name}: ${cm.pct} (${cm.count.toLocaleString()} events)`} withArrow>
                        <div
                          style={{
                            flex: 1,
                            backgroundColor: cm.bg,
                            borderRadius: 5,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            alignSelf: "stretch",
                            height: "100%",
                            padding: isMaximized ? "12px 6px" : "2px 2px",
                            position: "relative",
                            overflow: "hidden",
                            boxSizing: "border-box",
                          }}
                        >
                          {ModelIcon && (
                            <ModelIcon
                              size={isMaximized ? 140 : 34}
                              style={{
                                marginBottom: isMaximized ? 6 : 1,
                                maxWidth: "90%",
                              }}
                            />
                          )}
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.65rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                            {cm.label}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.65rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            {cm.pct}
                          </Text>
                          <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            ({cm.count.toLocaleString()})
                          </Text>

                          {isMaximized && (
                            <Stack gap={1} mt={6} align="center">
                              <Group gap={3} align="center">
                                <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.deaths} {cm.deathRate}
                                </Text>
                              </Group>
                              <Group gap={3} align="center">
                                <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.survivors} {cm.survivorRate}
                                </Text>
                              </Group>
                            </Stack>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Row 3: Texan (1.9%), Blenheim (1.8%), Shooting Star (1.8%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiMilitaryModelData.models.slice(7, 10).map((cm) => {
                    const ModelIcon = cm.Icon;
                    return (
                      <Tooltip key={cm.name} label={`${cm.name}: ${cm.pct} (${cm.count.toLocaleString()} events)`} withArrow>
                        <div
                          style={{
                            flex: 1,
                            backgroundColor: cm.bg,
                            borderRadius: 5,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            alignSelf: "stretch",
                            height: "100%",
                            padding: isMaximized ? "12px 6px" : "2px 2px",
                            position: "relative",
                            overflow: "hidden",
                            boxSizing: "border-box",
                          }}
                        >
                          {ModelIcon && (
                            <ModelIcon
                              size={isMaximized ? 140 : 34}
                              style={{
                                marginBottom: isMaximized ? 6 : 1,
                                maxWidth: "90%",
                              }}
                            />
                          )}
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.65rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                            {cm.label}
                          </Text>
                          <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.65rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            {cm.pct}
                          </Text>
                          <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                            ({cm.count.toLocaleString()})
                          </Text>

                          {isMaximized && (
                            <Stack gap={1} mt={6} align="center">
                              <Group gap={3} align="center">
                                <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.deaths} {cm.deathRate}
                                </Text>
                              </Group>
                              <Group gap={3} align="center">
                                <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                                <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                  {cm.survivors} {cm.survivorRate}
                                </Text>
                              </Group>
                            </Stack>
                          )}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* KPI #10: Fleet Operator */}
        <KpiWindowCard
          id="kpi-10-operator"
          title="Fleet Operator"
          badgeKey="operator"
          badgeColor="#7950f2"
          subBadgeText={`${kpi10Data.totalOperators.toLocaleString()} Registered Fleets`}
          minWidth={minimizedCardIds.has("kpi-10-operator") ? "fit-content" : maximizedCardId === "kpi-10-operator" ? "100%" : 440}
          flexWidth={maximizedCardId === "kpi-10-operator" ? "1 1 100%" : "1 1 440px"}
          bgGradient="linear-gradient(145deg, rgba(121, 80, 242, 0.04) 0%, rgba(28, 126, 214, 0.08) 100%)"
          borderColor="rgba(121, 80, 242, 0.3)"
          iconBgGradient="linear-gradient(135deg, #7950f2 0%, #9c36b5 100%)"
          iconBoxShadow="0 4px 12px rgba(121, 80, 242, 0.35)"
          icon={<Briefcase size={18} color="#ffffff" />}
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Main Tile: General Aviation & Private Operators (62.3%) */}
              <Tooltip label={`General Aviation & Private: 62.3% (${kpi10Data.categories[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-10-operator")}
                  style={{
                    flex: 623,
                    background: kpi10Data.categories[0].bg,
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 4 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <ExecBizjetTopDownSvg size={isMaximized ? 170 : 54} color="#ffffff" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 8 : 2 }} />
                  <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "1.0rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    General Aviation
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "4.5rem" : "1.3rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                    62.3%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.72rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                    247,159 events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 14 : 4} align="center">
                    <Group gap={4} align="center">
                      <Skull size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.75rem", opacity: 0.95 }}>
                        {kpi10Data.categories[0].deaths} {kpi10Data.categories[0].deathRate}
                      </Text>
                    </Group>
                    <Group gap={4} align="center">
                      <UserCheck size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.75rem", opacity: 0.95 }}>
                        {kpi10Data.categories[0].survivors} {kpi10Data.categories[0].survivorRate}
                      </Text>
                    </Group>
                  </Stack>
                  )}
                </div>
              </Tooltip>

              {/* Right Stack: Military & Commercial Tiles */}
              <div style={{ display: "flex", flexDirection: "column", flex: 377, gap: 4 }}>
                {/* Top Right Tile: Military & Defense Air Arms (30.1%) */}
                <Tooltip label={`Military & Defense: 30.1% (${kpi10Data.categories[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-10-operator")}
                    style={{
                      flex: 301,
                      background: kpi10Data.categories[1].bg,
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      gap: isMaximized ? 2 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <F22RaptorTopDownSvg size={isMaximized ? 100 : 36} color="#ffffff" style={{ marginBottom: 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.85rem", color: "#fff", lineHeight: 1.1 }}>
                      Military 30.1%
                    </Text>
                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                      <Group gap={3} align="center">
                        <Skull size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.62rem", opacity: 0.95 }}>
                          {kpi10Data.categories[1].deaths} {kpi10Data.categories[1].deathRate}
                        </Text>
                      </Group>
                      <Group gap={3} align="center">
                        <UserCheck size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.62rem", opacity: 0.95 }}>
                          {kpi10Data.categories[1].survivors} {kpi10Data.categories[1].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Bottom Right Tile: Commercial Airlines (7.6%) */}
                <Tooltip label={`Commercial Airlines: 7.6% (${kpi10Data.categories[2].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-10-operator")}
                    style={{
                      flex: 76,
                      background: kpi10Data.categories[2].bg,
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 12 : 3,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <AirbusA380TopDownSvg size={isMaximized ? 70 : 24} color="#ffffff" style={{ marginBottom: 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.72rem", color: "#fff", lineHeight: 1.1 }}>
                      Commercial 7.6%
                    </Text>
                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                      <Group gap={2} align="center">
                        <Skull size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.90rem" : "0.55rem" }}>
                          {kpi10Data.categories[2].deaths} {kpi10Data.categories[2].deathRate}
                        </Text>
                      </Group>
                      <Group gap={2} align="center">
                        <UserCheck size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.90rem" : "0.55rem" }}>
                          {kpi10Data.categories[2].survivors} {kpi10Data.categories[2].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
        </KpiWindowCard>

        

        

        {/* Field #22 KPI Card: year_of_manufacture (Treemap) */}
        <KpiWindowCard
          id="kpi-field-22-year_of_manufacture"
          title="Manufacture Year"
          badgeKey="year_of_manufacture"
          badgeColor="#0ca678"
          badgeText="Field 22 / 57 • 111 Manufacture Years"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(12, 166, 120, 0.05) 0%, rgba(28, 126, 214, 0.05) 100%)"
          borderColor="rgba(12, 166, 120, 0.35)"
          iconBgGradient="linear-gradient(135deg, #0ca678 0%, #087f5b 100%)"
          iconBoxShadow="0 4px 12px rgba(12, 166, 120, 0.35)"
          icon={<Calendar size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              onClick={() => handleToggleMaximize("kpi-field-22-year_of_manufacture")}
              style={{
                display: "flex",
                gap: 6,
                height: isMaximized ? "calc(100vh - 175px)" : 180,
                minHeight: isMaximized ? 640 : 180,
                width: "100%",
                boxSizing: "border-box",
                cursor: "pointer",
                alignItems: "stretch",
              }}
            >
              {/* Left Main Hero Tile: Not Recorded (70.5%) */}
              {(() => {
                const lead = kpiField22Data.decades[0];
                return (
                  <Tooltip label={`${lead.name}: ${lead.pct} (${lead.count.toLocaleString()} events)`} withArrow>
                    <div
                      style={{
                        flex: 38,
                        backgroundColor: lead.bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        alignSelf: "stretch",
                        height: "100%",
                        padding: isMaximized ? "24px 16px" : "8px 4px",
                        position: "relative",
                        overflow: "hidden",
                        boxSizing: "border-box",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Calendar
                        size={isMaximized ? 180 : 44}
                        color="#ffffff"
                        style={{
                          marginBottom: isMaximized ? 14 : 4,
                          opacity: 0.95,
                        }}
                      />
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.95rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                        {lead.label}
                      </Text>
                      <Text fw={900} style={{ fontSize: isMaximized ? "3.4rem" : "1.4rem", color: "#fff", lineHeight: 1.1, marginTop: 2, textAlign: "center" }}>
                        {lead.pct}
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.6rem" : "0.72rem", color: "rgba(255,255,255,0.9)", marginTop: 2, textAlign: "center" }}>
                        {lead.count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={14} align="center">
                          <Group gap={6} align="center">
                            <Skull size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.deaths} {lead.deathRate}
                            </Text>
                          </Group>
                          <Group gap={6} align="center">
                            <UserCheck size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.survivors} {lead.survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>
                );
              })()}

              {/* Right Side: 3 Rows of Decades */}
              <div style={{ flex: 62, display: "flex", flexDirection: "column", gap: 4, height: "100%", alignSelf: "stretch" }}>
                {/* Row 1: 1970s (7.4%), 1960s (5.1%), 1980s (3.8%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiField22Data.decades.slice(1, 4).map((d) => (
                    <Tooltip key={d.name} label={`${d.name}: ${d.pct} (${d.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: d.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 6px" : "2px 2px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.72rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {d.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.78rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {d.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({d.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {d.deaths} {d.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {d.survivors} {d.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 2: 2000s (3.3%), 1990s (2.8%), 1940s (2.6%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiField22Data.decades.slice(4, 7).map((d) => (
                    <Tooltip key={d.name} label={`${d.name}: ${d.pct} (${d.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: d.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 6px" : "2px 2px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.72rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {d.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.78rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {d.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({d.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {d.deaths} {d.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {d.survivors} {d.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 3: 2010s (2.1%), 1950s (2.0%), 2020s (0.3%), 1900–1939 (0.2%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiField22Data.decades.slice(7, 11).map((d) => (
                    <Tooltip key={d.name} label={`${d.name}: ${d.pct} (${d.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: d.name === "1900–1939" ? 1.1 : 1,
                          backgroundColor: d.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 4px" : "2px 1px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.62rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {d.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.72rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {d.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.52rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({d.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={16} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.0rem", opacity: 0.95 }}>
                                {d.deaths} {d.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={16} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.0rem", opacity: 0.95 }}>
                                {d.survivors} {d.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #24 KPI Card: cycles (Treemap) */}
        <KpiWindowCard
          id="kpi-field-24-cycles"
          title="Airframe Flight Cycles"
          badgeKey="cycles"
          badgeColor="#e8590c"
          badgeText="Field 24 / 57 • 1,829 Unique Cycle Values"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(232, 89, 12, 0.05) 0%, rgba(28, 126, 214, 0.05) 100%)"
          borderColor="rgba(232, 89, 12, 0.35)"
          iconBgGradient="linear-gradient(135deg, #e8590c 0%, #d9480f 100%)"
          iconBoxShadow="0 4px 12px rgba(232, 89, 12, 0.35)"
          icon={<RotateCcw size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              onClick={() => handleToggleMaximize("kpi-field-24-cycles")}
              style={{
                display: "flex",
                gap: 6,
                height: isMaximized ? "calc(100vh - 175px)" : 180,
                minHeight: isMaximized ? 640 : 180,
                width: "100%",
                boxSizing: "border-box",
                cursor: "pointer",
                alignItems: "stretch",
              }}
            >
              {/* Left Main Hero Tile: Not Recorded (99.5%) */}
              {(() => {
                const lead = kpiField24Data.cycleBins[0];
                return (
                  <Tooltip label={`${lead.name}: ${lead.pct} (${lead.count.toLocaleString()} events)`} withArrow>
                    <div
                      style={{
                        flex: 38,
                        backgroundColor: lead.bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        alignSelf: "stretch",
                        height: "100%",
                        padding: isMaximized ? "24px 16px" : "8px 4px",
                        position: "relative",
                        overflow: "hidden",
                        boxSizing: "border-box",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.8rem" : "1.05rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                        {lead.label}
                      </Text>
                      <Text fw={900} style={{ fontSize: isMaximized ? "4.5rem" : "1.6rem", color: "#fff", lineHeight: 1.1, marginTop: isMaximized ? 8 : 2, textAlign: "center" }}>
                        {lead.pct}
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.75rem", color: "rgba(255,255,255,0.9)", marginTop: isMaximized ? 6 : 2, textAlign: "center" }}>
                        {lead.count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={14} align="center">
                          <Group gap={6} align="center">
                            <Skull size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.deaths} {lead.deathRate}
                            </Text>
                          </Group>
                          <Group gap={6} align="center">
                            <UserCheck size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.survivors} {lead.survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>
                );
              })()}

              {/* Right Side: 3 Rows of Cycle Ranges */}
              <div style={{ flex: 62, display: "flex", flexDirection: "column", gap: 4, height: "100%", alignSelf: "stretch" }}>
                {/* Row 1: 10k–20k (0.12%), 1k–5k (0.10%), 5k–10k (0.09%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiField24Data.cycleBins.slice(1, 4).map((c) => (
                    <Tooltip key={c.name} label={`${c.name} Cycles: ${c.pct} (${c.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: c.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 6px" : "2px 2px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.72rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {c.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.78rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {c.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({c.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {c.deaths} {c.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {c.survivors} {c.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 2: 20k–30k (0.06%), 30k–50k (0.05%), < 1k (0.04%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiField24Data.cycleBins.slice(4, 7).map((c) => (
                    <Tooltip key={c.name} label={`${c.name} Cycles: ${c.pct} (${c.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: c.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 6px" : "2px 2px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.72rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {c.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.78rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {c.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({c.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {c.deaths} {c.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {c.survivors} {c.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 3: 50k–75k (0.02%), 75k+ (0.01%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiField24Data.cycleBins.slice(7, 9).map((c) => (
                    <Tooltip key={c.name} label={`${c.name} Cycles: ${c.pct} (${c.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: c.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 4px" : "2px 1px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.72rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {c.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.78rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {c.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({c.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={16} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.0rem", opacity: 0.95 }}>
                                {c.deaths} {c.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={16} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.0rem", opacity: 0.95 }}>
                                {c.survivors} {c.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #25 KPI Card: total_airframe_hrs (Treemap) */}
        <KpiWindowCard
          id="kpi-field-25-total_airframe_hrs"
          title="Accumulated Flight Hours"
          badgeKey="total_airframe_hrs"
          badgeColor="#1c7ed6"
          badgeText="Field 25 / 57 • 15,385 Unique Values"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(28, 126, 214, 0.05) 0%, rgba(16, 152, 173, 0.05) 100%)"
          borderColor="rgba(28, 126, 214, 0.35)"
          iconBgGradient="linear-gradient(135deg, #1c7ed6 0%, #1971c2 100%)"
          iconBoxShadow="0 4px 12px rgba(28, 126, 214, 0.35)"
          icon={<Clock size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              onClick={() => handleToggleMaximize("kpi-field-25-total_airframe_hrs")}
              style={{
                display: "flex",
                gap: 6,
                height: isMaximized ? "calc(100vh - 175px)" : 180,
                minHeight: isMaximized ? 640 : 180,
                width: "100%",
                boxSizing: "border-box",
                cursor: "pointer",
                alignItems: "stretch",
              }}
            >
              {/* Left Main Hero Tile: Not Recorded (82.4%) */}
              {(() => {
                const lead = kpiField25Data.hourBins[0];
                return (
                  <Tooltip label={`${lead.name}: ${lead.pct} (${lead.count.toLocaleString()} events)`} withArrow>
                    <div
                      style={{
                        flex: 38,
                        backgroundColor: lead.bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        alignSelf: "stretch",
                        height: "100%",
                        padding: isMaximized ? "24px 16px" : "8px 4px",
                        position: "relative",
                        overflow: "hidden",
                        boxSizing: "border-box",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.8rem" : "1.05rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                        {lead.label}
                      </Text>
                      <Text fw={900} style={{ fontSize: isMaximized ? "4.5rem" : "1.6rem", color: "#fff", lineHeight: 1.1, marginTop: isMaximized ? 8 : 2, textAlign: "center" }}>
                        {lead.pct}
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.75rem", color: "rgba(255,255,255,0.9)", marginTop: isMaximized ? 6 : 2, textAlign: "center" }}>
                        {lead.count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={14} align="center">
                          <Group gap={6} align="center">
                            <Skull size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.deaths} {lead.deathRate}
                            </Text>
                          </Group>
                          <Group gap={6} align="center">
                            <UserCheck size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.survivors} {lead.survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>
                );
              })()}

              {/* Right Side: 3 Rows of Flight Hours Ranges */}
              <div style={{ flex: 62, display: "flex", flexDirection: "column", gap: 4, height: "100%", alignSelf: "stretch" }}>
                {/* Row 1: 2k–5k (6.7%), 500–2k (3.7%), 5k–10k (3.1%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiField25Data.hourBins.slice(1, 4).map((c) => (
                    <Tooltip key={c.name} label={`${c.name}: ${c.pct} (${c.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: c.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 6px" : "2px 2px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.72rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {c.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.78rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {c.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({c.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {c.deaths} {c.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {c.survivors} {c.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 2: < 500 (2.3%), 10k–20k (1.1%), 20k–40k (0.5%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiField25Data.hourBins.slice(4, 7).map((c) => (
                    <Tooltip key={c.name} label={`${c.name}: ${c.pct} (${c.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: c.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 6px" : "2px 2px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.72rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {c.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.78rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {c.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({c.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {c.deaths} {c.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem", opacity: 0.95 }}>
                                {c.survivors} {c.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 3: 40k–60k (0.2%), 60k+ (0.1%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, minHeight: 0 }}>
                  {kpiField25Data.hourBins.slice(7, 9).map((c) => (
                    <Tooltip key={c.name} label={`${c.name}: ${c.pct} (${c.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: c.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 4px" : "2px 1px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.72rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {c.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.78rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {c.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({c.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={16} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.0rem", opacity: 0.95 }}>
                                {c.deaths} {c.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={16} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.0rem", opacity: 0.95 }}>
                                {c.survivors} {c.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* KPI #9: Airframe Damage */}
        <KpiWindowCard
          id="kpi-9-damage"
          title="Airframe Damage"
          badgeKey="aircraft_damage"
          badgeColor="#f03e3e"
          subBadgeText={`${kpi9Data.totalLevels} Severity Levels`}
          minWidth={minimizedCardIds.has("kpi-9-damage") ? "fit-content" : maximizedCardId === "kpi-9-damage" ? "100%" : 440}
          flexWidth={maximizedCardId === "kpi-9-damage" ? "1 1 100%" : "1 1 440px"}
          bgGradient="linear-gradient(145deg, rgba(240, 62, 62, 0.04) 0%, rgba(28, 126, 214, 0.08) 100%)"
          borderColor="rgba(240, 62, 62, 0.3)"
          iconBgGradient="linear-gradient(135deg, #f03e3e 0%, #ff8787 100%)"
          iconBoxShadow="0 4px 12px rgba(240, 62, 62, 0.35)"
          icon={<ShieldAlert size={18} color="#ffffff" />}
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Side: Destroyed / Hull Loss (60.4%) */}
              <Tooltip label={`Destroyed / Hull Loss: 60.4% (${kpi9Data.damages[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-9-damage")}
                  style={{
                    flex: 604,
                    background: "linear-gradient(135deg, #a61e4d 0%, #c92a2a 100%)",
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 4 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <DestroyedTopDownSvg size={isMaximized ? 180 : 54} color="#ffffff" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 8 : 2 }} />
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.0rem" : "1.05rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                    Destroyed
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "4.5rem" : "1.3rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                    60.4%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.72rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                    239,831 events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 14 : 4} align="center">
                    <Group gap={4} align="center">
                      <Skull size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.75rem", opacity: 0.95 }}>
                        {kpi9Data.damages[0].deaths} {kpi9Data.damages[0].deathRate}
                      </Text>
                    </Group>
                    <Group gap={4} align="center">
                      <UserCheck size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.75rem", opacity: 0.95 }}>
                        {kpi9Data.damages[0].survivors} {kpi9Data.damages[0].survivorRate}
                      </Text>
                    </Group>
                  </Stack>
                  )}
                </div>
              </Tooltip>

              {/* Right Side: Substantial, Minor & Missing Stack */}
              <div style={{ display: "flex", flexDirection: "column", flex: 396, gap: 4 }}>
                {/* Substantial Damage (28.5%) */}
                <Tooltip label={`Substantial Damage: 28.5% (${kpi9Data.damages[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-9-damage")}
                    style={{
                      flex: 285,
                      background: "linear-gradient(135deg, #d9480f 0%, #f59f00 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      gap: isMaximized ? 2 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <SubstantialTopDownSvg size={isMaximized ? 100 : 36} color="#ffffff" style={{ marginBottom: 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.85rem", color: "#fff", lineHeight: 1.1 }}>
                      Substantial 28.5%
                    </Text>
                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                      <Group gap={3} align="center">
                        <Skull size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.62rem", opacity: 0.95 }}>
                          {kpi9Data.damages[1].deaths} {kpi9Data.damages[1].deathRate}
                        </Text>
                      </Group>
                      <Group gap={3} align="center">
                        <UserCheck size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.62rem", opacity: 0.95 }}>
                          {kpi9Data.damages[1].survivors} {kpi9Data.damages[1].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Bottom Row: Minor (10.3%) & Missing (0.8%) */}
                <div style={{ display: "flex", flex: 111, gap: 4, width: "100%" }}>
                  {/* Minor Damage (10.3%) */}
                  <Tooltip label={`Minor Damage: 10.3% (${kpi9Data.damages[2].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-9-damage")}
                      style={{
                        flex: 103,
                        background: "linear-gradient(135deg, #2b8a3e 0%, #37b24d 100%)",
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#ffffff",
                        padding: isMaximized ? 12 : 3,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                      }}
                    >
                      <MinorTopDownSvg size={isMaximized ? 70 : 24} color="#ffffff" style={{ marginBottom: 2 }} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.72rem", color: "#fff", lineHeight: 1.1 }}>
                        Minor 10.3%
                      </Text>
                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.90rem" : "0.55rem" }}>
                            {kpi9Data.damages[2].deaths} {kpi9Data.damages[2].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.90rem" : "0.55rem" }}>
                            {kpi9Data.damages[2].survivors} {kpi9Data.damages[2].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>

                  {/* Missing / Unknown (0.8%) */}
                  <Tooltip label={`Missing / Unknown: 0.8% (${kpi9Data.damages[3].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-9-damage")}
                      style={{
                        flex: 8,
                        background: "linear-gradient(135deg, #495057 0%, #868e96 100%)",
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#ffffff",
                        padding: isMaximized ? 12 : 2,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <GhostPlaneTopDownSvg size={isMaximized ? 46 : 18} color="#ffffff" style={{ marginBottom: 2 }} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.1rem" : "0.52rem", color: "#fff", lineHeight: 1.1 }}>
                        Missing 0.8%
                      </Text>
                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 12 : 6} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.75rem" : "0.45rem" }}>
                            {kpi9Data.damages[3].deaths} {kpi9Data.damages[3].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 12 : 6} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.75rem" : "0.45rem" }}>
                            {kpi9Data.damages[3].survivors} {kpi9Data.damages[3].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>


        

        {/* KPI #4: Severity */}
        <KpiWindowCard
          id="kpi-4-severity"
          title="Severity"
          badgeKey="fatalities_total"
          badgeColor="#e03131"
          minWidth={minimizedCardIds.has("kpi-4-severity") ? "fit-content" : 420}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(224, 49, 49, 0.08) 100%)"
          borderColor="rgba(224, 49, 49, 0.3)"
          iconBgGradient="linear-gradient(135deg, #e03131 0%, #ff6b6b 100%)"
          iconBoxShadow="0 4px 12px rgba(224, 49, 49, 0.35)"
          icon={<Skull size={18} color="#ffffff" />}
          subIcon={<Flame size={9} color="#ffffff" />}
          subIconBgColor="#fd7e14"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 220px)" : 175,
                borderRadius: 8,
                overflow: "hidden",
                gap: 6,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Central Big Box: Occupants (Orange #fd7e14) */}
              <Tooltip label={`Total Occupants: ${kpi4Data.totalOccupants.toLocaleString()} (${kpi4Data.survivors.toLocaleString()} survivors - ${kpi4Data.survivalRate.toFixed(2)}%)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-4-severity")}
                  style={{
                    flex: 70,
                    backgroundColor: "#fd7e14",
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 3,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <OccupantsFamilySvg size={isMaximized ? 340 : 65} color="#ffffff" style={{ marginBottom: isMaximized ? 8 : 3 }} />

                  <div style={{ width: "100%", textAlign: "center" }}>
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "1.05rem", color: "#fff", lineHeight: 1.15 }}>
                      Occupants
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.25rem", color: "#ffffff", marginTop: 4, lineHeight: 1.15 }}>
                      {kpi4Data.totalOccupants.toLocaleString()}
                    </Text>
                    <Text fw={800} style={{ fontSize: isMaximized ? "1.25rem" : "0.72rem", color: "rgba(255,255,255,0.95)", marginTop: 4, lineHeight: 1.15 }}>
                      {kpi4Data.survivors.toLocaleString()} survivors ({kpi4Data.survivalRate.toFixed(1)}%)
                    </Text>
                  </div>
                </div>
              </Tooltip>

              {/* Right Side Stack: On-Board & Ground Fatalities */}
              <div style={{ flex: 34, display: "flex", flexDirection: "column", gap: 6 }}>
                {/* On-Board Fatalities */}
                <Tooltip label={`Fatalities On-Board: ${kpi4Data.onboardFatalities.toLocaleString()} (${kpi4Data.onboardFatalityRate.toFixed(2)}% fatality rate)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-4-severity")}
                    style={{
                      flex: 62,
                      backgroundColor: "#e03131",
                      borderRadius: 5,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: 4,
                      gap: isMaximized ? 8 : 2,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <AirplaneSeatSvg size={isMaximized ? 220 : 42} color="#ffffff" style={{ marginBottom: isMaximized ? 6 : 2 }} />

                    <div style={{ width: "100%", textAlign: "center" }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.72rem", color: "#fff", lineHeight: 1.15 }}>
                        Fatalities On-Board
                      </Text>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.76rem", color: "#fff", lineHeight: 1.15, marginTop: 3 }}>
                        {kpi4Data.onboardFatalities.toLocaleString()} ({kpi4Data.onboardFatalityRate.toFixed(1)}%)
                      </Text>
                    </div>
                  </div>
                </Tooltip>

                {/* Ground Fatalities */}
                <Tooltip label={`Fatalities On Ground: ${kpi4Data.groundFatalities.toLocaleString()} (People killed on ground)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-4-severity")}
                    style={{
                      flex: 38,
                      backgroundColor: "#c92a2a",
                      borderRadius: 5,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: 4,
                      gap: isMaximized ? 6 : 2,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <HousePlaneCrashSvg size={isMaximized ? 160 : 36} color="#ffffff" style={{ marginBottom: isMaximized ? 4 : 2 }} />

                    <div style={{ width: "100%", textAlign: "center" }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.1rem" : "0.68rem", color: "#fff", lineHeight: 1.15 }}>
                        Fatalities On Ground
                      </Text>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.74rem", color: "#fff", lineHeight: 1.15, marginTop: 3 }}>
                        {kpi4Data.groundFatalities.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
        </KpiWindowCard>


        

        {/* Field #35 KPI Card: fatality_rate_onboard (Treemap) */}
        <KpiWindowCard
          id="kpi-field-35-fatality_rate_onboard"
          title="Onboard Fatality Percentage"
          badgeKey="fatality_rate_onboard"
          badgeColor="#e03131"
          badgeText="Field 35 / 57 • 786 Rate Values"
          minWidth={520}
          bgGradient="linear-gradient(145deg, rgba(224, 49, 49, 0.05) 0%, rgba(28, 126, 214, 0.05) 100%)"
          borderColor="rgba(224, 49, 49, 0.35)"
          iconBgGradient="linear-gradient(135deg, #e03131 0%, #c92a2a 100%)"
          iconBoxShadow="0 4px 12px rgba(224, 49, 49, 0.35)"
          icon={<TrendingUp size={18} color="#ffffff" />}
          subIcon={<Activity size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              onClick={() => handleToggleMaximize("kpi-field-35-fatality_rate_onboard")}
              style={{
                display: "flex",
                gap: 6,
                height: isMaximized ? "calc(100vh - 175px)" : 180,
                minHeight: isMaximized ? 640 : 180,
                width: "100%",
                boxSizing: "border-box",
                cursor: "pointer",
                alignItems: "stretch",
              }}
            >
              {/* Left Main Hero Tile: 0% Non-Fatal (70.9%) */}
              {(() => {
                const lead = kpiField35Data.rateBins[0];
                return (
                  <Tooltip label={`${lead.name} Fatal: ${lead.pct} (${lead.count.toLocaleString()} events)`} withArrow>
                    <div
                      style={{
                        flex: 38,
                        backgroundColor: lead.bg,
                        borderRadius: 6,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        alignSelf: "stretch",
                        height: "100%",
                        padding: isMaximized ? "24px 16px" : "8px 4px",
                        position: "relative",
                        overflow: "hidden",
                        boxSizing: "border-box",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.8rem" : "1.05rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                        {lead.label}
                      </Text>
                      <Text fw={900} style={{ fontSize: isMaximized ? "4.5rem" : "1.6rem", color: "#fff", lineHeight: 1.1, marginTop: isMaximized ? 8 : 2, textAlign: "center" }}>
                        {lead.pct}
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.75rem", color: "rgba(255,255,255,0.9)", marginTop: isMaximized ? 6 : 2, textAlign: "center" }}>
                        {lead.count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={14} align="center">
                          <Group gap={6} align="center">
                            <Skull size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.deaths} {lead.deathRate}
                            </Text>
                          </Group>
                          <Group gap={6} align="center">
                            <UserCheck size={24} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem", opacity: 0.95 }}>
                              {lead.survivors} {lead.survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>
                );
              })()}

              {/* Right Side: 3 Rows of Rate Tiles */}
              <div style={{ flex: 62, display: "flex", flexDirection: "column", gap: 4, height: "100%", alignSelf: "stretch" }}>
                {/* Row 1: 100% (23.5%) & 41%–55% (2.2%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, width: "100%", minHeight: 0 }}>
                  {[kpiField35Data.rateBins[1], kpiField35Data.rateBins[2]].map((c, i) => (
                    <Tooltip key={c.name} label={`${c.name}: ${c.pct} (${c.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: i === 0 ? 65 : 35,
                          backgroundColor: c.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 6px" : "3px 2px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.78rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {c.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.95rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {c.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({c.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={16} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.05rem", opacity: 0.95 }}>
                                {c.deaths} {c.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={16} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.05rem", opacity: 0.95 }}>
                                {c.survivors} {c.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 2: 26%–40% (0.8%), 11%–25% (0.7%), 56%–70% (0.7%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, width: "100%", minHeight: 0 }}>
                  {[kpiField35Data.rateBins[3], kpiField35Data.rateBins[4], kpiField35Data.rateBins[5]].map((c) => (
                    <Tooltip key={c.name} label={`${c.name}: ${c.pct} (${c.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: c.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 6px" : "3px 2px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.74rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {c.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.90rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {c.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.58rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({c.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={15} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem", opacity: 0.95 }}>
                                {c.deaths} {c.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={15} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem", opacity: 0.95 }}>
                                {c.survivors} {c.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* Row 3: 71%–85% (0.6%), 86%–99% (0.3%), 1%–10% (0.2%) */}
                <div style={{ flex: 1, display: "flex", gap: 4, width: "100%", minHeight: 0 }}>
                  {[kpiField35Data.rateBins[6], kpiField35Data.rateBins[7], kpiField35Data.rateBins[8]].map((c) => (
                    <Tooltip key={c.name} label={`${c.name}: ${c.pct} (${c.count.toLocaleString()} events)`} withArrow>
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: c.bg,
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          alignSelf: "stretch",
                          height: "100%",
                          padding: isMaximized ? "12px 6px" : "3px 2px",
                          position: "relative",
                          overflow: "hidden",
                          boxSizing: "border-box",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.74rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }} truncate>
                          {c.label}
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.90rem", color: "#fff", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          {c.pct}
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.58rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1, textAlign: "center" }}>
                          ({c.count.toLocaleString()})
                        </Text>

                        {isMaximized && (
                          <Stack gap={1} mt={6} align="center">
                            <Group gap={3} align="center">
                              <Skull size={15} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem", opacity: 0.95 }}>
                                {c.deaths} {c.deathRate}
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={15} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem", opacity: 0.95 }}>
                                {c.survivors} {c.survivorRate}
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>


        {/* KPI #5: Country */}
        <KpiWindowCard
          id="kpi-5-geography"
          title="Country"
          badgeKey="country"
          badgeColor="#3b5bdb"
          minWidth={minimizedCardIds.has("kpi-5-geography") ? "fit-content" : 460}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(59, 91, 219, 0.08) 100%)"
          borderColor="rgba(59, 91, 219, 0.3)"
          iconBgGradient="linear-gradient(135deg, #3b5bdb 0%, #4c6ef5 100%)"
          iconBoxShadow="0 4px 12px rgba(59, 91, 219, 0.35)"
          icon={<Globe size={18} color="#ffffff" />}
          subIcon={<MapPin size={9} color="#ffffff" />}
          badgeText="224 Nations"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {/* Top Row: USA & World */}
              <div style={{ display: "flex", gap: 8, height: isMaximized ? "calc(55vh - 120px)" : 150, transition: "height 0.35s ease" }}>
                {/* USA Card */}
                <Tooltip label={`United States: ${kpi5Data.countries[0].value}% (${kpi5Data.countries[0].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-5-geography")}
                    style={{
                      flex: 55,
                      backgroundColor: "#3b5bdb",
                      borderRadius: 8,
                      padding: "8px 10px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "24px 10px 8px 10px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <USAMapSvg color="#ffffff" opacity={0.35} strokeColor="rgba(255,255,255,0.6)" />
                    </div>

                    <Group justify="space-between" align="center" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.3rem" : "0.85rem", color: "#fff" }}>
                        {kpi5Data.countries[0].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.5rem" : "1.45rem", lineHeight: 0.75, color: "#ffffff" }}>
                        {kpi5Data.countries[0].value}%
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "rgba(255,255,255,0.95)", marginTop: 4, lineHeight: 0.75 }}>
                        {kpi5Data.countries[0].count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={5}>
                        <Group gap={4} align="center">
                          <Skull size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                            {kpi5Data.countries[0].deaths} {kpi5Data.countries[0].deathRate}
                          </Text>
                        </Group>
                        <Group gap={4} align="center">
                          <UserCheck size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                            {kpi5Data.countries[0].survivors} {kpi5Data.countries[0].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* World Card */}
                <Tooltip label={`Rest of World (220 Nations): ${kpi5Data.countries[1].value}% (${kpi5Data.countries[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-5-geography")}
                    style={{
                      flex: 45,
                      backgroundColor: "#495057",
                      borderRadius: 8,
                      padding: "8px 10px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "24px 10px 8px 10px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <WorldMapSvg color="#ffffff" opacity={0.3} strokeColor="rgba(255,255,255,0.5)" />
                    </div>

                    <Group gap={4} style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.25rem" : "0.82rem", color: "#fff" }}>
                        Rest of World
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.3rem" : "1.35rem", lineHeight: 0.75, color: "#ffffff" }}>
                        {kpi5Data.countries[1].value}%
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.05rem" : "0.72rem", color: "rgba(255,255,255,0.95)", marginTop: 4, lineHeight: 0.75 }}>
                        {kpi5Data.countries[1].count.toLocaleString()} (220 nations)
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={5}>
                        <Group gap={4} align="center">
                          <Skull size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                            {kpi5Data.countries[1].deaths} {kpi5Data.countries[1].deathRate}
                          </Text>
                        </Group>
                        <Group gap={4} align="center">
                          <UserCheck size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                            {kpi5Data.countries[1].survivors} {kpi5Data.countries[1].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>
              </div>

              {/* Bottom Row: UK, Germany, France Map Cards */}
              <div style={{ display: "flex", gap: 8, height: isMaximized ? "calc(45vh - 120px)" : 120, transition: "height 0.35s ease" }}>
                {/* UK Map Card */}
                <Tooltip label={`United Kingdom: ${kpi5Data.countries[2].value}% (${kpi5Data.countries[2].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-5-geography")}
                    style={{
                      flex: 1,
                      backgroundColor: "#1c7ed6",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <UKMapSvg color="#ffffff" opacity={0.35} strokeColor="rgba(255,255,255,0.6)" />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        UK
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 0.75 }}>
                        {kpi5Data.countries[2].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 3, lineHeight: 0.75 }}>
                        {kpi5Data.countries[2].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                        <Group gap={3} align="center">
                          <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                            {kpi5Data.countries[2].deaths} {kpi5Data.countries[2].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                            {kpi5Data.countries[2].survivors} {kpi5Data.countries[2].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* Germany Map Card */}
                <Tooltip label={`Germany: ${kpi5Data.countries[3].value}% (${kpi5Data.countries[3].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-5-geography")}
                    style={{
                      flex: 1,
                      backgroundColor: "#0ca678",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <GermanyMapSvg color="#ffffff" opacity={0.35} strokeColor="rgba(255,255,255,0.6)" />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        Germany
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 0.75 }}>
                        {kpi5Data.countries[3].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 3, lineHeight: 0.75 }}>
                        {kpi5Data.countries[3].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                        <Group gap={3} align="center">
                          <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                            {kpi5Data.countries[3].deaths} {kpi5Data.countries[3].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                            {kpi5Data.countries[3].survivors} {kpi5Data.countries[3].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* France Map Card */}
                <Tooltip label={`France: ${kpi5Data.countries[4].value}% (${kpi5Data.countries[4].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-5-geography")}
                    style={{
                      flex: 1,
                      backgroundColor: "#12b886",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FranceMapSvg color="#ffffff" opacity={0.35} strokeColor="rgba(255,255,255,0.6)" />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        France
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 1 }}>
                        {kpi5Data.countries[4].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                        {kpi5Data.countries[4].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                        <Group gap={3} align="center">
                          <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                            {kpi5Data.countries[4].deaths} {kpi5Data.countries[4].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                            {kpi5Data.countries[4].survivors} {kpi5Data.countries[4].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #38 KPI Card: continent */}
        <KpiWindowCard
          id="kpi-field-38-continent"
          title="Continent"
          badgeKey="continent"
          badgeColor="#0ca678"
          minWidth={minimizedCardIds.has("kpi-field-38-continent") ? "fit-content" : 460}
          bgGradient="linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(12, 166, 120, 0.08) 100%)"
          borderColor="rgba(12, 166, 120, 0.3)"
          iconBgGradient="linear-gradient(135deg, #0ca678 0%, #20c997 100%)"
          iconBoxShadow="0 4px 12px rgba(12, 166, 120, 0.35)"
          icon={<Globe size={18} color="#ffffff" />}
          subIcon={<MapPin size={9} color="#ffffff" />}
          badgeText="9 Continents & Basins"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {/* Top Row: America & Europe */}
              <div style={{ display: "flex", gap: 8, height: isMaximized ? "calc(55vh - 120px)" : 150, transition: "height 0.35s ease" }}>
                {/* America Card */}
                <Tooltip label={`America: ${kpiField38Data.continents[0].value}% (${kpiField38Data.continents[0].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-38-continent")}
                    style={{
                      flex: 55,
                      backgroundColor: "#3b5bdb",
                      borderRadius: 8,
                      padding: "8px 10px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "16px 8px 6px 8px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AmericasMapSvg opacity={0.38} />
                    </div>

                    <Group justify="space-between" align="center" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.3rem" : "0.85rem", color: "#fff" }}>
                        {kpiField38Data.continents[0].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.5rem" : "1.45rem", lineHeight: 0.75, color: "#ffffff" }}>
                        {kpiField38Data.continents[0].value}%
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "rgba(255,255,255,0.95)", marginTop: 4, lineHeight: 0.75 }}>
                        {kpiField38Data.continents[0].count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={5}>
                          <Group gap={4} align="center">
                            <Skull size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[0].deaths} {kpiField38Data.continents[0].deathRate}
                            </Text>
                          </Group>
                          <Group gap={4} align="center">
                            <UserCheck size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[0].survivors} {kpiField38Data.continents[0].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* Europe Card */}
                <Tooltip label={`Europe: ${kpiField38Data.continents[1].value}% (${kpiField38Data.continents[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-38-continent")}
                    style={{
                      flex: 45,
                      backgroundColor: "#1c7ed6",
                      borderRadius: 8,
                      padding: "8px 10px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "24px 10px 8px 10px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <EuropeMapSvg opacity={0.32} />
                    </div>

                    <Group gap={4} style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.25rem" : "0.82rem", color: "#fff" }}>
                        {kpiField38Data.continents[1].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.3rem" : "1.35rem", lineHeight: 0.75, color: "#ffffff" }}>
                        {kpiField38Data.continents[1].value}%
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.05rem" : "0.72rem", color: "rgba(255,255,255,0.95)", marginTop: 4, lineHeight: 0.75 }}>
                        {kpiField38Data.continents[1].count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={5}>
                          <Group gap={4} align="center">
                            <Skull size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[1].deaths} {kpiField38Data.continents[1].deathRate}
                            </Text>
                          </Group>
                          <Group gap={4} align="center">
                            <UserCheck size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[1].survivors} {kpiField38Data.continents[1].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>
              </div>

              {/* Bottom Row: Asia, Oceania, Other & Oceans, Africa Cards */}
              <div style={{ display: "flex", gap: 8, height: isMaximized ? "calc(45vh - 120px)" : 120, transition: "height 0.35s ease" }}>
                {/* Asia Card */}
                <Tooltip label={`Asia: ${kpiField38Data.continents[2].value}% (${kpiField38Data.continents[2].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-38-continent")}
                    style={{
                      flex: 1,
                      backgroundColor: "#0ca678",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AsiaMapSvg opacity={0.35} />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        {kpiField38Data.continents[2].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 0.75 }}>
                        {kpiField38Data.continents[2].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 3, lineHeight: 0.75 }}>
                        {kpiField38Data.continents[2].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                          <Group gap={3} align="center">
                            <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[2].deaths} {kpiField38Data.continents[2].deathRate}
                            </Text>
                          </Group>
                          <Group gap={3} align="center">
                            <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[2].survivors} {kpiField38Data.continents[2].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* Oceania Card */}
                <Tooltip label={`Oceania: ${kpiField38Data.continents[3].value}% (${kpiField38Data.continents[3].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-38-continent")}
                    style={{
                      flex: 1,
                      backgroundColor: "#7950f2",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <OceaniaMapSvg opacity={0.35} />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        {kpiField38Data.continents[3].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 0.75 }}>
                        {kpiField38Data.continents[3].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 3, lineHeight: 0.75 }}>
                        {kpiField38Data.continents[3].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                          <Group gap={3} align="center">
                            <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[3].deaths} {kpiField38Data.continents[3].deathRate}
                            </Text>
                          </Group>
                          <Group gap={3} align="center">
                            <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[3].survivors} {kpiField38Data.continents[3].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* Other & Oceans Card */}
                <Tooltip label={`Other & Oceans (World, Oceans, Antarctica): ${kpiField38Data.continents[4].value}% (${kpiField38Data.continents[4].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-38-continent")}
                    style={{
                      flex: 1,
                      backgroundColor: "#495057",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <OceansMapSvg opacity={0.35} />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        {kpiField38Data.continents[4].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 0.75 }}>
                        {kpiField38Data.continents[4].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 3, lineHeight: 0.75 }}>
                        {kpiField38Data.continents[4].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                          <Group gap={3} align="center">
                            <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[4].deaths} {kpiField38Data.continents[4].deathRate}
                            </Text>
                          </Group>
                          <Group gap={3} align="center">
                            <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[4].survivors} {kpiField38Data.continents[4].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* Africa Card */}
                <Tooltip label={`Africa: ${kpiField38Data.continents[5].value}% (${kpiField38Data.continents[5].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-38-continent")}
                    style={{
                      flex: 1,
                      backgroundColor: "#e8590c",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AfricaMapSvg opacity={0.35} />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        {kpiField38Data.continents[5].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 1 }}>
                        {kpiField38Data.continents[5].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                        {kpiField38Data.continents[5].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                          <Group gap={3} align="center">
                            <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[5].deaths} {kpiField38Data.continents[5].deathRate}
                            </Text>
                          </Group>
                          <Group gap={3} align="center">
                            <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpiField38Data.continents[5].survivors} {kpiField38Data.continents[5].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* KPI #13: Global Region */}
        <KpiWindowCard
          id="kpi-13-region"
          title="Global Region"
          badgeKey="region"
          badgeColor="#1c7ed6"
          badgeText="6 Regional Zones"
          minWidth={minimizedCardIds.has("kpi-13-region") ? "fit-content" : 460}
          bgGradient="linear-gradient(145deg, rgba(28, 126, 214, 0.04) 0%, rgba(12, 166, 120, 0.08) 100%)"
          borderColor="rgba(28, 126, 214, 0.3)"
          iconBgGradient="linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)"
          iconBoxShadow="0 4px 12px rgba(28, 126, 214, 0.35)"
          icon={<Globe size={18} color="#ffffff" />}
          subIcon={<MapPin size={9} color="#ffffff" />}
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              {/* Top Row: North America & Europe & UK */}
              <div style={{ display: "flex", gap: 8, height: isMaximized ? "calc(55vh - 120px)" : 150, transition: "height 0.35s ease" }}>
                {/* North America Card */}
                <Tooltip label={`North America: ${kpi13Data.regions[0].value}% (${kpi13Data.regions[0].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-13-region")}
                    style={{
                      flex: 55,
                      backgroundColor: "#1c7ed6",
                      borderRadius: 8,
                      padding: "8px 10px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "24px 10px 8px 10px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <NorthAmericaMapSvg opacity={0.35} />
                    </div>

                    <Group justify="space-between" align="center" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.3rem" : "0.85rem", color: "#fff" }}>
                        {kpi13Data.regions[0].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.5rem" : "1.45rem", lineHeight: 0.75, color: "#ffffff" }}>
                        {kpi13Data.regions[0].value}%
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "rgba(255,255,255,0.95)", marginTop: 4, lineHeight: 0.75 }}>
                        {kpi13Data.regions[0].count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={5}>
                          <Group gap={4} align="center">
                            <Skull size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                              {kpi13Data.regions[0].deaths} {kpi13Data.regions[0].deathRate}
                            </Text>
                          </Group>
                          <Group gap={4} align="center">
                            <UserCheck size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                              {kpi13Data.regions[0].survivors} {kpi13Data.regions[0].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* Europe & UK Card */}
                <Tooltip label={`Europe & UK: ${kpi13Data.regions[1].value}% (${kpi13Data.regions[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-13-region")}
                    style={{
                      flex: 45,
                      backgroundColor: "#7950f2",
                      borderRadius: 8,
                      padding: "8px 10px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "24px 10px 8px 10px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <EuropeMapSvg opacity={0.32} />
                    </div>

                    <Group gap={4} style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.25rem" : "0.82rem", color: "#fff" }}>
                        {kpi13Data.regions[1].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.3rem" : "1.35rem", lineHeight: 0.75, color: "#ffffff" }}>
                        {kpi13Data.regions[1].value}%
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.05rem" : "0.72rem", color: "rgba(255,255,255,0.95)", marginTop: 4, lineHeight: 0.75 }}>
                        {kpi13Data.regions[1].count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={5}>
                          <Group gap={4} align="center">
                            <Skull size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                              {kpi13Data.regions[1].deaths} {kpi13Data.regions[1].deathRate}
                            </Text>
                          </Group>
                          <Group gap={4} align="center">
                            <UserCheck size={isMaximized ? 20 : 13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.72rem", opacity: 0.95 }}>
                              {kpi13Data.regions[1].survivors} {kpi13Data.regions[1].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>
              </div>

              {/* Bottom Row: Asia & Oceania, Latin America, Africa & M. East, Oceans & Other Cards */}
              <div style={{ display: "flex", gap: 8, height: isMaximized ? "calc(45vh - 120px)" : 120, transition: "height 0.35s ease" }}>
                {/* Asia & Oceania Card */}
                <Tooltip label={`Asia & Oceania: ${kpi13Data.regions[2].value}% (${kpi13Data.regions[2].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-13-region")}
                    style={{
                      flex: 1,
                      backgroundColor: "#0ca678",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AsiaMapSvg opacity={0.35} />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        {kpi13Data.regions[2].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 0.75 }}>
                        {kpi13Data.regions[2].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 3, lineHeight: 0.75 }}>
                        {kpi13Data.regions[2].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                          <Group gap={3} align="center">
                            <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpi13Data.regions[2].deaths} {kpi13Data.regions[2].deathRate}
                            </Text>
                          </Group>
                          <Group gap={3} align="center">
                            <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpi13Data.regions[2].survivors} {kpi13Data.regions[2].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* Latin America Card */}
                <Tooltip label={`Latin America: ${kpi13Data.regions[3].value}% (${kpi13Data.regions[3].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-13-region")}
                    style={{
                      flex: 1,
                      backgroundColor: "#d6336c",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LatinAmericaMapSvg opacity={0.35} />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        {kpi13Data.regions[3].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 0.75 }}>
                        {kpi13Data.regions[3].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 3, lineHeight: 0.75 }}>
                        {kpi13Data.regions[3].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                          <Group gap={3} align="center">
                            <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpi13Data.regions[3].deaths} {kpi13Data.regions[3].deathRate}
                            </Text>
                          </Group>
                          <Group gap={3} align="center">
                            <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpi13Data.regions[3].survivors} {kpi13Data.regions[3].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* Africa & M. East Card */}
                <Tooltip label={`Africa & M. East: ${kpi13Data.regions[4].value}% (${kpi13Data.regions[4].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-13-region")}
                    style={{
                      flex: 1,
                      backgroundColor: "#f59f00",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AfricaMapSvg opacity={0.35} />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        {kpi13Data.regions[4].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 0.75 }}>
                        {kpi13Data.regions[4].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 3, lineHeight: 0.75 }}>
                        {kpi13Data.regions[4].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                          <Group gap={3} align="center">
                            <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpi13Data.regions[4].deaths} {kpi13Data.regions[4].deathRate}
                            </Text>
                          </Group>
                          <Group gap={3} align="center">
                            <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpi13Data.regions[4].survivors} {kpi13Data.regions[4].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>

                {/* Oceans & Other Card */}
                <Tooltip label={`Oceans & Other: ${kpi13Data.regions[5].value}% (${kpi13Data.regions[5].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-13-region")}
                    style={{
                      flex: 1,
                      backgroundColor: "#495057",
                      borderRadius: 8,
                      padding: "6px 8px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        padding: "18px 4px 4px 4px",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <OceansMapSvg opacity={0.35} />
                    </div>

                    <Group gap={3} wrap="nowrap" style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={800} style={{ fontSize: isMaximized ? "1.1rem" : "0.75rem", color: "#fff" }}>
                        {kpi13Data.regions[5].name}
                      </Text>
                    </Group>

                    <div style={{ position: "relative", zIndex: 3 }}>
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "1.05rem", lineHeight: 1 }}>
                        {kpi13Data.regions[5].value}%
                      </Text>
                      <Text style={{ fontSize: isMaximized ? "0.95rem" : "0.62rem", color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                        {kpi13Data.regions[5].count.toLocaleString()}
                      </Text>

                      {isMaximized && (
                        <Stack gap={2} mt={3}>
                          <Group gap={3} align="center">
                            <Skull size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpi13Data.regions[5].deaths} {kpi13Data.regions[5].deathRate}
                            </Text>
                          </Group>
                          <Group gap={3} align="center">
                            <UserCheck size={isMaximized ? 16 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.62rem", opacity: 0.95 }}>
                              {kpi13Data.regions[5].survivors} {kpi13Data.regions[5].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
        </KpiWindowCard>

        

        

        {/* KPI #7: Flight Phase */}
        <KpiWindowCard
          id="kpi-7-phase"
          title="Flight Phase"
          badgeKey="phase_group"
          badgeColor="#e8590c"
          subBadgeText={`${kpi7Data.totalPhases} Primary Phases`}
          minWidth={minimizedCardIds.has("kpi-7-phase") ? "fit-content" : maximizedCardId === "kpi-7-phase" ? "100%" : 420}
          flexWidth={maximizedCardId === "kpi-7-phase" ? "1 1 100%" : "1 1 420px"}
          bgGradient="linear-gradient(145deg, rgba(232, 89, 12, 0.04) 0%, rgba(28, 126, 214, 0.08) 100%)"
          borderColor="rgba(232, 89, 12, 0.3)"
          iconBgGradient="linear-gradient(135deg, #e8590c 0%, #f59f00 100%)"
          iconBoxShadow="0 3px 10px rgba(232, 89, 12, 0.35)"
          icon={<PlaneTakeoff size={15} color="#ffffff" />}
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          allowMaximize={true}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Side: En-Route / Cruise (50.2%) */}
              <Tooltip label={`En-Route / Cruise: 50.2% (${kpi7Data.phases[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-7-phase")}
                  style={{
                    flex: 50,
                    backgroundColor: "#e8590c",
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <Boeing777EnRouteSvg size={isMaximized ? 320 : 68} color="#ffffff" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))", marginBottom: isMaximized ? 8 : 3 }} />
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.05rem", color: "#fff", lineHeight: 1.1 }}>
                    En-Route
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "5.4rem" : "1.25rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                    50.2%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "2.0rem" : "0.72rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                    199,355 events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 2} mt={isMaximized ? 14 : 4} align="center">
                    <Group gap={4} align="center">
                      <Skull size={isMaximized ? 26 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.7rem" : "0.7rem", opacity: 0.95 }}>
                        {kpi7Data.phases[0].deaths} {kpi7Data.phases[0].deathRate}
                      </Text>
                    </Group>
                    <Group gap={4} align="center">
                      <UserCheck size={isMaximized ? 26 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                      <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.7rem" : "0.7rem", opacity: 0.95 }}>
                        {kpi7Data.phases[0].survivors} {kpi7Data.phases[0].survivorRate}
                      </Text>
                    </Group>
                  </Stack>
                  )}
                </div>
              </Tooltip>

              {/* Right Side Stack: Landing, Takeoff, Ground */}
              <div style={{ flex: 50, display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Landing / Approach (29.7%) */}
                <Tooltip label={`Landing / Approach: 29.7% (${kpi7Data.phases[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-7-phase")}
                    style={{
                      flex: 59,
                      backgroundColor: "#1c7ed6",
                      borderRadius: 5,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <Boeing777LandingSvg size={isMaximized ? 200 : 36} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 6 : 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.76rem", color: "#fff", lineHeight: 1.1 }}>
                      Landing 29.7%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.6rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                      117,658 events
                    </Text>

                    {isMaximized && (
                      <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 8 : 2} align="center">
                      <Group gap={3} align="center">
                        <Skull size={isMaximized ? 20 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.58rem", opacity: 0.95 }}>
                          {kpi7Data.phases[1].deaths} {kpi7Data.phases[1].deathRate}
                        </Text>
                      </Group>
                      <Group gap={3} align="center">
                        <UserCheck size={isMaximized ? 20 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.58rem", opacity: 0.95 }}>
                          {kpi7Data.phases[1].survivors} {kpi7Data.phases[1].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Bottom Row: Takeoff (14.8%) & Ground (5.3%) */}
                <div style={{ flex: 41, display: "flex", gap: 4 }}>
                  {/* Takeoff / Climb */}
                  <Tooltip label={`Takeoff / Climb: 14.8% (${kpi7Data.phases[2].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-7-phase")}
                      style={{
                        flex: 74,
                        backgroundColor: "#e03131",
                        borderRadius: 4,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: isMaximized ? 4 : 1,
                        color: "#ffffff",
                        padding: isMaximized ? "12px 8px" : "2px 4px",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <Boeing777TakeoffSvg size={isMaximized ? 130 : 28} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 4 : 2 }} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.62rem", color: "#fff", lineHeight: 1.1 }}>
                        Takeoff 14.8%
                      </Text>

                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 16 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.52rem", opacity: 0.95 }}>
                            {kpi7Data.phases[2].deaths} {kpi7Data.phases[2].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 16 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.52rem", opacity: 0.95 }}>
                            {kpi7Data.phases[2].survivors} {kpi7Data.phases[2].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>

                  {/* Ground / Taxi */}
                  <Tooltip label={`Ground / Taxi: 5.3% (${kpi7Data.phases[3].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-7-phase")}
                      style={{
                        flex: 26,
                        backgroundColor: "#0ca678",
                        borderRadius: 4,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: isMaximized ? 4 : 1,
                        color: "#ffffff",
                        padding: isMaximized ? "8px 12px" : "2px 4px",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <AirportGroundRampSvg size={isMaximized ? 75 : 22} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 4 : 2 }} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.2rem" : "0.52rem", color: "#fff", lineHeight: 1.1 }}>
                        Ground 5.3%
                      </Text>

                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                        <Group gap={2} align="center">
                          <Skull size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.46rem", opacity: 0.95 }}>
                            {kpi7Data.phases[3].deaths} {kpi7Data.phases[3].deathRate}
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.46rem", opacity: 0.95 }}>
                            {kpi7Data.phases[3].survivors} {kpi7Data.phases[3].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                      )}
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #42 KPI Card: phase */}
        <KpiWindowCard
          id="kpi-field-42-phase"
          title="Phase"
          badgeKey="phase"
          badgeColor="#1098ad"
          subBadgeText="11 Phase Categories"
          minWidth={minimizedCardIds.has("kpi-field-42-phase") ? "fit-content" : maximizedCardId === "kpi-field-42-phase" ? "100%" : 420}
          flexWidth={maximizedCardId === "kpi-field-42-phase" ? "1 1 100%" : "1 1 420px"}
          bgGradient="linear-gradient(145deg, rgba(16, 152, 173, 0.04) 0%, rgba(232, 89, 12, 0.08) 100%)"
          borderColor="rgba(16, 152, 173, 0.3)"
          iconBgGradient="linear-gradient(135deg, #1098ad 0%, #20c997 100%)"
          iconBoxShadow="0 3px 10px rgba(16, 152, 173, 0.35)"
          icon={<PlaneLanding size={15} color="#ffffff" />}
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          allowMaximize={true}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Left Side: En Route (37.2%) */}
              <Tooltip label={`En Route / Cruise: 37.2% (${kpiField42Data.phases[0].count.toLocaleString()} events)`} withArrow>
                <div
                  onClick={() => handleToggleMaximize("kpi-field-42-phase")}
                  style={{
                    flex: 46,
                    backgroundColor: "#e8590c",
                    borderRadius: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    padding: isMaximized ? 24 : 6,
                    gap: isMaximized ? 0 : 2,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                    cursor: "pointer",
                  }}
                >
                  <Boeing777EnRouteSvg size={isMaximized ? 300 : 64} color="#ffffff" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))", marginBottom: isMaximized ? 8 : 3 }} />
                  <Text fw={900} style={{ fontSize: isMaximized ? "3.0rem" : "1.0rem", color: "#fff", lineHeight: 1.1 }}>
                    En Route
                  </Text>
                  <Text fw={900} style={{ fontSize: isMaximized ? "5.0rem" : "1.2rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                    37.2%
                  </Text>
                  <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.70rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                    {kpiField42Data.phases[0].count.toLocaleString()} events
                  </Text>

                  {isMaximized && (
                    <Stack gap={isMaximized ? 4 : 2} mt={isMaximized ? 14 : 4} align="center">
                      <Group gap={4} align="center">
                        <Skull size={isMaximized ? 26 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.6rem" : "0.7rem", opacity: 0.95 }}>
                          {kpiField42Data.phases[0].deaths} {kpiField42Data.phases[0].deathRate}
                        </Text>
                      </Group>
                      <Group gap={4} align="center">
                        <UserCheck size={isMaximized ? 26 : 12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.6rem" : "0.7rem", opacity: 0.95 }}>
                          {kpiField42Data.phases[0].survivors} {kpiField42Data.phases[0].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                  )}
                </div>
              </Tooltip>

              {/* Right Side Stack: Landing, Approach, Take Off, Combat, Initial Climb, Others */}
              <div style={{ flex: 54, display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Top Row: Landing (23.2%) & Approach (6.4%) */}
                <div style={{ flex: 56, display: "flex", gap: 4 }}>
                  {/* Landing */}
                  <Tooltip label={`Landing: 23.2% (${kpiField42Data.phases[1].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-field-42-phase")}
                      style={{
                        flex: 62,
                        backgroundColor: "#1c7ed6",
                        borderRadius: 5,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#ffffff",
                        padding: isMaximized ? 16 : 4,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <Boeing777LandingSvg size={isMaximized ? 180 : 34} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 6 : 2 }} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.75rem", color: "#fff", lineHeight: 1.1 }}>
                        Landing 23.2%
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.58rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                        {kpiField42Data.phases[1].count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 8 : 2} align="center">
                          <Group gap={3} align="center">
                            <Skull size={isMaximized ? 20 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.58rem", opacity: 0.95 }}>
                              {kpiField42Data.phases[1].deaths} {kpiField42Data.phases[1].deathRate}
                            </Text>
                          </Group>
                          <Group gap={3} align="center">
                            <UserCheck size={isMaximized ? 20 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.58rem", opacity: 0.95 }}>
                              {kpiField42Data.phases[1].survivors} {kpiField42Data.phases[1].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>

                  {/* Approach */}
                  <Tooltip label={`Approach: 6.4% (${kpiField42Data.phases[4].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-field-42-phase")}
                      style={{
                        flex: 38,
                        backgroundColor: "#7950f2",
                        borderRadius: 5,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#ffffff",
                        padding: isMaximized ? 16 : 4,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <Boeing777LandingSvg size={isMaximized ? 120 : 26} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 4 : 1 }} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.68rem", color: "#fff", lineHeight: 1.1 }}>
                        Approach 6.4%
                      </Text>
                      <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.54rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                        {kpiField42Data.phases[4].count.toLocaleString()} events
                      </Text>

                      {isMaximized && (
                        <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 8 : 2} align="center">
                          <Group gap={3} align="center">
                            <Skull size={isMaximized ? 18 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.54rem", opacity: 0.95 }}>
                              {kpiField42Data.phases[4].deaths} {kpiField42Data.phases[4].deathRate}
                            </Text>
                          </Group>
                          <Group gap={3} align="center">
                            <UserCheck size={isMaximized ? 18 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.54rem", opacity: 0.95 }}>
                              {kpiField42Data.phases[4].survivors} {kpiField42Data.phases[4].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>
                </div>

                {/* Bottom Row: Take Off (9.8%), Combat (7.0%), Initial Climb & Other (16.4%) */}
                <div style={{ flex: 44, display: "flex", gap: 4 }}>
                  {/* Take Off */}
                  <Tooltip label={`Take Off: 9.8% (${kpiField42Data.phases[2].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-field-42-phase")}
                      style={{
                        flex: 38,
                        backgroundColor: "#e03131",
                        borderRadius: 4,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: isMaximized ? 4 : 1,
                        color: "#ffffff",
                        padding: isMaximized ? "12px 8px" : "2px 4px",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <Boeing777TakeoffSvg size={isMaximized ? 110 : 24} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 4 : 1 }} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.60rem", color: "#fff", lineHeight: 1.1 }}>
                        Take Off 9.8%
                      </Text>

                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                          <Group gap={2} align="center">
                            <Skull size={isMaximized ? 16 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.52rem", opacity: 0.95 }}>
                              {kpiField42Data.phases[2].deaths} {kpiField42Data.phases[2].deathRate}
                            </Text>
                          </Group>
                          <Group gap={2} align="center">
                            <UserCheck size={isMaximized ? 16 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.52rem", opacity: 0.95 }}>
                              {kpiField42Data.phases[2].survivors} {kpiField42Data.phases[2].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>

                  {/* Combat */}
                  <Tooltip label={`Combat: 7.0% (${kpiField42Data.phases[3].count.toLocaleString()} events)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-field-42-phase")}
                      style={{
                        flex: 30,
                        backgroundColor: "#d6336c",
                        borderRadius: 4,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: isMaximized ? 4 : 1,
                        color: "#ffffff",
                        padding: isMaximized ? "12px 6px" : "2px 3px",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <MilitaryShotdownSvg size={isMaximized ? 100 : 20} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 3 : 1 }} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.2rem" : "0.56rem", color: "#fff", lineHeight: 1.1 }}>
                        Combat 7.0%
                      </Text>

                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                          <Group gap={2} align="center">
                            <Skull size={isMaximized ? 15 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.90rem" : "0.50rem", opacity: 0.95 }}>
                              {kpiField42Data.phases[3].deaths} {kpiField42Data.phases[3].deathRate}
                            </Text>
                          </Group>
                          <Group gap={2} align="center">
                            <UserCheck size={isMaximized ? 15 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.90rem" : "0.50rem", opacity: 0.95 }}>
                              {kpiField42Data.phases[3].survivors} {kpiField42Data.phases[3].survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>

                  {/* Climb & Other Phases */}
                  <Tooltip label={`Climb & Other: 16.4% (${kpiField42Data.otherPhasesSummary.count.toLocaleString()} events: Initial Climb 19,892, Manoeuvring 13,909, Standing 12,476, Taxi 7,762, Other 10,863)`} withArrow>
                    <div
                      onClick={() => handleToggleMaximize("kpi-field-42-phase")}
                      style={{
                        flex: 32,
                        backgroundColor: "#0ca678",
                        borderRadius: 4,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: isMaximized ? 4 : 1,
                        color: "#ffffff",
                        padding: isMaximized ? "12px 6px" : "2px 3px",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        overflow: "hidden",
                      }}
                    >
                      <AirportGroundRampSvg size={isMaximized ? 75 : 18} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 3 : 1 }} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.15rem" : "0.52rem", color: "#fff", lineHeight: 1.1 }}>
                        Other 16.4%
                      </Text>

                      {isMaximized && (
                        <Stack gap={1} mt={1} align="center">
                          <Group gap={2} align="center">
                            <Skull size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.46rem", opacity: 0.95 }}>
                              {kpiField42Data.otherPhasesSummary.deaths} {kpiField42Data.otherPhasesSummary.deathRate}
                            </Text>
                          </Group>
                          <Group gap={2} align="center">
                            <UserCheck size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                            <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.46rem", opacity: 0.95 }}>
                              {kpiField42Data.otherPhasesSummary.survivors} {kpiField42Data.otherPhasesSummary.survivorRate}
                            </Text>
                          </Group>
                        </Stack>
                      )}
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* KPI #8: Flight Nature */}
        <KpiWindowCard
          id="kpi-8-nature"
          title="Flight Nature"
          badgeKey="nature"
          badgeColor="#d6336c"
          subBadgeText={`${kpi8Data.totalMissions} Mission Types`}
          minWidth={minimizedCardIds.has("kpi-8-nature") ? "fit-content" : maximizedCardId === "kpi-8-nature" ? "100%" : 440}
          flexWidth={maximizedCardId === "kpi-8-nature" ? "1 1 100%" : "1 1 440px"}
          bgGradient="linear-gradient(145deg, rgba(214, 51, 108, 0.04) 0%, rgba(28, 126, 214, 0.08) 100%)"
          borderColor="rgba(214, 51, 108, 0.3)"
          iconBgGradient="linear-gradient(135deg, #d6336c 0%, #f783ac 100%)"
          iconBoxShadow="0 4px 12px rgba(214, 51, 108, 0.35)"
          icon={<Compass size={18} color="#ffffff" />}
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Top Row: Primary Mission Types (Military 38.9%, Private 34.2%, Passenger 8.0%) */}
              <div style={{ display: "flex", flex: 6, gap: 4, width: "100%" }}>
                {/* Military (38.9%) - F-22 Raptor Top Down */}
                <Tooltip label={`Military: 38.9% (${kpi8Data.missions[0].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-8-nature")}
                    style={{
                      flex: 389,
                      background: "linear-gradient(135deg, #a61e4d 0%, #d6336c 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 24 : 6,
                      gap: isMaximized ? 4 : 2,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <F22RaptorTopDownSvg size={isMaximized ? 140 : 44} color="#ffffff" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 8 : 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.8rem" : "0.95rem", color: "#fff", lineHeight: 1.1 }}>
                      Military
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "4.5rem" : "1.15rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      38.9%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.68rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                      155,285 events
                    </Text>

                    {isMaximized && (
                      <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 14 : 4} align="center">
                      <Group gap={4} align="center">
                        <Skull size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.72rem", opacity: 0.95 }}>
                          {kpi8Data.missions[0].deaths} {kpi8Data.missions[0].deathRate}
                        </Text>
                      </Group>
                      <Group gap={4} align="center">
                        <UserCheck size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.72rem", opacity: 0.95 }}>
                          {kpi8Data.missions[0].survivors} {kpi8Data.missions[0].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Private (34.2%) - Boeing Passenger Top Down */}
                <Tooltip label={`Private Aviation: 34.2% (${kpi8Data.missions[1].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-8-nature")}
                    style={{
                      flex: 342,
                      background: "linear-gradient(135deg, #e67700 0%, #f59f00 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 24 : 6,
                      gap: isMaximized ? 4 : 2,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <BoeingPassengerTopDownSvg size={isMaximized ? 180 : 44} color="#ffffff" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 8 : 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.8rem" : "0.95rem", color: "#fff", lineHeight: 1.1 }}>
                      Private
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "4.5rem" : "1.15rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      34.2%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.68rem", color: "rgba(255,255,255,0.9)", marginTop: 1, lineHeight: 1.1 }}>
                      136,536 events
                    </Text>

                    {isMaximized && (
                      <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 14 : 4} align="center">
                      <Group gap={4} align="center">
                        <Skull size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.72rem", opacity: 0.95 }}>
                          {kpi8Data.missions[1].deaths} {kpi8Data.missions[1].deathRate}
                        </Text>
                      </Group>
                      <Group gap={4} align="center">
                        <UserCheck size={isMaximized ? 24 : 11} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.5rem" : "0.72rem", opacity: 0.95 }}>
                          {kpi8Data.missions[1].survivors} {kpi8Data.missions[1].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Passenger (8.0%) - Airbus A380 Top Down */}
                <Tooltip label={`Passenger Scheduled/Charter: 8.0% (${kpi8Data.missions[2].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-8-nature")}
                    style={{
                      flex: 120,
                      background: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      gap: isMaximized ? 4 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <AirbusA380TopDownSvg size={isMaximized ? 130 : 36} color="#ffffff" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.25))", marginBottom: isMaximized ? 4 : 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.0rem" : "0.78rem", color: "#fff", lineHeight: 1.1 }}>
                      Passenger
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "0.95rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      8.0%
                    </Text>

                    {isMaximized && (
                      <Stack gap={isMaximized ? 4 : 1} mt={isMaximized ? 10 : 2} align="center">
                      <Group gap={3} align="center">
                        <Skull size={isMaximized ? 20 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.62rem", opacity: 0.95 }}>
                          {kpi8Data.missions[2].deaths} {kpi8Data.missions[2].deathRate}
                        </Text>
                      </Group>
                      <Group gap={3} align="center">
                        <UserCheck size={isMaximized ? 20 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.2rem" : "0.62rem", opacity: 0.95 }}>
                          {kpi8Data.missions[2].survivors} {kpi8Data.missions[2].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>
              </div>

              {/* Bottom Row: Secondary Mission Types (Training 6.4%, Special 5.3%, Agricultural 3.2%, Executive 1.9%, Cargo 1.5%) */}
              <div style={{ display: "flex", flex: 4, gap: 4, width: "100%" }}>
                {/* Training (6.4%) - T-38 Talon Top Down */}
                <Tooltip label={`Training: 6.4% (${kpi8Data.missions[3].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-8-nature")}
                    style={{
                      flex: 64,
                      background: "linear-gradient(135deg, #099268 0%, #0ca678 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 12 : 3,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <T38TalonTopDownSvg size={isMaximized ? 60 : 26} color="#ffffff" style={{ marginBottom: 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.68rem", color: "#fff", lineHeight: 1.1 }}>
                      Training
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.78rem", color: "#ffffff", lineHeight: 1.1 }}>
                      6.4%
                    </Text>
                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                      <Group gap={2} align="center">
                        <Skull size={isMaximized ? 14 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.55rem" }}>
                          {kpi8Data.missions[3].deaths} {kpi8Data.missions[3].deathRate}
                        </Text>
                      </Group>
                      <Group gap={2} align="center">
                        <UserCheck size={isMaximized ? 14 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.55rem" }}>
                          {kpi8Data.missions[3].survivors} {kpi8Data.missions[3].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Special & Others (5.3%) - eVTOL Electric Top Down */}
                <Tooltip label={`Others & Special: 5.3% (${kpi8Data.missions[4].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-8-nature")}
                    style={{
                      flex: 53,
                      background: "linear-gradient(135deg, #5c7cfa 0%, #748ffc 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 12 : 3,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <VtolElectricTopDownSvg size={isMaximized ? 50 : 22} color="#ffffff" style={{ marginBottom: 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.65rem", color: "#fff", lineHeight: 1.1 }}>
                      Special
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.75rem", color: "#ffffff", lineHeight: 1.1 }}>
                      5.3%
                    </Text>
                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                      <Group gap={2} align="center">
                        <Skull size={isMaximized ? 14 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.55rem" }}>
                          {kpi8Data.missions[4].deaths} {kpi8Data.missions[4].deathRate}
                        </Text>
                      </Group>
                      <Group gap={2} align="center">
                        <UserCheck size={isMaximized ? 14 : 8} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.95rem" : "0.55rem" }}>
                          {kpi8Data.missions[4].survivors} {kpi8Data.missions[4].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Agricultural (3.2%) - Crop Duster Top Down */}
                <Tooltip label={`Agricultural: 3.2% (${kpi8Data.missions[5].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-8-nature")}
                    style={{
                      flex: 32,
                      background: "linear-gradient(135deg, #2b8a3e 0%, #37b24d 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 12 : 3,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <AgriDusterTopDownSvg size={isMaximized ? 42 : 18} color="#ffffff" style={{ marginBottom: 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.3rem" : "0.60rem", color: "#fff", lineHeight: 1.1 }}>
                      Agri
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.72rem", color: "#ffffff", lineHeight: 1.1 }}>
                      3.2%
                    </Text>
                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                      <Group gap={2} align="center">
                        <Skull size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.50rem" }}>
                          {kpi8Data.missions[5].deaths} {kpi8Data.missions[5].deathRate}
                        </Text>
                      </Group>
                      <Group gap={2} align="center">
                        <UserCheck size={isMaximized ? 14 : 7} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.85rem" : "0.50rem" }}>
                          {kpi8Data.missions[5].survivors} {kpi8Data.missions[5].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Executive (1.9%) - Rear Engine Bizjet Top Down */}
                <Tooltip label={`Executive & Corporate: 1.9% (${kpi8Data.missions[6].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-8-nature")}
                    style={{
                      flex: 19,
                      background: "linear-gradient(135deg, #5f3dc4 0%, #7048e8 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 12 : 2,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <ExecBizjetTopDownSvg size={isMaximized ? 38 : 16} color="#ffffff" style={{ marginBottom: 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "#fff", lineHeight: 1.1 }}>
                      Exec
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.65rem", color: "#ffffff", lineHeight: 1.1 }}>
                      1.9%
                    </Text>
                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                      <Group gap={2} align="center">
                        <Skull size={isMaximized ? 12 : 6} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.80rem" : "0.45rem" }}>
                          {kpi8Data.missions[6].deaths} {kpi8Data.missions[6].deathRate}
                        </Text>
                      </Group>
                      <Group gap={2} align="center">
                        <UserCheck size={isMaximized ? 12 : 6} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.80rem" : "0.45rem" }}>
                          {kpi8Data.missions[6].survivors} {kpi8Data.missions[6].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Cargo (1.5%) - C-130 Turboprop Top Down */}
                <Tooltip label={`Cargo & Freight: 1.5% (${kpi8Data.missions[7].count.toLocaleString()} events)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-8-nature")}
                    style={{
                      flex: 15,
                      background: "linear-gradient(135deg, #d9480f 0%, #e8590c 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 12 : 2,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <CargoPropTopDownSvg size={isMaximized ? 38 : 16} color="#ffffff" style={{ marginBottom: 2 }} />
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "#fff", lineHeight: 1.1 }}>
                      Cargo
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.4rem" : "0.65rem", color: "#ffffff", lineHeight: 1.1 }}>
                      1.5%
                    </Text>
                    {isMaximized && (
                      <Stack gap={1} mt={1} align="center">
                      <Group gap={2} align="center">
                        <Skull size={isMaximized ? 12 : 6} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.80rem" : "0.45rem" }}>
                          {kpi8Data.missions[7].deaths} {kpi8Data.missions[7].deathRate}
                        </Text>
                      </Group>
                      <Group gap={2} align="center">
                        <UserCheck size={isMaximized ? 12 : 6} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "0.80rem" : "0.45rem" }}>
                          {kpi8Data.missions[7].survivors} {kpi8Data.missions[7].survivorRate}
                        </Text>
                      </Group>
                    </Stack>
                    )}
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #45 KPI Card: departure_airport */}
        <KpiWindowCard
          id="kpi-field-45-departure_airport"
          title="Departure"
          badgeKey="departure_airport"
          badgeColor="#1c7ed6"
          badgeText="72,574 Unique Departure Hubs"
          minWidth={minimizedCardIds.has("kpi-field-45-departure_airport") ? "fit-content" : 440}
          bgGradient="linear-gradient(145deg, rgba(28, 126, 214, 0.04) 0%, rgba(12, 166, 120, 0.08) 100%)"
          borderColor="rgba(28, 126, 214, 0.3)"
          iconBgGradient="linear-gradient(135deg, #1c7ed6 0%, #339af0 100%)"
          iconBoxShadow="0 4px 12px rgba(28, 126, 214, 0.35)"
          icon={<PlaneTakeoff size={18} color="#ffffff" />}
          subIcon={<CheckCircle2 size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Top Row: 3 Primary Departure Hubs */}
              <div style={{ display: "flex", flex: isMaximized ? 4 : 5.8, gap: 4, width: "100%" }}>
                {/* Hub #1: Anchorage Int'l (ANC) */}
                <Tooltip label={`${kpiField45Data.topAirports[0].full}: ${kpiField45Data.topAirports[0].count.toLocaleString()} events`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-45-departure_airport")}
                    style={{
                      flex: 36,
                      background: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 20 : 6,
                      gap: isMaximized ? 4 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Group gap={6} align="center" style={{ marginBottom: isMaximized ? 4 : 1 }}>
                      <CountryFlagSvg countryCode={kpiField45Data.topAirports[0].country} width={isMaximized ? 32 : 22} height={isMaximized ? 20 : 14} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.85rem", letterSpacing: 0.5, color: "#e7f5ff" }}>
                        {kpiField45Data.topAirports[0].code}
                      </Text>
                    </Group>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.85rem", color: "#fff", lineHeight: 1.1, textAlign: "center", marginTop: 2 }} truncate>
                      {kpiField45Data.topAirports[0].name}
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.2rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                      {kpiField45Data.topAirports[0].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.62rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1 }}>
                      departures
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={8} align="center">
                        <Group gap={3} align="center">
                          <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField45Data.topAirports[0].deaths} {kpiField45Data.topAirports[0].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField45Data.topAirports[0].survivors} {kpiField45Data.topAirports[0].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Hub #2: Amsterdam Schiphol (AMS) */}
                <Tooltip label={`${kpiField45Data.topAirports[1].full}: ${kpiField45Data.topAirports[1].count.toLocaleString()} events`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-45-departure_airport")}
                    style={{
                      flex: 34,
                      background: "linear-gradient(135deg, #d9480f 0%, #e8590c 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 20 : 6,
                      gap: isMaximized ? 4 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Group gap={6} align="center" style={{ marginBottom: isMaximized ? 4 : 1 }}>
                      <CountryFlagSvg countryCode={kpiField45Data.topAirports[1].country} width={isMaximized ? 32 : 22} height={isMaximized ? 20 : 14} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.85rem", letterSpacing: 0.5, color: "#fff4e6" }}>
                        {kpiField45Data.topAirports[1].code}
                      </Text>
                    </Group>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.85rem", color: "#fff", lineHeight: 1.1, textAlign: "center", marginTop: 2 }} truncate>
                      {kpiField45Data.topAirports[1].name}
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.2rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                      {kpiField45Data.topAirports[1].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.62rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1 }}>
                      departures
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={8} align="center">
                        <Group gap={3} align="center">
                          <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField45Data.topAirports[1].deaths} {kpiField45Data.topAirports[1].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField45Data.topAirports[1].survivors} {kpiField45Data.topAirports[1].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Hub #3: London Heathrow (LHR) */}
                <Tooltip label={`${kpiField45Data.topAirports[2].full}: ${kpiField45Data.topAirports[2].count.toLocaleString()} events`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-45-departure_airport")}
                    style={{
                      flex: 30,
                      background: "linear-gradient(135deg, #6741d9 0%, #7950f2 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 20 : 6,
                      gap: isMaximized ? 4 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Group gap={6} align="center" style={{ marginBottom: isMaximized ? 4 : 1 }}>
                      <CountryFlagSvg countryCode={kpiField45Data.topAirports[2].country} width={isMaximized ? 32 : 22} height={isMaximized ? 20 : 14} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.85rem", letterSpacing: 0.5, color: "#f3f0ff" }}>
                        {kpiField45Data.topAirports[2].code}
                      </Text>
                    </Group>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.85rem", color: "#fff", lineHeight: 1.1, textAlign: "center", marginTop: 2 }} truncate>
                      {kpiField45Data.topAirports[2].name}
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.2rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                      {kpiField45Data.topAirports[2].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.62rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1 }}>
                      departures
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={8} align="center">
                        <Group gap={3} align="center">
                          <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField45Data.topAirports[2].deaths} {kpiField45Data.topAirports[2].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField45Data.topAirports[2].survivors} {kpiField45Data.topAirports[2].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>
              </div>

              {/* Bottom Row: Airfield Categories & Secondary Hubs */}
              <div style={{ display: "flex", flex: isMaximized ? 6 : 4.2, gap: 4, width: "100%" }}>
                {/* Category 1: Regional & Bush Airstrips */}
                <Tooltip label={`Regional & Bush Airfields: ${kpiField45Data.categories[0].count.toLocaleString()} events (${kpiField45Data.categories[0].pct})`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-45-departure_airport")}
                    style={{
                      flex: 45,
                      background: "linear-gradient(135deg, #099268 0%, #0ca678 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.68rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                      Regional & Bush
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "0.95rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      {kpiField45Data.categories[0].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      {kpiField45Data.categories[0].pct} of recorded
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={6} align="center">
                        <Group gap={2} align="center">
                          <Skull size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField45Data.categories[0].deaths} ({kpiField45Data.categories[0].deathRate})
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField45Data.categories[0].survivors} ({kpiField45Data.categories[0].survivorRate})
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Category 2: Civil & Commercial Major Hubs */}
                <Tooltip label={`Civil & Commercial Hubs: ${kpiField45Data.categories[1].count.toLocaleString()} events (${kpiField45Data.categories[1].pct})`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-45-departure_airport")}
                    style={{
                      flex: 40,
                      background: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.68rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                      Commercial Hubs
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "0.95rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      {kpiField45Data.categories[1].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      {kpiField45Data.categories[1].pct} of recorded
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={6} align="center">
                        <Group gap={2} align="center">
                          <Skull size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField45Data.categories[1].deaths} ({kpiField45Data.categories[1].deathRate})
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField45Data.categories[1].survivors} ({kpiField45Data.categories[1].survivorRate})
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Category 3: Military & Tactical Air Bases */}
                <Tooltip label={`Military & Tactical Bases: ${kpiField45Data.categories[2].count.toLocaleString()} events (${kpiField45Data.categories[2].pct})`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-45-departure_airport")}
                    style={{
                      flex: 15,
                      background: "linear-gradient(135deg, #a61e4d 0%, #d6336c 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.68rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                      Military Bases
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "0.95rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      {kpiField45Data.categories[2].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      {kpiField45Data.categories[2].pct}
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={6} align="center">
                        <Group gap={2} align="center">
                          <Skull size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField45Data.categories[2].deaths} ({kpiField45Data.categories[2].deathRate})
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField45Data.categories[2].survivors} ({kpiField45Data.categories[2].survivorRate})
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>
              </div>

              {/* Maximized Extra Leaderboard Grid */}
              {isMaximized && (
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, width: "100%" }}>
                  {kpiField45Data.topAirports.slice(3).map((hub, idx) => (
                    <Paper
                      key={idx}
                      p="md"
                      radius="md"
                      withBorder
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderColor: "rgba(255,255,255,0.15)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <Group justify="space-between" align="center">
                        <Group gap={6} align="center">
                          <CountryFlagSvg countryCode={hub.country} width={20} height={13} />
                          <Text fw={900} size="sm" c="blue.3">
                            {hub.code}
                          </Text>
                        </Group>
                        <Text fw={900} size="md" c="white">
                          {hub.count.toLocaleString()} <Text span size="xs" c="dimmed">events</Text>
                        </Text>
                      </Group>
                      <Text fw={700} size="sm" c="white" truncate>
                        {hub.name}
                      </Text>
                      <Group gap={8} mt={4}>
                        <Group gap={3}>
                          <Skull size={14} color="#ff6b6b" />
                          <Text size="xs" fw={700} c="red.3">{hub.deaths} ({hub.deathRate})</Text>
                        </Group>
                        <Group gap={3}>
                          <UserCheck size={14} color="#51cf66" />
                          <Text size="xs" fw={700} c="teal.3">{hub.survivors} ({hub.survivorRate})</Text>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </div>
              )}
            </div>
          )}
        </KpiWindowCard>

        

        {/* Field #47 KPI Card: destination_airport */}
        <KpiWindowCard
          id="kpi-field-47-destination_airport"
          title="Arrival"
          badgeKey="destination_airport"
          badgeColor="#0ca678"
          badgeText="60,926 Unique Arrival Hubs"
          minWidth={minimizedCardIds.has("kpi-field-47-destination_airport") ? "fit-content" : 440}
          bgGradient="linear-gradient(145deg, rgba(12, 166, 120, 0.04) 0%, rgba(28, 126, 214, 0.08) 100%)"
          borderColor="rgba(12, 166, 120, 0.3)"
          iconBgGradient="linear-gradient(135deg, #0ca678 0%, #20c997 100%)"
          iconBoxShadow="0 4px 12px rgba(12, 166, 120, 0.35)"
          icon={<PlaneLanding size={18} color="#ffffff" />}
          subIcon={<CheckCircle2 size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Top Row: 3 Primary Arrival Hubs */}
              <div style={{ display: "flex", flex: isMaximized ? 4 : 5.8, gap: 4, width: "100%" }}>
                {/* Hub #1: Anchorage Int'l (ANC) */}
                <Tooltip label={`${kpiField47Data.topAirports[0].full}: ${kpiField47Data.topAirports[0].count.toLocaleString()} events`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-47-destination_airport")}
                    style={{
                      flex: 36,
                      background: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 20 : 6,
                      gap: isMaximized ? 4 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Group gap={6} align="center" style={{ marginBottom: isMaximized ? 4 : 1 }}>
                      <CountryFlagSvg countryCode={kpiField47Data.topAirports[0].country} width={isMaximized ? 32 : 22} height={isMaximized ? 20 : 14} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.85rem", letterSpacing: 0.5, color: "#e7f5ff" }}>
                        {kpiField47Data.topAirports[0].code}
                      </Text>
                    </Group>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.85rem", color: "#fff", lineHeight: 1.1, textAlign: "center", marginTop: 2 }} truncate>
                      {kpiField47Data.topAirports[0].name}
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.2rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                      {kpiField47Data.topAirports[0].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.62rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1 }}>
                      arrivals
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={8} align="center">
                        <Group gap={3} align="center">
                          <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField47Data.topAirports[0].deaths} {kpiField47Data.topAirports[0].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField47Data.topAirports[0].survivors} {kpiField47Data.topAirports[0].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Hub #2: Miami Int'l (MIA) */}
                <Tooltip label={`${kpiField47Data.topAirports[1].full}: ${kpiField47Data.topAirports[1].count.toLocaleString()} events`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-47-destination_airport")}
                    style={{
                      flex: 34,
                      background: "linear-gradient(135deg, #d9480f 0%, #f59f00 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 20 : 6,
                      gap: isMaximized ? 4 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Group gap={6} align="center" style={{ marginBottom: isMaximized ? 4 : 1 }}>
                      <CountryFlagSvg countryCode={kpiField47Data.topAirports[1].country} width={isMaximized ? 32 : 22} height={isMaximized ? 20 : 14} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.85rem", letterSpacing: 0.5, color: "#fff4e6" }}>
                        {kpiField47Data.topAirports[1].code}
                      </Text>
                    </Group>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.85rem", color: "#fff", lineHeight: 1.1, textAlign: "center", marginTop: 2 }} truncate>
                      {kpiField47Data.topAirports[1].name}
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.2rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                      {kpiField47Data.topAirports[1].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.62rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1 }}>
                      arrivals
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={8} align="center">
                        <Group gap={3} align="center">
                          <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField47Data.topAirports[1].deaths} {kpiField47Data.topAirports[1].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField47Data.topAirports[1].survivors} {kpiField47Data.topAirports[1].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Hub #3: London Heathrow (LHR) */}
                <Tooltip label={`${kpiField47Data.topAirports[2].full}: ${kpiField47Data.topAirports[2].count.toLocaleString()} events`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-47-destination_airport")}
                    style={{
                      flex: 30,
                      background: "linear-gradient(135deg, #6741d9 0%, #7950f2 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 20 : 6,
                      gap: isMaximized ? 4 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Group gap={6} align="center" style={{ marginBottom: isMaximized ? 4 : 1 }}>
                      <CountryFlagSvg countryCode={kpiField47Data.topAirports[2].country} width={isMaximized ? 32 : 22} height={isMaximized ? 20 : 14} />
                      <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.85rem", letterSpacing: 0.5, color: "#f3f0ff" }}>
                        {kpiField47Data.topAirports[2].code}
                      </Text>
                    </Group>
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.85rem", color: "#fff", lineHeight: 1.1, textAlign: "center", marginTop: 2 }} truncate>
                      {kpiField47Data.topAirports[2].name}
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.2rem" : "1.2rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                      {kpiField47Data.topAirports[2].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.62rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1 }}>
                      arrivals
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={8} align="center">
                        <Group gap={3} align="center">
                          <Skull size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField47Data.topAirports[2].deaths} {kpiField47Data.topAirports[2].deathRate}
                          </Text>
                        </Group>
                        <Group gap={3} align="center">
                          <UserCheck size={18} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.1rem" }}>
                            {kpiField47Data.topAirports[2].survivors} {kpiField47Data.topAirports[2].survivorRate}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>
              </div>

              {/* Bottom Row: Airfield Categories & Secondary Hubs */}
              <div style={{ display: "flex", flex: isMaximized ? 6 : 4.2, gap: 4, width: "100%" }}>
                {/* Category 1: Regional & Bush Airstrips */}
                <Tooltip label={`Regional & Bush Airfields: ${kpiField47Data.categories[0].count.toLocaleString()} events (${kpiField47Data.categories[0].pct})`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-47-destination_airport")}
                    style={{
                      flex: 45,
                      background: "linear-gradient(135deg, #099268 0%, #0ca678 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.68rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                      Regional & Bush
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "0.95rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      {kpiField47Data.categories[0].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      {kpiField47Data.categories[0].pct} of recorded
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={6} align="center">
                        <Group gap={2} align="center">
                          <Skull size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField47Data.categories[0].deaths} ({kpiField47Data.categories[0].deathRate})
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField47Data.categories[0].survivors} ({kpiField47Data.categories[0].survivorRate})
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Category 2: Civil & Commercial Major Hubs */}
                <Tooltip label={`Civil & Commercial Hubs: ${kpiField47Data.categories[1].count.toLocaleString()} events (${kpiField47Data.categories[1].pct})`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-47-destination_airport")}
                    style={{
                      flex: 45,
                      background: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.68rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                      Commercial Hubs
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "0.95rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      {kpiField47Data.categories[1].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      {kpiField47Data.categories[1].pct} of recorded
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={6} align="center">
                        <Group gap={2} align="center">
                          <Skull size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField47Data.categories[1].deaths} ({kpiField47Data.categories[1].deathRate})
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField47Data.categories[1].survivors} ({kpiField47Data.categories[1].survivorRate})
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Category 3: Military & Tactical Air Bases */}
                <Tooltip label={`Military & Tactical Bases: ${kpiField47Data.categories[2].count.toLocaleString()} events (${kpiField47Data.categories[2].pct})`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-47-destination_airport")}
                    style={{
                      flex: 10,
                      background: "linear-gradient(135deg, #a61e4d 0%, #d6336c 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 16 : 4,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "1.6rem" : "0.68rem", color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
                      Military Bases
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "0.95rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      {kpiField47Data.categories[2].count.toLocaleString()}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      {kpiField47Data.categories[2].pct}
                    </Text>

                    {isMaximized && (
                      <Stack gap={2} mt={6} align="center">
                        <Group gap={2} align="center">
                          <Skull size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField47Data.categories[2].deaths} ({kpiField47Data.categories[2].deathRate})
                          </Text>
                        </Group>
                        <Group gap={2} align="center">
                          <UserCheck size={14} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                            {kpiField47Data.categories[2].survivors} ({kpiField47Data.categories[2].survivorRate})
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>
              </div>

              {/* Maximized Extra Leaderboard Grid (8 Secondary Hubs in 4x2) */}
              {isMaximized && (
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, width: "100%" }}>
                  {kpiField47Data.topAirports.slice(3).map((hub, idx) => (
                    <Paper
                      key={idx}
                      p="md"
                      radius="md"
                      withBorder
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderColor: "rgba(255,255,255,0.15)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <Group justify="space-between" align="center">
                        <Group gap={6} align="center">
                          <CountryFlagSvg countryCode={hub.country} width={20} height={13} />
                          <Text fw={900} size="sm" c="teal.3">
                            {hub.code}
                          </Text>
                        </Group>
                        <Text fw={900} size="md" c="white">
                          {hub.count.toLocaleString()} <Text span size="xs" c="dimmed">arrivals</Text>
                        </Text>
                      </Group>
                      <Text fw={700} size="sm" c="white" truncate>
                        {hub.name}
                      </Text>
                      <Group gap={8} mt={4}>
                        <Group gap={3}>
                          <Skull size={14} color="#ff6b6b" />
                          <Text size="xs" fw={700} c="red.3">{hub.deaths} ({hub.deathRate})</Text>
                        </Group>
                        <Group gap={3}>
                          <UserCheck size={14} color="#51cf66" />
                          <Text size="xs" fw={700} c="teal.3">{hub.survivors} ({hub.survivorRate})</Text>
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </div>
              )}
            </div>
          )}
        </KpiWindowCard>

        

        

        

        {/* Field #51 KPI Card: investigating_agency */}
        <KpiWindowCard
          id="kpi-field-51-investigating_agency"
          title="Investigation Authority"
          badgeKey="investigating_agency"
          badgeColor="#1c7ed6"
          badgeText="254 Active Investigation Authorities"
          minWidth={minimizedCardIds.has("kpi-field-51-investigating_agency") ? "fit-content" : 440}
          bgGradient="linear-gradient(145deg, rgba(28, 126, 214, 0.04) 0%, rgba(12, 166, 120, 0.08) 100%)"
          borderColor="rgba(28, 126, 214, 0.3)"
          iconBgGradient="linear-gradient(135deg, #1c7ed6 0%, #1864ab 100%)"
          iconBoxShadow="0 4px 12px rgba(28, 126, 214, 0.35)"
          icon={<ShieldCheck size={18} color="#ffffff" />}
          subIcon={<CheckCircle2 size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Main Treemap View */}
              <div style={{ display: "flex", flex: 1, gap: 4, width: "100%", height: "100%" }}>
                {/* Left Hero Box: NTSB (68.0% of recorded, 26.8% of total) */}
                <Tooltip label={`NTSB (National Transportation Safety Board): 106,397 events (68.0% of recorded)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-51-investigating_agency")}
                    style={{
                      flex: 58,
                      background: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 24 : 8,
                      gap: isMaximized ? 4 : 2,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      textAlign: "center",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "4.2rem" : "1.25rem", color: "#fff", lineHeight: 1.1, letterSpacing: 1 }}>
                      NTSB
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.4rem" : "0.62rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1, maxWidth: "90%" }} truncate>
                      National Transportation Safety Board
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "5.4rem" : "1.4rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                      68.0%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "2.0rem" : "0.68rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      106,397 events
                    </Text>

                    {isMaximized && (
                      <Stack gap={4} mt={16} align="center">
                        <Group gap={6} align="center">
                          <Skull size={22} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem" }}>
                            58,371 (12.5%)
                          </Text>
                        </Group>
                        <Group gap={6} align="center">
                          <UserCheck size={22} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                          <Text fw={900} style={{ color: "#ffffff", fontSize: "1.4rem" }}>
                            408,028 (87.5%)
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </div>
                </Tooltip>

                {/* Right Column Stack: BFU, AAIB, CENIPA, BEA, ATSB/BASI, TSB, CAA S.A., Others */}
                <div style={{ flex: 42, display: "flex", flexDirection: "column", gap: 4 }}>
                  {/* Row 1: BFU (Germany) & AAIB (UK) */}
                  <div style={{ flex: 40, display: "flex", gap: 4 }}>
                    {/* BFU */}
                    <Tooltip label={`BFU (Germany): 5,403 events (3.5% of recorded)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-51-investigating_agency")}
                        style={{
                          flex: 51,
                          background: "linear-gradient(135deg, #d9480f 0%, #f59f00 100%)",
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 14 : 3,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textAlign: "center",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.82rem", color: "#fff", lineHeight: 1.1 }}>
                          BFU
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "3.0rem" : "0.95rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                          3.5%
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.58rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                          5,403 events
                        </Text>

                        {isMaximized && (
                          <Stack gap={2} mt={6} align="center">
                            <Group gap={4} align="center">
                              <Skull size={15} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.05rem" }}>
                                1,267 (5.1%)
                              </Text>
                            </Group>
                            <Group gap={4} align="center">
                              <UserCheck size={15} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.05rem" }}>
                                23,490 (94.9%)
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>

                    {/* AAIB */}
                    <Tooltip label={`AAIB (United Kingdom): 5,127 events (3.3% of recorded)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-51-investigating_agency")}
                        style={{
                          flex: 49,
                          background: "linear-gradient(135deg, #6741d9 0%, #7950f2 100%)",
                          borderRadius: 5,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 14 : 3,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textAlign: "center",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.82rem", color: "#fff", lineHeight: 1.1 }}>
                          AAIB
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "3.0rem" : "0.95rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                          3.3%
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.3rem" : "0.58rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                          5,127 events
                        </Text>

                        {isMaximized && (
                          <Stack gap={2} mt={6} align="center">
                            <Group gap={4} align="center">
                              <Skull size={15} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.05rem" }}>
                                1,492 (1.1%)
                              </Text>
                            </Group>
                            <Group gap={4} align="center">
                              <UserCheck size={15} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "1.05rem" }}>
                                140,081 (98.9%)
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  </div>

                  {/* Row 2: CENIPA (Brazil), BEA (France), ATSB/BASI (Australia) */}
                  <div style={{ flex: 32, display: "flex", gap: 4 }}>
                    {/* CENIPA */}
                    <Tooltip label={`CENIPA (Brazil): 4,161 events (2.7% of recorded)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-51-investigating_agency")}
                        style={{
                          flex: 32,
                          background: "linear-gradient(135deg, #099268 0%, #0ca678 100%)",
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 10 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textAlign: "center",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.68rem", color: "#fff", lineHeight: 1.1 }}>
                          CENIPA
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.78rem", color: "#ffffff", lineHeight: 1.1 }}>
                          2.7%
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.05rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                          4,161 events
                        </Text>
                        {isMaximized && (
                          <Stack gap={2} mt={4} align="center">
                            <Group gap={3} align="center">
                              <Skull size={13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.9rem" }}>
                                3,395 (14.4%)
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.9rem" }}>
                                20,126 (85.6%)
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>

                    {/* BEA */}
                    <Tooltip label={`BEA (France): 3,648 events (2.3% of recorded)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-51-investigating_agency")}
                        style={{
                          flex: 28,
                          background: "linear-gradient(135deg, #364fc7 0%, #4c6ef5 100%)",
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 10 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textAlign: "center",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.68rem", color: "#fff", lineHeight: 1.1 }}>
                          BEA
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.78rem", color: "#ffffff", lineHeight: 1.1 }}>
                          2.3%
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.05rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                          3,648 events
                        </Text>
                        {isMaximized && (
                          <Stack gap={2} mt={4} align="center">
                            <Group gap={3} align="center">
                              <Skull size={13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.9rem" }}>
                                4,158 (15.6%)
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.9rem" }}>
                                22,430 (84.4%)
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>

                    {/* ATSB/BASI */}
                    <Tooltip label={`ATSB / BASI (Australia): 5,333 events (3.4% of recorded)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-51-investigating_agency")}
                        style={{
                          flex: 40,
                          background: "linear-gradient(135deg, #0c8599 0%, #1098ad 100%)",
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 10 : 2,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textAlign: "center",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.8rem" : "0.68rem", color: "#fff", lineHeight: 1.1 }}>
                          ATSB
                        </Text>
                        <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.78rem", color: "#ffffff", lineHeight: 1.1 }}>
                          3.4%
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.05rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                          5,333 events
                        </Text>
                        {isMaximized && (
                          <Stack gap={2} mt={4} align="center">
                            <Group gap={3} align="center">
                              <Skull size={13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.9rem" }}>
                                1,415 (5.0%)
                              </Text>
                            </Group>
                            <Group gap={3} align="center">
                              <UserCheck size={13} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.9rem" }}>
                                28,525 (95.0%)
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  </div>

                  {/* Row 3: TSB (Canada), CAA S.A. (South Africa), Others (245+ Agencies) */}
                  <div style={{ flex: 28, display: "flex", gap: 4 }}>
                    {/* TSB */}
                    <Tooltip label={`TSB (Canada): 2,638 events (1.7% of recorded)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-51-investigating_agency")}
                        style={{
                          flex: 22,
                          background: "linear-gradient(135deg, #a61e4d 0%, #d6336c 100%)",
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 8 : 1,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textAlign: "center",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.60rem", color: "#fff", lineHeight: 1 }}>
                          TSB
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1 }}>
                          1.7%
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "0.95rem" : "0.48rem", color: "rgba(255,255,255,0.85)", lineHeight: 1 }}>
                          2,638
                        </Text>
                        {isMaximized && (
                          <Stack gap={1} mt={3} align="center">
                            <Group gap={2} align="center">
                              <Skull size={12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.82rem" }}>
                                1,484 (3.7%)
                              </Text>
                            </Group>
                            <Group gap={2} align="center">
                              <UserCheck size={12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.82rem" }}>
                                38,502 (96.3%)
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>

                    {/* CAA S.A. */}
                    <Tooltip label={`CAA S.A. (South Africa): 2,296 events (1.5% of recorded)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-51-investigating_agency")}
                        style={{
                          flex: 20,
                          background: "linear-gradient(135deg, #c92a2a 0%, #e03131 100%)",
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 8 : 1,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textAlign: "center",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.58rem", color: "#fff", lineHeight: 1 }}>
                          CAA SA
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1 }}>
                          1.5%
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "0.95rem" : "0.48rem", color: "rgba(255,255,255,0.85)", lineHeight: 1 }}>
                          2,296
                        </Text>
                        {isMaximized && (
                          <Stack gap={1} mt={3} align="center">
                            <Group gap={2} align="center">
                              <Skull size={12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.82rem" }}>
                                690 (5.7%)
                              </Text>
                            </Group>
                            <Group gap={2} align="center">
                              <UserCheck size={12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.82rem" }}>
                                11,377 (94.3%)
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>

                    {/* Others */}
                    <Tooltip label={`245+ Global Investigation Bodies: 21,569 events (13.8% of recorded)`} withArrow>
                      <div
                        onClick={() => handleToggleMaximize("kpi-field-51-investigating_agency")}
                        style={{
                          flex: 58,
                          background: "linear-gradient(135deg, #343a40 0%, #495057 100%)",
                          borderRadius: 4,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#ffffff",
                          padding: isMaximized ? 8 : 1,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textAlign: "center",
                        }}
                      >
                        <Text fw={900} style={{ fontSize: isMaximized ? "1.5rem" : "0.62rem", color: "#fff", lineHeight: 1 }}>
                          Others (245+)
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "1.8rem" : "0.55rem", color: "rgba(255,255,255,0.9)", lineHeight: 1 }}>
                          13.8%
                        </Text>
                        <Text fw={700} style={{ fontSize: isMaximized ? "0.95rem" : "0.48rem", color: "rgba(255,255,255,0.85)", lineHeight: 1 }}>
                          21,569 events
                        </Text>
                        {isMaximized && (
                          <Stack gap={1} mt={3} align="center">
                            <Group gap={2} align="center">
                              <Skull size={12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.82rem" }}>
                                34,731 (9.5%)
                              </Text>
                            </Group>
                            <Group gap={2} align="center">
                              <UserCheck size={12} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                              <Text fw={900} style={{ color: "#ffffff", fontSize: "0.82rem" }}>
                                331,613 (90.5%)
                              </Text>
                            </Group>
                          </Stack>
                        )}
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          )}
        </KpiWindowCard>

        {/* Field #52 KPI Card: accident_investigation_duration */}
        <KpiWindowCard
          id="kpi-field-52-accident_investigation_duration"
          title="Investigation Timeframe"
          badgeKey="accident_investigation_duration"
          badgeColor="#0ca678"
          badgeText="89,845 Documented Inquiries • Avg 12.1 Mo"
          minWidth={minimizedCardIds.has("kpi-field-52-accident_investigation_duration") ? "fit-content" : 440}
          bgGradient="linear-gradient(145deg, rgba(12, 166, 120, 0.04) 0%, rgba(28, 126, 214, 0.08) 100%)"
          borderColor="rgba(12, 166, 120, 0.3)"
          iconBgGradient="linear-gradient(135deg, #0ca678 0%, #099268 100%)"
          iconBoxShadow="0 4px 12px rgba(12, 166, 120, 0.35)"
          icon={<Clock size={18} color="#ffffff" />}
          subIcon={<CheckCircle2 size={9} color="#ffffff" />}
          subIconBgColor="#0ca678"
          hiddenCardIds={hiddenCardIds}
          minimizedCardIds={minimizedCardIds}
          maximizedCardId={maximizedCardId}
          onHide={handleHide}
          onToggleMinimize={handleToggleMinimize}
          onToggleMaximize={handleToggleMaximize}
        >
          {(isMaximized) => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: isMaximized ? "calc(100vh - 175px)" : 240,
                borderRadius: 8,
                overflow: "hidden",
                gap: 4,
                backgroundColor: "rgba(0,0,0,0.1)",
                padding: 4,
                marginTop: 4,
                transition: "height 0.35s ease-in-out",
              }}
            >
              {/* Top Row: Rapid (<6 Months, 33.3%) & Standard (6–12 Months, 31.8%) */}
              <div style={{ display: "flex", flex: 52, gap: 4, width: "100%" }}>
                {/* Rapid (< 6 Months) */}
                <Tooltip label={`Rapid Inquiry (< 6 Months): 29,887 events (33.3% of recorded duration)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-52-accident_investigation_duration")}
                    style={{
                      flex: 51,
                      background: "linear-gradient(135deg, #099268 0%, #0ca678 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 20 : 6,
                      gap: isMaximized ? 3 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      textAlign: "center",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "0.95rem", color: "#fff", lineHeight: 1.1 }}>
                      &lt; 6 Months
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.58rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1 }}>
                      Rapid Inquiry
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "4.2rem" : "1.25rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                      33.3%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.6rem" : "0.65rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      29,887 events
                    </Text>

                    <Stack gap={isMaximized ? 3 : 1} mt={isMaximized ? 8 : 2} align="center">
                      <Group gap={isMaximized ? 4 : 2} align="center">
                        <Skull size={isMaximized ? 18 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.58rem" }}>
                          16,090 (15.8%)
                        </Text>
                      </Group>
                      <Group gap={isMaximized ? 4 : 2} align="center">
                        <UserCheck size={isMaximized ? 18 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.58rem" }}>
                          85,827 (84.2%)
                        </Text>
                      </Group>
                    </Stack>
                  </div>
                </Tooltip>

                {/* Standard (6–12 Months) */}
                <Tooltip label={`Standard Review (6–12 Months): 28,615 events (31.8% of recorded duration)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-52-accident_investigation_duration")}
                    style={{
                      flex: 49,
                      background: "linear-gradient(135deg, #1864ab 0%, #1c7ed6 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 20 : 6,
                      gap: isMaximized ? 3 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      textAlign: "center",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.6rem" : "0.95rem", color: "#fff", lineHeight: 1.1 }}>
                      6–12 Months
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.2rem" : "0.58rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1 }}>
                      Standard Review
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "4.2rem" : "1.25rem", color: "#ffffff", marginTop: 2, lineHeight: 1.1 }}>
                      31.8%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.6rem" : "0.65rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      28,615 events
                    </Text>

                    <Stack gap={isMaximized ? 3 : 1} mt={isMaximized ? 8 : 2} align="center">
                      <Group gap={isMaximized ? 4 : 2} align="center">
                        <Skull size={isMaximized ? 18 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.58rem" }}>
                          19,091 (9.9%)
                        </Text>
                      </Group>
                      <Group gap={isMaximized ? 4 : 2} align="center">
                        <UserCheck size={isMaximized ? 18 : 10} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.1rem" : "0.58rem" }}>
                          173,051 (90.1%)
                        </Text>
                      </Group>
                    </Stack>
                  </div>
                </Tooltip>
              </div>

              {/* Bottom Row: Extended (1–2 Years, 24.3%) & Complex Multi-Year (>2 Years, 10.6%) */}
              <div style={{ display: "flex", flex: 48, gap: 4, width: "100%" }}>
                {/* Extended (1–2 Years) */}
                <Tooltip label={`Extended Analysis (1–2 Years): 21,836 events (24.3% of recorded duration)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-52-accident_investigation_duration")}
                    style={{
                      flex: 70,
                      background: "linear-gradient(135deg, #d9480f 0%, #f59f00 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 18 : 5,
                      gap: isMaximized ? 3 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      textAlign: "center",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.4rem" : "0.90rem", color: "#fff", lineHeight: 1.1 }}>
                      1–2 Years
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.15rem" : "0.55rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1 }}>
                      Extended Analysis (13–24 Mo)
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.8rem" : "1.15rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      24.3%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.5rem" : "0.62rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      21,836 events
                    </Text>

                    <Stack gap={isMaximized ? 2 : 1} mt={isMaximized ? 6 : 2} align="center">
                      <Group gap={isMaximized ? 3 : 2} align="center">
                        <Skull size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.05rem" : "0.55rem" }}>
                          17,774 (8.4%)
                        </Text>
                      </Group>
                      <Group gap={isMaximized ? 3 : 2} align="center">
                        <UserCheck size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.05rem" : "0.55rem" }}>
                          194,911 (91.6%)
                        </Text>
                      </Group>
                    </Stack>
                  </div>
                </Tooltip>

                {/* Complex (> 2 Years) */}
                <Tooltip label={`Complex Inquiry (> 2 Years): 9,507 events (10.6% of recorded duration)`} withArrow>
                  <div
                    onClick={() => handleToggleMaximize("kpi-field-52-accident_investigation_duration")}
                    style={{
                      flex: 30,
                      background: "linear-gradient(135deg, #c92a2a 0%, #e03131 100%)",
                      borderRadius: 6,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#ffffff",
                      padding: isMaximized ? 18 : 5,
                      gap: isMaximized ? 3 : 1,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      textAlign: "center",
                    }}
                  >
                    <Text fw={900} style={{ fontSize: isMaximized ? "2.2rem" : "0.85rem", color: "#fff", lineHeight: 1.1 }}>
                      &gt; 2 Years
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.1rem" : "0.52rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.1 }}>
                      Multi-Year Complex
                    </Text>
                    <Text fw={900} style={{ fontSize: isMaximized ? "3.6rem" : "1.15rem", color: "#ffffff", marginTop: 1, lineHeight: 1.1 }}>
                      10.6%
                    </Text>
                    <Text fw={700} style={{ fontSize: isMaximized ? "1.4rem" : "0.62rem", color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
                      9,507 events
                    </Text>

                    <Stack gap={isMaximized ? 2 : 1} mt={isMaximized ? 6 : 2} align="center">
                      <Group gap={isMaximized ? 3 : 2} align="center">
                        <Skull size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.05rem" : "0.55rem" }}>
                          15,359 (9.9%)
                        </Text>
                      </Group>
                      <Group gap={isMaximized ? 3 : 2} align="center">
                        <UserCheck size={isMaximized ? 16 : 9} color="#ffffff" strokeWidth={2.5} style={{ opacity: 0.95 }} />
                        <Text fw={900} style={{ color: "#ffffff", fontSize: isMaximized ? "1.05rem" : "0.55rem" }}>
                          139,120 (90.1%)
                        </Text>
                      </Group>
                    </Stack>
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
        </KpiWindowCard>



        

        
      </Flex>
    </Stack>
  );
}

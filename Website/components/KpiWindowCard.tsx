"use client";

import { ActionIcon, Card, Group, Text, Tooltip } from "@mantine/core";
import { ChevronDown, ChevronUp, Minimize2, Square, X } from "lucide-react";
import React from "react";

export interface KpiWindowCardProps {
  id: string;
  title: string;
  badgeKey: string;
  badgeColor?: string;
  icon: React.ReactNode;
  subIcon?: React.ReactNode;
  subIconBgColor?: string;
  badgeText?: string;
  subBadgeText?: string;
  minWidth?: number | string;
  flex?: string;
  flexWidth?: string;
  bgGradient: string;
  borderColor: string;
  iconBgGradient: string;
  iconBoxShadow: string;
  hiddenCardIds: Set<string>;
  minimizedCardIds: Set<string>;
  maximizedCardId: string | null;
  allowMaximize?: boolean;
  onHide: (id: string) => void;
  onToggleMinimize: (id: string) => void;
  onToggleMaximize: (id: string) => void;
  children: (isMaximized: boolean) => React.ReactNode;
}

export function KpiWindowCard({
  id,
  title,
  badgeKey,
  badgeColor = "#1c7ed6",
  icon,
  subIcon,
  subIconBgColor = "#0ca678",
  badgeText,
  subBadgeText,
  minWidth = 320,
  flex = "0 1 auto",
  flexWidth,
  bgGradient,
  borderColor,
  iconBgGradient,
  iconBoxShadow,
  hiddenCardIds,
  minimizedCardIds,
  maximizedCardId,
  allowMaximize = true,
  onHide,
  onToggleMinimize,
  onToggleMaximize,
  children,
}: KpiWindowCardProps) {
  if (hiddenCardIds.has(id)) return null;

  const isMinimized = minimizedCardIds.has(id);
  const isMaximized = maximizedCardId === id;

  const effectiveMinWidth = isMinimized ? "fit-content" : minWidth;
  const effectiveFlex = isMinimized ? "0 0 auto" : flexWidth || flex;

  return (
    <>
      {/* Dim Backdrop overlay when this card is maximized */}
      {isMaximized && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 9998,
            transition: "opacity 0.35s ease",
          }}
          onClick={() => onToggleMaximize(id)}
        />
      )}

      <Card
        padding="sm"
        radius="md"
        withBorder
        className={`kpi-compact-card ${isMinimized ? "kpi-card-minimized" : ""} ${isMaximized ? "kpi-card-maximized" : ""}`}
        style={
          isMaximized
            ? {
                position: "fixed",
                top: 16,
                left: 240,
                right: 16,
                bottom: 16,
                zIndex: 9999,
                width: "calc(100vw - 256px)",
                height: "calc(100vh - 32px)",
                background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
                color: "#ffffff",
                borderColor: "rgba(255, 255, 255, 0.2)",
                boxShadow: "0 25px 60px rgba(0, 0, 0, 0.75)",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                flexDirection: "column",
                overflow: "auto",
              }
            : isMinimized
            ? {
                width: "fit-content",
                minWidth: "fit-content",
                maxWidth: "fit-content",
                flex: "0 0 auto",
                alignSelf: "flex-start",
                background: bgGradient,
                borderColor,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                overflow: "hidden",
              }
            : {
                minWidth: effectiveMinWidth,
                flex: effectiveFlex,
                background: bgGradient,
                borderColor,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.05)",
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                overflow: "hidden",
              }
        }
      >
        {/* Windows Title Bar / Header */}
        <Group justify={isMinimized ? "flex-start" : "space-between"} align="center" gap={isMinimized ? 12 : "md"} mb={isMinimized ? 0 : 8} wrap="nowrap">
          <Group gap={10} wrap="nowrap">
            {/* Graphic Icon Badge */}
            <div
              style={{
                position: "relative",
                width: isMaximized ? 46 : 38,
                height: isMaximized ? 46 : 38,
                borderRadius: isMaximized ? 12 : 10,
                background: iconBgGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: iconBoxShadow,
                border: "1.5px solid rgba(255, 255, 255, 0.2)",
                flexShrink: 0,
                transition: "all 0.3s ease",
              }}
            >
              {icon}
            </div>

            <div>
              <Text fw={800} style={{ fontSize: isMaximized ? "1.2rem" : "0.85rem", lineHeight: 1.1, color: isMaximized ? "#ffffff" : undefined }}>
                {title}
              </Text>
              <Text size="xs" c={isMaximized ? "gray.4" : "dimmed"} style={{ fontSize: isMaximized ? "0.85rem" : "0.68rem" }}>
                Key: <code style={{ fontWeight: 700, color: isMaximized ? "#38bdf8" : badgeColor }}>{badgeKey}</code>
              </Text>
            </div>
          </Group>

          {/* Right Header Controls (Badge Text + Windows Action Buttons) */}
          <Group gap={8} wrap="nowrap" align="center">
            {(badgeText || subBadgeText) && !isMinimized && (
              <Group gap={4} wrap="nowrap" style={{ marginRight: 4 }}>
                {badgeText && (
                  <Text size="xs" fw={700} c={isMaximized ? "gray.3" : "dimmed"} style={{ fontSize: isMaximized ? "0.9rem" : "0.68rem" }}>
                    {badgeText}
                  </Text>
                )}
                {subBadgeText && (
                  <Text size="xs" fw={700} c={isMaximized ? "sky.3" : "blue"} style={{ fontSize: isMaximized ? "0.85rem" : "0.65rem" }}>
                    • {subBadgeText}
                  </Text>
                )}
              </Group>
            )}

            {/* Windows Control Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                backgroundColor: isMaximized ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.05)",
                padding: "3px 6px",
                borderRadius: 8,
                border: isMaximized ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid rgba(0, 0, 0, 0.06)",
                boxShadow: isMaximized ? "0 2px 8px rgba(0,0,0,0.3)" : undefined,
              }}
            >
              {/* Minimize Button */}
              <Tooltip label={isMinimized ? "Restore Body" : "Minimize"} withArrow>
                <ActionIcon
                  size={24}
                  radius="xs"
                  variant="subtle"
                  color={isMaximized ? "gray.0" : "gray"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMinimize(id);
                  }}
                  style={{ transition: "all 0.15s ease" }}
                >
                  {isMinimized ? (
                    <ChevronDown size={15} strokeWidth={3} color="#1c7ed6" />
                  ) : (
                    <ChevronUp size={15} strokeWidth={3} color={isMaximized ? "#ffffff" : "#495057"} />
                  )}
                </ActionIcon>
              </Tooltip>

              {/* Maximize / Restore Button */}
              {allowMaximize && (
                <Tooltip label={isMaximized ? "Restore Size" : "Maximize"} withArrow>
                  <ActionIcon
                    size={24}
                    radius="xs"
                    variant="subtle"
                    color={isMaximized ? "blue.2" : "gray"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMaximize(id);
                    }}
                    style={{ transition: "all 0.15s ease" }}
                  >
                    {isMaximized ? (
                      <Minimize2 size={14} strokeWidth={3} color="#38bdf8" />
                    ) : (
                      <Square size={13} strokeWidth={2.5} color="#1c7ed6" />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}

              {/* Close Button */}
              <Tooltip label={isMaximized ? "Restore Normal Size" : "Close KPI"} withArrow>
                <ActionIcon
                  size={24}
                  radius="xs"
                  variant="subtle"
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onHide(id);
                  }}
                  style={{ transition: "all 0.15s ease" }}
                >
                  <X size={14} strokeWidth={3} color="#ff6b6b" />
                </ActionIcon>
              </Tooltip>
            </div>
          </Group>
        </Group>

        {/* Collapsible / Expandable Body */}
        {!isMinimized && (
          <div
            style={{
              maxHeight: isMaximized ? "none" : 800,
              opacity: 1,
              overflow: isMaximized ? "visible" : "visible",
              transition: "max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-in-out",
              flex: isMaximized ? 1 : "initial",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children(isMaximized)}
          </div>
        )}
      </Card>
    </>
  );
}

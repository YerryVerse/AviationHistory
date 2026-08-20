"use client";

import { ActionIcon, AppShell, Burger, Group, NavLink, ScrollArea, Text, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { BarChart3, CheckCircle2, Database, DatabaseZap, FlaskConical, Map, Moon, Rows3, Sun, Target, TimerReset } from "lucide-react";
import { useState, type ReactNode } from "react";


export type PortalView = "Overview" | "Geography" | "Timeline" | "Events" | "Data Science" | "Quality" | "KPI";

const NAVIGATION: Array<{ label: PortalView; icon: typeof BarChart3 }> = [
  { label: "Overview", icon: BarChart3 },
  { label: "Geography", icon: Map },
  { label: "Timeline", icon: TimerReset },
  { label: "Events", icon: Rows3 },
  { label: "Data Science", icon: FlaskConical },
  { label: "Quality", icon: CheckCircle2 },
  { label: "KPI", icon: Target },
];

interface CommandShellProps {
  activeView: PortalView;
  onNavigate(view: PortalView): void;
  title: string;
  subtitle: string;
  datasetReady: boolean;
  toolbar?: ReactNode;
  children: ReactNode;
}

export default function CommandShell({ activeView, onNavigate, title, subtitle, datasetReady, toolbar, children }: CommandShellProps) {
  const [opened, setOpened] = useState(false);
  const computedColorScheme = useComputedColorScheme("light");
  const { setColorScheme } = useMantineColorScheme();
  const toggleScheme = () => setColorScheme(computedColorScheme === "dark" ? "light" : "dark");

  return (
    <AppShell
      className="command-shell"
      navbar={{ width: 228, breakpoint: "md", collapsed: { mobile: !opened, desktop: false } }}
      padding={0}
    >
      <AppShell.Header className="command-mobile-header" p="xs">
        <Group justify="space-between" h="100%" px="xs" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              hiddenFrom="md"
              size="sm"
              aria-label="Toggle navigation menu"
            />
            <div className="command-brand-mark" aria-hidden>✈</div>
            <div>
              <Text style={{ fontSize: "0.6rem", color: "#8193a3", fontWeight: 600, letterSpacing: "0.06em" }}>Research Portal</Text>
              <Text fw={900} size="xs" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>AVIATION HISTORY</Text>
            </div>
          </Group>
          <ActionIcon variant="subtle" color="gray" size="md" aria-label="Toggle color scheme" onClick={toggleScheme}>
            {computedColorScheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="command-sidebar" p="md">
        <AppShell.Section className="command-brand">
          <div className="command-brand-mark" aria-hidden>✈</div>
          <div style={{ flex: 1 }}>
            <Text className="command-brand-subtitle" style={{ fontSize: "0.65rem", letterSpacing: "0.08em", color: "#8193a3", fontWeight: 600 }}>Research Portal</Text>
            <Text fw={900} c="white" size="md" style={{ textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.15, fontSize: "1rem" }}>
              AVIATION HISTORY
            </Text>
          </div>
          <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Toggle color scheme" onClick={toggleScheme}>
            {computedColorScheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </ActionIcon>
        </AppShell.Section>

        <AppShell.Section grow component={ScrollArea} mt="lg">
          <Text className="command-nav-label">Explore</Text>
          {NAVIGATION.map(({ label, icon: Icon }) => (
            <NavLink
              key={label}
              component="button"
              type="button"
              label={label}
              leftSection={<Icon size={17} />}
              active={activeView === label}
              onClick={() => { onNavigate(label); setOpened(false); }}
              className="command-nav-item"
            />
          ))}
        </AppShell.Section>

        <AppShell.Section className="dataset-status">
          <Group gap="xs" wrap="nowrap">
            <Database size={15} />
            <Text size="xs" fw={600}>{datasetReady ? "Dataset ready" : "Preparing dataset"}</Text>
          </Group>
          <Text size="xs" className="dataset-status-detail">{subtitle}</Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main className="command-main">
        {children}
        <nav className="command-mobile-bottom-nav" aria-label="Mobile quick navigation">
          {NAVIGATION.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className={`mobile-bottom-nav-item ${activeView === label ? "is-active" : ""}`}
              onClick={() => { onNavigate(label); setOpened(false); }}
              aria-label={label}
            >
              <Icon size={18} />
              <span>{label === "Data Science" ? "Science" : label}</span>
            </button>
          ))}
        </nav>
      </AppShell.Main>
    </AppShell>
  );
}

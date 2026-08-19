'use client';

import "@mantine/core/styles.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { localStorageColorSchemeManager, MantineProvider } from "@mantine/core";
import React from 'react';

import { aviationTheme, COLOR_SCHEME_STORAGE_KEY } from "./theme";

const colorSchemeManager = localStorageColorSchemeManager({ key: COLOR_SCHEME_STORAGE_KEY });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={aviationTheme} defaultColorScheme="auto" colorSchemeManager={colorSchemeManager}>
      {children}
    </MantineProvider>
  );
}

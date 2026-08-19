import { createTheme, type MantineColorScheme } from "@mantine/core";


export const COLOR_SCHEME_STORAGE_KEY = "aviation-color-scheme";

export function resolveInitialColorScheme(storage: Pick<Storage, "getItem"> = window.localStorage): MantineColorScheme {
  const stored = storage.getItem(COLOR_SCHEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "auto";
}

export const aviationTheme = createTheme({
  primaryColor: "aviation",
  primaryShade: 6,
  fontFamily: "Roboto, Arial, sans-serif",
  headings: { fontFamily: "Roboto, Arial, sans-serif", fontWeight: "700" },
  defaultRadius: "md",
  colors: {
    aviation: [
      "#e4f7f5",
      "#c8eeea",
      "#99ddd7",
      "#68ccc3",
      "#42bdb2",
      "#2aafa5",
      "#168b83",
      "#0f746e",
      "#075d58",
      "#004944",
    ],
  },
});

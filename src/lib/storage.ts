import type { PaletteMode } from "@mui/material";

const THEME_KEY = "parquet-visualizer-theme";

export function loadThemeMode(): PaletteMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable
  }
  return "dark";
}

export function saveThemeMode(mode: PaletteMode): void {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // localStorage unavailable
  }
}

import { createTheme, type PaletteMode } from "@mui/material";

const NEON_GREEN = "#39ff14";

export function buildTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            primary: { main: NEON_GREEN },
            secondary: { main: "#00e5ff" },
            background: {
              default: "#121212",
              paper: "#1e1e1e",
            },
            text: {
              primary: "#e0e0e0",
              secondary: "#a0a0a0",
            },
          }
        : {
            primary: { main: "#4a7c59" },
            secondary: { main: "#5c6bc0" },
            background: {
              default: "#f5f5f5",
              paper: "#ffffff",
            },
          }),
    },
    typography: {
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      h6: { fontWeight: 600 },
      body2: { fontSize: "0.875rem" },
      caption: { fontSize: "0.75rem" },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: "thin",
          },
        },
      },
    },
  });
}

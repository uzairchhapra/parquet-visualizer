import { createTheme, type PaletteMode } from "@mui/material";

const ACID_YELLOW = "#d4fa00";

export function buildTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            primary: { main: ACID_YELLOW },
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
            primary: { main: "#5b8fc9" },
            secondary: { main: "#7c6bc0" },
            background: {
              default: "#f0f4fa",
              paper: "#ffffff",
            },
          }),
    },
    typography: {
      fontFamily: '"DM Sans", "Helvetica", "Arial", sans-serif',
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

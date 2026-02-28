import { IconButton, Tooltip } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import type { PaletteMode } from "@mui/material";

interface Props {
  mode: PaletteMode;
  onToggle: () => void;
}

export default function ThemeToggle({ mode, onToggle }: Props) {
  return (
    <Tooltip title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}>
      <IconButton color="inherit" onClick={onToggle}>
        {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}

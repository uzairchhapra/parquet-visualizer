import { keyframes } from "@emotion/react";
import { Box, Chip, useTheme } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

const liveDot = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.7); }
`;

export default function LocalOnlyBadge() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Chip
      icon={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pl: 0.5 }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: "success.main",
              animation: `${liveDot} 2s ease-in-out infinite`,
              flexShrink: 0,
              boxShadow: isDark ? "0 0 6px #39ff14" : "none",
            }}
          />
          <LockIcon sx={{ fontSize: 14 }} />
        </Box>
      }
      label="Local-only"
      size="small"
      color="success"
      variant="outlined"
      sx={{
        ml: 2,
        fontWeight: 600,
        letterSpacing: "0.02em",
        "& .MuiChip-icon": { mr: 0 },
      }}
    />
  );
}

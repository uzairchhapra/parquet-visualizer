import { keyframes } from "@emotion/react";
import {
  Box,
  Typography,
  Chip,
  Stack,
  Link,
  useTheme,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import MemoryIcon from "@mui/icons-material/Memory";
import StorageIcon from "@mui/icons-material/Storage";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import FileDropzone from "./FileDropzone";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const glow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 6px currentColor); }
  50%       { filter: drop-shadow(0 0 20px currentColor); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(0.85); opacity: 0.5; }
`;

const PRIVACY_BADGES = [
  { icon: <CloudOffIcon fontSize="small" />, label: "Never uploaded" },
  { icon: <ShieldIcon fontSize="small" />, label: "No server" },
  { icon: <VisibilityOffIcon fontSize="small" />, label: "No tracking" },
  { icon: <MemoryIcon fontSize="small" />, label: "Runs in-browser" },
];

interface Props {
  onFile: (f: File) => void;
  disabled: boolean;
  dbReady: boolean;
}

export default function LandingPage({ onFile, disabled, dbReady }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 3, md: 6 },
        gap: 4,
      }}
    >
      {/* Hero */}
      <Box
        sx={{
          textAlign: "center",
          opacity: 0,
          animation: `${fadeUp} 0.55s ease-out forwards`,
        }}
      >
        <StorageIcon
          sx={{
            fontSize: 64,
            color: "primary.main",
            mb: 2,
            animation: isDark ? `${glow} 3s ease-in-out infinite` : "none",
          }}
        />
        <Typography
          variant="h3"
          fontWeight={800}
          letterSpacing="-0.5px"
          sx={{
            background: isDark
              ? "linear-gradient(135deg, #39ff14 0%, #00e5ff 100%)"
              : "linear-gradient(135deg, #4a7c59 0%, #5c6bc0 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1.5,
          }}
        >
          Parquet Visualizer
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          fontWeight={400}
          sx={{ maxWidth: 480, mx: "auto" }}
        >
          Explore Parquet files entirely in your browser.
          <br />
          No server. No uploads. No limits.
        </Typography>
      </Box>

      {/* Privacy badges */}
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={1}
        justifyContent="center"
        sx={{
          opacity: 0,
          animation: `${fadeUp} 0.55s ease-out 0.15s forwards`,
        }}
      >
        {PRIVACY_BADGES.map((b) => (
          <Chip
            key={b.label}
            icon={b.icon}
            label={b.label}
            size="small"
            variant="outlined"
            color="success"
            sx={{
              fontWeight: 500,
              "& .MuiChip-icon": {
                animation: isDark ? `${pulse} 2.5s ease-in-out infinite` : "none",
              },
            }}
          />
        ))}
      </Stack>

      {/* Dropzone */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 480,
          opacity: 0,
          animation: `${fadeUp} 0.55s ease-out 0.3s forwards`,
        }}
      >
        <FileDropzone onFile={onFile} disabled={disabled} />
        {!dbReady && (
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            sx={{ display: "block", mt: 1.5 }}
          >
            Initializing DuckDB-WASM engine…
          </Typography>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          opacity: 0,
          animation: `${fadeUp} 0.55s ease-out 0.45s forwards`,
          textAlign: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          Powered by{" "}
          <Link
            href="https://duckdb.org/docs/api/wasm/overview"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
          >
            DuckDB-WASM
          </Link>{" "}
          · Open source · MIT licensed
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Made with
          </Typography>
          <FavoriteIcon sx={{ fontSize: 11, color: "error.main" }} />
          <Typography variant="caption" color="text.secondary">
            by Uzair Chhapra ·
          </Typography>
          <Link
            href="https://github.com/uzairchhapra/parquet-visualizer"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}
            color="text.secondary"
          >
            <StarIcon sx={{ fontSize: 12 }} />
            <Typography variant="caption">Star on GitHub</Typography>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

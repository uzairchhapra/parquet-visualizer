import { keyframes } from "@emotion/react";
import { Box, Typography, Chip, Stack, Link } from "@mui/material";
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

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
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
            animation: `${float} 3s ease-in-out infinite`,
          }}
        />
        <Typography variant="h3" fontWeight={800} letterSpacing="-0.5px" sx={{ mb: 1.5 }}>
          Parquet Visualizer
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 480, mx: "auto" }}>
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
        sx={{ opacity: 0, animation: `${fadeUp} 0.55s ease-out 0.15s forwards` }}
      >
        {PRIVACY_BADGES.map((b) => (
          <Chip
            key={b.label}
            icon={b.icon}
            label={b.label}
            size="small"
            variant="outlined"
            color="success"
            sx={{ fontWeight: 500 }}
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
            Initializing engine…
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
        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, flexWrap: "wrap" }}
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
            underline="hover"
          >
            <StarIcon sx={{ fontSize: 12 }} />
            <Typography variant="caption">Star on GitHub</Typography>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

import { useState, useCallback, useRef } from "react";
import { keyframes } from "@emotion/react";
import { Paper, Typography, Button, useTheme } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
`;

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function FileDropzone({ onFile, disabled }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);
  const handleClick = () => !disabled && inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <Paper
      variant="outlined"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      sx={{
        p: 5,
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: dragOver
          ? "primary.main"
          : isDark
          ? "rgba(57,255,20,0.25)"
          : "divider",
        bgcolor: dragOver
          ? isDark
            ? "rgba(57,255,20,0.05)"
            : "action.hover"
          : "transparent",
        boxShadow: dragOver && isDark ? "0 0 24px rgba(57,255,20,0.15)" : "none",
        transition: "all 0.25s ease",
        opacity: disabled ? 0.5 : 1,
        userSelect: "none",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".parquet"
        hidden
        onChange={handleChange}
        disabled={disabled}
      />
      <CloudUploadIcon
        sx={{
          fontSize: 52,
          color: dragOver ? "primary.main" : "text.secondary",
          mb: 1.5,
          transition: "color 0.2s",
          animation: !disabled && !dragOver ? `${float} 3s ease-in-out infinite` : "none",
        }}
      />
      <Typography variant="body1" fontWeight={500} gutterBottom>
        Drop your .parquet file here
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        or click to browse
      </Typography>
      <Button size="small" variant="outlined" color="primary" disabled={disabled} tabIndex={-1}>
        Browse file
      </Button>
    </Paper>
  );
}

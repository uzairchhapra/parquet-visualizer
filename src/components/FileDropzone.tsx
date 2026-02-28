import { useState, useCallback, useRef } from "react";
import { Paper, Typography, Button, Box } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function FileDropzone({ onFile, disabled }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleClick = () => inputRef.current?.click();

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
      sx={{
        p: 3,
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: dragOver ? "primary.main" : "divider",
        bgcolor: dragOver ? "action.hover" : "transparent",
        transition: "all 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".parquet"
        hidden
        onChange={handleChange}
        disabled={disabled}
      />
      <CloudUploadIcon sx={{ fontSize: 40, color: "text.secondary", mb: 1 }} />
      <Typography variant="body2" color="text.secondary">
        Drag & drop a .parquet file
      </Typography>
      <Box sx={{ mt: 1 }}>
        <Button size="small" variant="outlined" disabled={disabled}>
          Browse
        </Button>
      </Box>
    </Paper>
  );
}

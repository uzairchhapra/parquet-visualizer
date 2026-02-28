import { Chip } from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";

export default function LocalOnlyBadge() {
  return (
    <Chip
      icon={<SecurityIcon />}
      label="Local-only"
      size="small"
      color="success"
      variant="outlined"
      sx={{ ml: 2 }}
    />
  );
}

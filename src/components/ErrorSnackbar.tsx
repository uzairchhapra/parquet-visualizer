import { Snackbar, Alert } from "@mui/material";

interface Props {
  message: string | null;
  onClose: () => void;
}

export default function ErrorSnackbar({ message, onClose }: Props) {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={8000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity="error" variant="filled" sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

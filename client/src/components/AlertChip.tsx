import { Snackbar, Alert } from "@mui/material";

interface AlertChipProps {
  open: boolean;
  message: string;
  severity: "error" | "success" | "warning" | "info";
  onClose: () => void;
}

export default function AlertChip({ open, message, severity, onClose }: AlertChipProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled" sx={{ borderRadius: "10px" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
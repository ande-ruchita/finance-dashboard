import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
} from "@mui/material";
import api from "../services/api";
import { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import AlertChip from "../components/AlertChip";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState<{ open: boolean; message: string; severity: "error" | "success" }>({
    open: false,
    message: "",
    severity: "error",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token);
      setAlert({ open: true, message: "Login successful", severity: "success" });
      navigate("/dashboard");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const msg = axiosErr.response?.data?.message || "Login failed. Please try again.";
      setAlert({ open: true, message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#131419",
        px: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 400,
          p: { xs: 3, sm: 5 },
          borderRadius: "16px",
          bgcolor: "#1a1c22",
          border: "1px solid #242530",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <svg width="28" height="30" viewBox="0 0 26 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M20.929 4.88348H9.41797V0L25.8125 0V16.3945H20.929V4.88348Z" fill="#FFC01E"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M11.9375 14.6007C11.1917 14.1025 10.315 13.8365 9.41814 13.8365V8.95303C11.2809 8.95303 13.1018 9.5054 14.6506 10.5403C16.1994 11.5752 17.4065 13.0461 18.1194 14.767C18.8322 16.4879 19.0187 18.3816 18.6553 20.2086C18.2919 22.0355 17.3949 23.7137 16.0778 25.0308C14.7606 26.348 13.0825 27.2449 11.2555 27.6083C9.42857 27.9717 7.5349 27.7852 5.81396 27.0724C4.09302 26.3595 2.62211 25.1524 1.58723 23.6036C0.552357 22.0548 -3.54836e-06 20.2339 0 18.3712L4.88348 18.3712C4.88348 19.268 5.14943 20.1448 5.6477 20.8905C6.14598 21.6362 6.85419 22.2174 7.68279 22.5606C8.51139 22.9039 9.42316 22.9937 10.3028 22.8187C11.1824 22.6437 11.9904 22.2118 12.6246 21.5777C13.2588 20.9435 13.6907 20.1355 13.8657 19.2558C14.0406 18.3762 13.9508 17.4644 13.6076 16.6358C13.2644 15.8072 12.6832 15.099 11.9375 14.6007Z" fill="#1FCB4F"/>
          </svg>
          <Typography sx={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
            Penta
          </Typography>
        </Box>

        <Typography variant="h5" sx={{ color: "#fff", mt: 3, fontWeight: "bold" }}>
          Welcome back
        </Typography>
        <Typography variant="body2" sx={{ color: "#9ca3af", mb: 3 }}>
          Login to access your dashboard
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{
              "& .MuiInputLabel-root": { color: "#cbd5e1" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#1ed760" },
              "& .MuiInputBase-input": {
                color: "#ffffff",
                fontSize: "16px",
              },
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#08090b",
                "& fieldset": { borderColor: "#333" },
                "&:hover fieldset": { borderColor: "#1ed760" },
                "&.Mui-focused fieldset": { borderColor: "#1ed760" },
              },
              "& input:-webkit-autofill": {
                WebkitTextFillColor: "#ffffff",
                WebkitBoxShadow: "0 0 0px 1000px #08090b inset",
                caretColor: "#ffffff",
              },
            }}
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      sx={{ color: "#9ca3af", fontSize: "20px", backgroundColor: "#15181d", "&:hover": { backgroundColor: "#08090b" } }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiInputLabel-root": { color: "#cbd5e1" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#1ed760" },
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                backgroundColor: "#15181d",
                "& fieldset": { borderColor: "#333" },
                "&:hover fieldset": { borderColor: "#1ed760" },
                "&.Mui-focused fieldset": { borderColor: "#1ed760" },
              },
              "& input:-webkit-autofill": {
                WebkitTextFillColor: "#ffffff",
                WebkitBoxShadow: "0 0 0px 1000px #08090b inset",
                caretColor: "#ffffff",
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              mt: 3,
              py: 1.3,
              bgcolor: "#1ed760",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "10px",
              "&:hover": { bgcolor: "#17b950" },
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Paper>

      <AlertChip
        open={alert.open}
        message={alert.message}
        severity={alert.severity}
        onClose={() => setAlert({ ...alert, open: false })}
      />
    </Box>
  );
}
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";

import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowRight,
  Globe2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  Terminal,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const authResponse = await authService.login({
        email: email.trim(),
        password,
      });

      login(
        authResponse,
        rememberMe,
      );

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 font-body-md text-on-surface antialiased">
      {/* Ambient grid background */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-100"
        style={{
          backgroundSize: "40px 40px",
          backgroundImage:
            "linear-gradient(to right, rgba(66, 71, 84, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(66, 71, 84, 0.1) 1px, transparent 1px)",
        }}
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 z-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-[28rem]">
        {/* Logo Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="relative mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container shadow-sm">
            <Terminal className="h-6 w-6 text-primary" strokeWidth={1.9} />

            <Sparkles
              className="absolute right-1 top-1 h-2.5 w-2.5 fill-current text-secondary"
              strokeWidth={1.8}
            />
          </div>

          <h1 className="font-display-lg text-display-lg font-semibold tracking-tight text-on-surface">
            DevPilot
          </h1>

          <p className="mt-1 text-body-sm text-on-surface-variant">
            Engineering Intel. Authorized access only.
          </p>
        </div>

        {/* Auth Card */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-high p-6 shadow-lg">
          {/* Top accent */}
          <div className="absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block font-code-label text-code-label uppercase tracking-wider text-on-surface-variant"
              >
                Email Address
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4.5 w-4.5 text-outline-variant" />
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="developer@company.com"
                  autoComplete="email"
                  required
                  className="block w-full rounded border border-outline-variant bg-surface py-2 pl-10 pr-3 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block font-code-label text-code-label uppercase tracking-wider text-on-surface-variant"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-caption text-primary transition-colors hover:text-primary-container"
                  onClick={() => {
                    // Password recovery will be implemented later.
                    console.log("Forgot password clicked");
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4.5 w-4.5 text-outline-variant" />
                </span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded border border-outline-variant bg-surface py-2 pl-10 pr-10 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline-variant transition-colors hover:text-on-surface"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Authentication error */}
            {errorMessage && (
              <div
                role="alert"
                className="rounded border border-error/40 bg-error-container/20 px-3 py-2 text-body-sm text-error"
              >
                {errorMessage}
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface text-primary focus:ring-primary focus:ring-offset-surface-container-high"
              />

              <label
                htmlFor="remember-me"
                className="ml-2 cursor-pointer text-body-sm text-on-surface-variant"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Sign In */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center rounded border border-transparent bg-primary px-4 py-2 font-title-sm text-title-sm font-medium text-on-primary transition-colors hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
              {!isSubmitting && (
                <ArrowRight
                  className="ml-2 h-4 w-4"
                  strokeWidth={2}
                />
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant" />
              </div>

              <div className="relative flex justify-center text-sm">
                <span className="bg-surface-container-high px-2 font-caption text-caption uppercase tracking-wider text-on-surface-variant">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  // OAuth will be implemented later.
                  console.log("Google sign-in clicked");
                }}
                className="flex w-full items-center justify-center rounded border border-outline-variant bg-transparent px-4 py-2 font-title-sm text-title-sm font-medium text-on-surface transition-colors hover:bg-surface hover:text-primary focus:border-primary focus:outline-none"
              >
                <Globe2 className="mr-2 h-4 w-4" />
                Google
              </button>
            </div>
          </div>
        </div>

        {/* Registration */}
        <p className="mt-4 text-center text-body-sm text-on-surface-variant">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary transition-colors hover:text-primary-container"
          >
            Request Access
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  Terminal,
  User,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        "Password must be at least 8 characters.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const authResponse =
        await authService.register({
          name: name.trim(),
          email: email.trim(),
          password,
        });

      login(authResponse, true);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create your account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 font-body-md text-on-surface antialiased">
      {/* Ambient grid background */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
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
            <Terminal
              className="h-6 w-6 text-primary"
              strokeWidth={1.9}
            />

            <Sparkles
              className="absolute right-1 top-1 h-2.5 w-2.5 fill-current text-secondary"
              strokeWidth={1.8}
            />
          </div>

          <h1 className="font-display-lg text-display-lg font-semibold tracking-tight text-on-surface">
            DevPilot
          </h1>

          <p className="mt-1 text-body-sm text-on-surface-variant">
            Create your engineering workspace.
          </p>
        </div>

        {/* Registration Card */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-high p-6 shadow-lg">
          {/* Top accent */}
          <div className="absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

          <div className="mb-5">
            <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
              Create Account
            </h2>

            <p className="mt-1 text-body-sm text-on-surface-variant">
              Register to access DevPilot engineering intelligence.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            {/* Name */}
            <div className="space-y-1">
              <label
                htmlFor="register-name"
                className="block font-code-label text-code-label uppercase tracking-wider text-on-surface-variant"
              >
                Full Name
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4.5 w-4.5 text-outline-variant" />
                </span>

                <input
                  id="register-name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Your name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                  className="block w-full rounded border border-outline-variant bg-surface py-2 pl-10 pr-3 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label
                htmlFor="register-email"
                className="block font-code-label text-code-label uppercase tracking-wider text-on-surface-variant"
              >
                Email Address
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4.5 w-4.5 text-outline-variant" />
                </span>

                <input
                  id="register-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="developer@company.com"
                  autoComplete="email"
                  required
                  className="block w-full rounded border border-outline-variant bg-surface py-2 pl-10 pr-3 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label
                htmlFor="register-password"
                className="block font-code-label text-code-label uppercase tracking-wider text-on-surface-variant"
              >
                Password
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4.5 w-4.5 text-outline-variant" />
                </span>

                <input
                  id="register-password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  className="block w-full rounded border border-outline-variant bg-surface py-2 pl-10 pr-10 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(
                      (value) => !value,
                    )
                  }
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

            {/* Confirm Password */}
            <div className="space-y-1">
              <label
                htmlFor="confirm-password"
                className="block font-code-label text-code-label uppercase tracking-wider text-on-surface-variant"
              >
                Confirm Password
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4.5 w-4.5 text-outline-variant" />
                </span>

                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  className="block w-full rounded border border-outline-variant bg-surface py-2 pl-10 pr-10 text-body-md text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary"
                />

                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value,
                    )
                  }
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-outline-variant transition-colors hover:text-on-surface"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {errorMessage && (
              <div
                role="alert"
                className="rounded border border-error/40 bg-error-container/20 px-3 py-2 text-body-sm text-error"
              >
                {errorMessage}
              </div>
            )}

            {/* Create Account */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center rounded border border-transparent bg-primary px-4 py-2 font-title-sm text-title-sm font-medium text-on-primary transition-colors hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Creating Account..."
                : "Create Account"}

              {!isSubmitting && (
                <ArrowRight
                  className="ml-2 h-4 w-4"
                  strokeWidth={2}
                />
              )}
            </button>
          </form>

          {/* Existing account */}
          <div className="mt-6 border-t border-outline-variant pt-4 text-center">
            <p className="text-body-sm text-on-surface-variant">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-primary transition-colors hover:text-primary-container"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Register;

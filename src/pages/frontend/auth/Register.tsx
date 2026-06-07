import * as React from "react";
import { ArrowRight, Eye } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage, getAuthFieldErrors } from "@/features/auth/errorMessage";
import { resolveAuthRole, saveAuthRole } from "@/features/auth/roleSelection";
import { registerAndLoginUser } from "@/features/auth/service";
import { type AuthRole, type VerificationChannel } from "@/features/auth/types";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [verificationChannel, setVerificationChannel] = React.useState<VerificationChannel>("email");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirmation, setPasswordConfirmation] = React.useState("");
  const [role, setRole] = React.useState<AuthRole>("user");
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    const selectedRole = resolveAuthRole(searchParams.get("role"));
    setRole(selectedRole);
    saveAuthRole(selectedRole);
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(null);

    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Password and confirmation do not match.");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (verificationChannel === "email" && !trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (verificationChannel === "phone" && !trimmedPhone) {
      setError("Please enter your phone number.");
      return;
    }

    setLoading(true);
    saveAuthRole(role);

    try {
      await registerAndLoginUser({
        first_name: firstName,
        last_name: lastName,
        verification_channel: verificationChannel,
        ...(verificationChannel === "email" ? { email: trimmedEmail } : { phone: trimmedPhone }),
        password,
        password_confirmation: passwordConfirmation,
        role,
      });

      setSuccess("Registration successful. Redirecting to OTP verification...");
      const params = new URLSearchParams({
        purpose: "register",
        role,
        channel: verificationChannel,
      });
      if (verificationChannel === "email") {
        params.set("email", trimmedEmail);
      } else {
        params.set("phone", trimmedPhone);
      }

      navigate(`/otp-verification?${params.toString()}`, { replace: true });
    } catch (err) {
      const errors = getAuthFieldErrors(err);
      setFieldErrors(errors);
      setError(getAuthErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-bg p-4">
      <div className="max-w-2xl w-full bg-card p-8 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div className="text-left mb-8">
            <h2 className="text-2xl font-inter font-semibold text-foreground mb-2">
              Welcome to Gidira Marketplace
            </h2>
            <p className="text-sm font-inter text-muted-foreground">
              Already have an account?{" "}
              <Link to={`/login/email?role=${role}`} className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-normal text-muted-foreground mb-2">
                  First Name <span className="text-brand-red">*</span>
                </label>
                <Input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-normal text-muted-foreground mb-2">
                  Last Name <span className="text-brand-red">*</span>
                </label>
                <Input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-normal text-muted-foreground mb-2">
                Sign up with <span className="text-brand-red">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setVerificationChannel("email")}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${verificationChannel === "email"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationChannel("phone")}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${verificationChannel === "phone"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Phone number
                </button>
              </div>
            </div>

            {verificationChannel === "email" ? (
              <div>
                <label className="block text-sm font-normal text-muted-foreground mb-2">
                  Email <span className="text-brand-red">*</span>
                </label>
                <Input
                  type="email"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {fieldErrors.email ? (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
                ) : null}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-normal text-muted-foreground mb-2">
                  Phone Number <span className="text-brand-red">*</span>
                </label>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g. 08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                {fieldErrors.phone ? (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.phone}</p>
                ) : null}
              </div>
            )}

            <div>
              <label className="block text-sm font-normal text-muted-foreground mb-2">
                Password <span className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="8+ characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.password}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-normal text-muted-foreground mb-2">
                Confirm Password <span className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Confirm your password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-muted-foreground">
                I agree to the{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </Link>
              </span>
            </div>

            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <div className="my-7">
              <Button
                type="submit"
                variant="default"
                disabled={loading}
                className="flex justify-center max-w-xs w-full h-11 rounded-lg bg-brand px-6 text-base font-medium text-ice shadow-none hover:bg-brand/90"
              >
                <span className="inline-flex items-center gap-2">
                  {loading ? "Creating account..." : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

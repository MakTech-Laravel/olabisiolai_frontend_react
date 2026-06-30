import * as React from "react";
import { useLocation, useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowRight, Eye } from "lucide-react";

import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage, getAuthFieldErrors } from "@/features/auth/errorMessage";
import { resolveAuthRole, saveAuthRole } from "@/features/auth/roleSelection";
import { signUpPathForRole } from "@/features/vendor/vendorPlanStorage";
import {
  buildNewDeviceOtpVerificationPath,
  buildRegisterOtpVerificationPath,
  loginUserWithRole,
  resendRegistrationOtp,
  resolvePostLoginPath,
} from "@/features/auth/service";
import { type AuthRole } from "@/features/auth/types";
import { type LoginReturnTarget } from "@/features/auth/loginReturn";
import { navigateAfterLogin } from "@/features/auth/navigateAfterLogin";
export default function LoginPhone() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setToken, setUser, refreshSession, resetAuthState, authStrategy } = useAuth();

  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<AuthRole>("user");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const selectedRole = resolveAuthRole(searchParams.get("role"));
    setRole(selectedRole);
    saveAuthRole(selectedRole);
  }, [searchParams]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    saveAuthRole(role);

    try {
      const returnTo = (location.state as { from?: LoginReturnTarget } | null)?.from;

      const loginResult = await loginUserWithRole(
        {
          phone: phone.trim(),
          password,
          role,
        },
        { authStrategy, setToken, setUser, refreshSession, resetAuthState },
      );

      if (loginResult.kind === "verification_required") {
        try {
          await resendRegistrationOtp({
            ...(loginResult.verificationChannel === "phone"
              ? { phone: loginResult.phone ?? phone.trim() }
              : { email: loginResult.email }),
          });
        } catch {
          // User can resend manually on the OTP page.
        }

        navigate(
          buildRegisterOtpVerificationPath({
            role,
            channel: loginResult.verificationChannel,
            email: loginResult.email,
            phone: loginResult.phone ?? phone.trim(),
          }),
          { replace: true },
        );
        return;
      }

      if (loginResult.kind === "device_verification") {
        navigate(
          buildNewDeviceOtpVerificationPath({
            role,
            channel: loginResult.verificationChannel,
            email: loginResult.email,
            phone: loginResult.phone ?? phone.trim(),
          }),
          {
            replace: true,
            state: { from: returnTo },
          },
        );
        return;
      }

      if (loginResult.kind === "two_factor") {
        navigate("/login/two-factor", {
          replace: true,
          state: {
            twoFactorToken: loginResult.twoFactorToken,
            role,
            verificationChannel: loginResult.verificationChannel,
            maskedEmail: loginResult.maskedEmail,
            maskedPhone: loginResult.maskedPhone,
            from: returnTo,
          },
        });
        return;
      }

      if (navigateAfterLogin(navigate, returnTo)) {
        return;
      }

      navigate(await resolvePostLoginPath(loginResult.user, role), { replace: true });
    } catch (err) {
      const errors = getAuthFieldErrors(err);
      setFieldErrors(errors);
      setError(getAuthErrorMessage(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-auth-bg p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-inter font-semibold text-foreground mb-2">
              Login with phone
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your phone number and password to sign in.
            </p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone number
              </label>
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. 08012345678 or +234 812 345 6789"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
              {fieldErrors.phone ? (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.phone}</p>
              ) : null}
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <Link to="/forget-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="my-7">
              <Button
                type="submit"
                variant="default"
                disabled={loading}
                className="flex justify-center w-full h-11 rounded-lg bg-brand px-6 text-base font-medium text-ice shadow-none hover:bg-brand/90"
              >
                <span className="inline-flex items-center gap-2 bg-brand">
                  {loading ? "Logging in..." : "Login"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </div>
          </form>

          <div className="flex flex-col items-center gap-3 mb-5">
            <Link
              to={`/login/email?role=${role}`}
              className="text-sm text-primary hover:underline"
            >
              Login with email instead
            </Link>
            <div className="flex items-center gap-2">
              <p className="text-base font-inter font-normal text-muted-foreground">
                Don&apos;t have an account?
              </p>
              <Link to={signUpPathForRole(role)} className="text-primary hover:underline">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

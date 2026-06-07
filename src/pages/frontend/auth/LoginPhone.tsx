import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage, getAuthFieldErrors } from "@/features/auth/errorMessage";
import { resolveAuthRole, saveAuthRole } from "@/features/auth/roleSelection";
import { requestPhoneLoginOtp } from "@/features/auth/service";
import { type AuthRole } from "@/features/auth/types";

export default function LoginPhone() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<AuthRole>("user");
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
      await requestPhoneLoginOtp({ phone: phone.trim(), role });
      const encodedPhone = encodeURIComponent(phone.trim());
      navigate(
        `/otp-verification?purpose=login&phone=${encodedPhone}&role=${role}`,
        { replace: true },
      );
    } catch (err) {
      const errors = getAuthFieldErrors(err);
      setFieldErrors(errors);
      setError(getAuthErrorMessage(err, "Unable to send OTP. Please try again."));
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
              We&apos;ll send a 6-digit verification code to your phone number.
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
                placeholder="e.g. 08012345678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
              {fieldErrors.phone ? (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.phone}</p>
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
                  {loading ? "Sending OTP..." : "Send OTP"}
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
              <Link to={`/register?role=${role}`} className="text-primary hover:underline">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

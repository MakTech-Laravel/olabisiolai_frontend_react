import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { getAuthErrorMessage } from "@/features/auth/errorMessage";
import { resolveAuthRole, saveAuthRole } from "@/features/auth/roleSelection";
import { getAccessToken, getStoredAuthUser } from "@/auth/token";
import {
  requestPasswordResetOtp,
  resendForgotPasswordOtp,
  resendPhoneLoginOtp,
  resendRegistrationOtp,
  resolvePostLoginPath,
  verifyForgotPasswordOtp,
  verifyPhoneLoginOtp,
  verifyRegistrationOtp,
} from "@/features/auth/service";
import { getPasswordResetSession } from "@/features/auth/passwordResetStorage";
import { type AuthRole, type VerificationChannel } from "@/features/auth/types";
import {
  getSavedVendorPlan,
  parseVendorPlan,
  saveVendorPlan,
  type VendorPlanChoice,
} from "@/features/vendor/vendorPlanStorage";

const OTP_LENGTH = 6;
const RESEND_WINDOW_MS = 5 * 60 * 1000;
const RESEND_MAX_ATTEMPTS = 3;
const RESEND_BAN_MS = 30 * 60 * 1000;
const RESEND_STORAGE_PREFIX = "otp_resend_limiter";

type ResendLimiterState = {
  attempts: number;
  windowStartedAt: number;
  bannedUntil: number | null;
};

function getLimiterStorageKey(purpose: string | null, identifier: string) {
  return `${RESEND_STORAGE_PREFIX}:${purpose ?? "unknown"}:${identifier.toLowerCase()}`;
}

function readLimiterState(storageKey: string): ResendLimiterState {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return { attempts: 0, windowStartedAt: Date.now(), bannedUntil: null };
    }
    const parsed = JSON.parse(raw) as Partial<ResendLimiterState>;
    return {
      attempts: Number.isFinite(parsed.attempts) ? Number(parsed.attempts) : 0,
      windowStartedAt: Number.isFinite(parsed.windowStartedAt)
        ? Number(parsed.windowStartedAt)
        : Date.now(),
      bannedUntil:
        parsed.bannedUntil == null
          ? null
          : Number.isFinite(parsed.bannedUntil)
            ? Number(parsed.bannedUntil)
            : null,
    };
  } catch {
    return { attempts: 0, windowStartedAt: Date.now(), bannedUntil: null };
  }
}

function writeLimiterState(storageKey: string, value: ResendLimiterState) {
  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setToken, setUser, refreshSession, resetAuthState, authStrategy } = useAuth();

  const [otp, setOtp] = React.useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);
  const [banRemainingMs, setBanRemainingMs] = React.useState(0);

  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  const purpose = searchParams.get("purpose");
  const email = searchParams.get("email")?.trim() ?? "";
  const phone = searchParams.get("phone")?.trim() ?? "";
  const channel = (searchParams.get("channel") as VerificationChannel | null) ?? (phone ? "phone" : "email");
  const role: AuthRole = resolveAuthRole(searchParams.get("role"));
  const vendorPlan = React.useMemo((): VendorPlanChoice | null => {
    const fromQuery = parseVendorPlan(searchParams.get("plan"));
    if (fromQuery) {
      return fromQuery;
    }
    return role === "vendor" ? getSavedVendorPlan() : null;
  }, [searchParams, role]);

  React.useEffect(() => {
    if (vendorPlan) {
      saveVendorPlan(vendorPlan);
    }
  }, [vendorPlan]);

  const identifier =
    purpose === "login" || (purpose === "register" && channel === "phone") ? phone : email;
  const limiterKey = React.useMemo(() => {
    if (!identifier) return null;
    return getLimiterStorageKey(purpose, identifier);
  }, [purpose, identifier]);

  // Sync the registration token from storage into React auth state so the
  // user appears logged in immediately after registration (without reload).
  // GuestGate's register-OTP bypass ensures this page still renders.
  React.useEffect(() => {
    if (purpose === "register") {
      const storedToken = getAccessToken();
      const storedUser = getStoredAuthUser();
      if (storedToken) {
        setToken(storedToken);
      }
      if (storedUser) {
        setUser(storedUser);
      }
    }
  }, [purpose, setToken, setUser]);

  React.useEffect(() => {
    saveAuthRole(role);
  }, [role]);

  React.useEffect(() => {
    if (!limiterKey) {
      setBanRemainingMs(0);
      return;
    }

    const syncBanRemaining = () => {
      const limiter = readLimiterState(limiterKey);
      if (!limiter.bannedUntil) {
        setBanRemainingMs(0);
        return;
      }

      const remaining = limiter.bannedUntil - Date.now();
      if (remaining <= 0) {
        writeLimiterState(limiterKey, {
          attempts: 0,
          windowStartedAt: Date.now(),
          bannedUntil: null,
        });
        setBanRemainingMs(0);
        return;
      }

      setBanRemainingMs(remaining);
    };

    syncBanRemaining();
    const timer = window.setInterval(syncBanRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [limiterKey]);

  function updateOtpAtIndex(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const otpCode = otp.join("");
    if (otpCode.length !== OTP_LENGTH) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    // Password reset: verify OTP before allowing new password entry.
    if (purpose === "reset") {
      const resetSession = getPasswordResetSession();
      const resetEmail = (email || resetSession?.email || "").trim().toLowerCase();
      const resetToken = resetSession?.token;

      if (!resetEmail) {
        setError("Missing email for password reset. Please start again.");
        return;
      }

      if (!resetToken) {
        setError("Your reset session expired. Please request a new code.");
        return;
      }

      setLoading(true);
      try {
        await verifyForgotPasswordOtp({
          email: resetEmail,
          code: otpCode,
          token: resetToken,
        });
        navigate("/reset-password", { replace: true });
      } catch (err) {
        setError(getAuthErrorMessage(err, "OTP verification failed. Please try again."));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (purpose === "login") {
      if (!phone) {
        setError("Missing phone number for OTP verification. Please try again.");
        return;
      }

      setLoading(true);
      saveAuthRole(role);

      try {
        const returnTo = (location.state as { from?: unknown } | null)?.from;
        const loginResult = await verifyPhoneLoginOtp(
          { phone, code: otpCode, role },
          { authStrategy, setToken, setUser, refreshSession, resetAuthState },
        );

        if (loginResult.kind === "two_factor") {
          navigate("/login/two-factor", {
            replace: true,
            state: {
              twoFactorToken: loginResult.twoFactorToken,
              role,
              from: returnTo,
            },
          });
          return;
        }

        navigate(await resolvePostLoginPath(loginResult.user, role), { replace: true });
      } catch (err) {
        setError(getAuthErrorMessage(err, "OTP verification failed. Please try again."));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (purpose !== "register") {
      setError("Unsupported verification flow. Please start password reset again.");
      return;
    }

    if (!email && !phone) {
      setError("Missing contact details for OTP verification. Please register again.");
      return;
    }

    if (channel === "email" && !email) {
      setError("Missing email for OTP verification. Please register again.");
      return;
    }

    if (channel === "phone" && !phone) {
      setError("Missing phone number for OTP verification. Please register again.");
      return;
    }

    setLoading(true);
    saveAuthRole(role);

    try {
      const loggedInUser = await verifyRegistrationOtp(
        {
          ...(email ? { email: email.toLowerCase() } : {}),
          ...(phone ? { phone } : {}),
          otp: otpCode,
          verification_channel: channel,
        },
        { authStrategy, setToken, setUser, refreshSession, resetAuthState },
        role,
      );
      navigate(await resolvePostLoginPath(loggedInUser, role, { vendorPlan }), {
        replace: true,
      });
    } catch (err) {
      setError(getAuthErrorMessage(err, "OTP verification failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError(null);
    setResendMessage(null);

    if (!identifier) {
      setError(
        purpose === "login" || channel === "phone"
          ? "Missing phone number. Please go back and try again."
          : "Missing email. Please go back and try again.",
      );
      return;
    }

    if (!limiterKey) {
      setError("Unable to process resend right now. Please refresh and try again.");
      return;
    }

    const limiter = readLimiterState(limiterKey);
    const now = Date.now();
    if (limiter.bannedUntil && limiter.bannedUntil > now) {
      setBanRemainingMs(limiter.bannedUntil - now);
      setError(
        `Resend is temporarily blocked. Try again in ${formatRemaining(
          limiter.bannedUntil - now,
        )}.`,
      );
      return;
    }

    const isWindowExpired = now - limiter.windowStartedAt > RESEND_WINDOW_MS;
    if (isWindowExpired) {
      limiter.attempts = 0;
      limiter.windowStartedAt = now;
      limiter.bannedUntil = null;
    }

    if (limiter.attempts >= RESEND_MAX_ATTEMPTS) {
      limiter.bannedUntil = now + RESEND_BAN_MS;
      writeLimiterState(limiterKey, limiter);
      setBanRemainingMs(RESEND_BAN_MS);
      setError("You have reached resend limit. Resend is disabled for 30 minutes.");
      return;
    }

    const normalizedEmail = email.toLowerCase();

    setResending(true);
    try {
      if (purpose === "register") {
        if (channel === "phone" && phone) {
          await resendRegistrationOtp({ phone });
        } else if (normalizedEmail) {
          await resendRegistrationOtp({ email: normalizedEmail });
        } else {
          throw new Error("Missing contact details for OTP resend.");
        }
      } else if (purpose === "login") {
        await resendPhoneLoginOtp({ phone, role });
      } else if (purpose === "reset") {
        const resetSession = getPasswordResetSession();
        const resetEmail = (normalizedEmail || resetSession?.email || "").trim().toLowerCase();
        if (!resetEmail || !resetSession?.token) {
          throw new Error("Reset session expired. Please request a new code.");
        }
        await resendForgotPasswordOtp({ email: resetEmail, token: resetSession.token });
      } else {
        await requestPasswordResetOtp({ email: normalizedEmail });
      }
      limiter.attempts += 1;
      writeLimiterState(limiterKey, limiter);
      setResendMessage(
        channel === "phone" || purpose === "login"
          ? "A new OTP has been sent to your phone."
          : "A new OTP has been sent to your email.",
      );
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(getAuthErrorMessage(err, "Unable to resend OTP. Please try again."));
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <div className="min-h-screen flex items-center justify-center bg-auth-bg p-4">
        <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg">
          <div className="space-y-6">
            <div className="text-start mb-8">
              <h2 className="text-2xl font-inter font-semibold text-foreground mb-2">
                OTP Verification
              </h2>
              <p className="text-base font-inter font-normal text-muted-foreground text-start">
                {purpose === "reset"
                  ? `Enter the reset code we sent to ${email || "your email"}.`
                  : purpose === "register" && channel === "email"
                    ? `Enter the verification code we just sent to ${email || "your email"}.`
                    : `Enter the verification code we just sent to your phone number${phone ? ` ending in ${phone.slice(-4)}` : ""}.`}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Codes are valid for 10 minutes. If you request a new code, use the latest one only.
              </p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Verification Code
                </label>
                <div className="flex justify-between gap-2 mb-6">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => updateOtpAtIndex(index, event.target.value)}
                      onKeyDown={(event) => onKeyDown(index, event)}
                      className="w-12 h-12 text-center text-lg font-semibold border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0"
                    />
                  ))}
                </div>
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
              {resendMessage ? (
                <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {resendMessage}
                </div>
              ) : null}

              <div className="my-7">
                <Button
                  type="submit"
                  variant="default"
                  disabled={loading}
                  className="flex justify-center w-full h-11 rounded-lg bg-brand px-6 text-base font-medium text-ice shadow-none hover:bg-brand/90"
                >
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>

            <div className="text-center flex items-center justify-center gap-2 mb-5">
              <p className="text-base font-inter font-normal text-muted-foreground">
                Didn’t receive a code?
              </p>
              <button
                type="button"
                onClick={onResend}
                disabled={resending || banRemainingMs > 0}
                className="text-primary hover:underline font-medium disabled:opacity-60"
              >
                {resending
                  ? "Resending..."
                  : banRemainingMs > 0
                    ? `Resend disabled (${formatRemaining(banRemainingMs)})`
                    : "Resend"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
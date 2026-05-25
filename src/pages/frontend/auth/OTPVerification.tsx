import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { getAuthErrorMessage } from "@/features/auth/errorMessage";
import { resolveAuthRole, saveAuthRole } from "@/features/auth/roleSelection";
import { getAccessToken, getStoredAuthUser } from "@/auth/token";
import {
  requestPasswordResetOtp,
  resendRegistrationOtp,
  resolvePostLoginPath,
  verifyRegistrationOtp,
} from "@/features/auth/service";
import { type AuthRole } from "@/features/auth/types";

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

function getLimiterStorageKey(purpose: string | null, email: string) {
  return `${RESEND_STORAGE_PREFIX}:${purpose ?? "unknown"}:${email.toLowerCase()}`;
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
  const role: AuthRole = resolveAuthRole(searchParams.get("role"));
  const limiterKey = React.useMemo(() => {
    if (!email) return null;
    return getLimiterStorageKey(purpose, email);
  }, [purpose, email]);

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

    // Existing forgot-password flow still uses this screen without register context.
    if (purpose !== "register") {
      navigate("/reset-password", { replace: true });
      return;
    }

    if (!email) {
      setError("Missing email for OTP verification. Please register again.");
      return;
    }

    const normalizedEmail = email.toLowerCase();

    setLoading(true);
    saveAuthRole(role);

    try {
      const loggedInUser = await verifyRegistrationOtp(
        { email: normalizedEmail, otp: otpCode },
        { authStrategy, setToken, setUser, refreshSession, resetAuthState },
        role,
      );
      navigate(await resolvePostLoginPath(loggedInUser, role), { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err, "OTP verification failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError(null);
    setResendMessage(null);

    if (!email) {
      setError("Missing email. Please go back and try again.");
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
        await resendRegistrationOtp({ email: normalizedEmail });
      } else {
        await requestPasswordResetOtp({ email: normalizedEmail });
      }
      limiter.attempts += 1;
      writeLimiterState(limiterKey, limiter);
      setResendMessage("A new OTP has been sent.");
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
                Enter the verification code we just sent to your Phone number.
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
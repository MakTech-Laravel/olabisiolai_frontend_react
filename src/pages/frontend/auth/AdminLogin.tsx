import * as React from "react";
import { Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthErrorMessage, getAuthFieldErrors } from "@/features/auth/errorMessage";
import { Input } from "@/components/ui/input";
import { loginAdmin } from "@/features/auth/service";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setToken, setUser, refreshSession, resetAuthState, authStrategy } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const loginResult = await loginAdmin(
        { email, password },
        { authStrategy, setToken, setUser, refreshSession, resetAuthState },
      );

      if (loginResult.kind === "two_factor") {
        navigate("/login/two-factor", {
          replace: true,
          state: {
            twoFactorToken: loginResult.twoFactorToken,
            role: "admin",
            verificationChannel: loginResult.verificationChannel,
            maskedEmail: loginResult.maskedEmail,
            maskedPhone: loginResult.maskedPhone,
          },
        });
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const errors = getAuthFieldErrors(err);
      setFieldErrors(errors);
      setError(getAuthErrorMessage(err, "Admin login failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin sign in</CardTitle>
          <CardDescription>Login with your admin account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-email">
                Email
              </label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {fieldErrors.email ? (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="admin-password">
                Password
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
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

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="text-center text-sm">
            Not an admin?{" "}
            <Link to="/login/phone" className="text-primary hover:underline">
              Go to user login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

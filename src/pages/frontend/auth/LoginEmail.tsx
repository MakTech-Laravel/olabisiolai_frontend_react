import { Navigate, useSearchParams } from "react-router-dom";

/** Email login is merged into the unified login page at /login/phone. */
export default function LoginEmail() {
  const [searchParams] = useSearchParams();
  const next = searchParams.toString();
  return <Navigate to={next ? `/login/phone?${next}` : "/login/phone"} replace />;
}

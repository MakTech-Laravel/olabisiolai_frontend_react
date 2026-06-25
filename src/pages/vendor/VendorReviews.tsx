import { Navigate, useLocation } from "react-router-dom";

/** Legacy `/vendor/reviews` — forwards to profile-style business reviews page. */
export default function VendorReviews() {
  const location = useLocation();
  return <Navigate to={`/user/business-reviews${location.search}`} replace />;
}

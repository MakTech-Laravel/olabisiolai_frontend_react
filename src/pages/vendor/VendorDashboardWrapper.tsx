import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Loader2 } from "lucide-react";

import { getAccessToken } from "@/auth/token";
import {
  defaultOnboardingStatus,
  fetchVendorOnboardingStatus,
  onboardingRedirectPath,
} from "@/features/subscription/vendorOnboardingApi";

export default function VendorDashboardWrapper() {
  const navigate = useNavigate();
  const hasToken = Boolean(getAccessToken());

  const { data, isLoading, isError, error, isFetched } = useQuery({
    queryKey: ["vendor", "onboarding", "status"],
    queryFn: fetchVendorOnboardingStatus,
    enabled: hasToken,
    retry: 1,
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!hasToken) {
      navigate("/login", { replace: true });
      return;
    }

    if (isLoading || !isFetched) {
      return;
    }

    if (isError && isAxiosError(error) && error.response?.status === 401) {
      return;
    }

    if (isError || !data) {
      navigate(onboardingRedirectPath(defaultOnboardingStatus()), { replace: true });
      return;
    }

    navigate(onboardingRedirectPath(data), { replace: true });
  }, [data, error, hasToken, isError, isFetched, isLoading, navigate]);

  if (!hasToken || isLoading || !isFetched) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading" />
      </div>
    );
  }

  return null;
}

type ChoosePlanHeaderProps = {
  signupMode?: boolean;
};

export function ChoosePlanHeader({ signupMode = false }: ChoosePlanHeaderProps) {
  return (
    <header className="space-y-3 text-center">
      {signupMode ? (
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-red font-inter">
          Step 1 of 2 · Vendor signup
        </p>
      ) : null}
      <h1 className="text-3xl font-extrabold tracking-tight font-manrope md:text-4xl">
        Choose your plan
      </h1>
      <p className="mx-auto max-w-xl text-base text-muted-foreground font-inter md:text-lg">
        {signupMode
          ? "Pick Free or Premium first, then create your vendor account."
          : "Select the plan that fits your business. Upgrade anytime to reach more customers."}
      </p>
    </header>
  );
}

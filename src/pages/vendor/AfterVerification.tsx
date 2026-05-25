
import { FooterContact } from "@/components/sections/vendor/afterYerification/FooterContact";
import { RequiredDocuments } from "@/components/sections/vendor/afterYerification/RequiredDocuments";
import { WhyVerifySection } from "@/components/sections/vendor/afterYerification/WhyVerifySection";
import { cn } from "@/lib/utils";

export default function AfterVerification() {
  return (
    <div className={cn('p-4', 'md:p-6')}>
      <div className={cn('mx-auto', 'space-y-12', 'text-foreground', 'md:space-y-16')}>

        <div>
          <RequiredDocuments />
          
        </div>
        <div>
          <WhyVerifySection />
          
        </div>
        <FooterContact />
      </div>
    </div>
  );
}

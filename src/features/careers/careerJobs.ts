import { alert } from '@/lib/sweetAlert'

export const HR_EMAIL = 'hr@gidira.com'

export type CareerJob = {
  slug: string
  title: string
  dept: string
  location: string
  employmentType: string
  salary?: string
  about: string[]
  requirements: string[]
}

export const CAREER_JOBS: CareerJob[] = [
  {
    slug: 'full-stack-developer',
    title: 'Full-stack Developer',
    dept: 'Engineering',
    location: 'Lagos / Remote',
    employmentType: 'Full-time',
    salary: 'Competitive — based on experience',
    about: [
      'Build and maintain features across our Laravel API and React marketplace, helping Nigerian businesses connect with customers at scale.',
      'You will collaborate with product and design to ship reliable, secure releases and improve performance across web and mobile-friendly experiences.',
    ],
    requirements: [
      '3+ years building production web applications with PHP/Laravel or similar backend stacks.',
      'Strong experience with React, TypeScript, and REST APIs.',
      'Comfortable with MySQL, queues, and real-time features (WebSockets).',
      'Clear communication and ownership in a remote-friendly team.',
    ],
  },
  {
    slug: 'product-designer',
    title: 'Product Designer',
    dept: 'Design',
    location: 'Lagos',
    employmentType: 'Full-time',
    salary: '₦800K – ₦1.2M / month',
    about: [
      'Shape intuitive experiences for vendors and customers on Gidira’s marketplace.',
      'You will own flows from discovery to high-fidelity UI, partnering with engineering on a consistent design system.',
    ],
    requirements: [
      'Portfolio demonstrating end-to-end product design for web or mobile.',
      'Proficiency in Figma and design systems.',
      'Ability to run lightweight user research and iterate from feedback.',
      'Experience in marketplaces or B2B SaaS is a plus.',
    ],
  },
  {
    slug: 'business-development-manager',
    title: 'Business Development Manager',
    dept: 'Sales',
    location: 'Lagos / Abuja',
    employmentType: 'Full-time',
    salary: '₦900K – ₦1.5M / month + incentives',
    about: [
      'Grow Gidira’s vendor base by identifying partners, pitching the platform, and closing onboarding deals.',
      'You will work with marketing and customer success to hit regional growth targets.',
    ],
    requirements: [
      '4+ years in B2B sales or business development.',
      'Strong network or experience selling to SMEs in Nigeria.',
      'Excellent presentation and negotiation skills.',
      'Comfortable with CRM tools and pipeline reporting.',
    ],
  },
  {
    slug: 'customer-success-lead',
    title: 'Customer Success Lead',
    dept: 'Support',
    location: 'Remote',
    employmentType: 'Full-time',
    salary: '₦700K – ₦1.1M / month',
    about: [
      'Ensure vendors succeed on Gidira through onboarding, training, and proactive support.',
      'You will define playbooks, measure health scores, and escalate product feedback to internal teams.',
    ],
    requirements: [
      '3+ years in customer success, account management, or support leadership.',
      'Experience with marketplace or subscription products.',
      'Strong written and verbal communication in English.',
      'Data-informed mindset for retention and satisfaction metrics.',
    ],
  },
  {
    slug: 'marketing-coordinator',
    title: 'Marketing Coordinator',
    dept: 'Marketing',
    location: 'Lagos',
    employmentType: 'Full-time',
    salary: '₦500K – ₦800K / month',
    about: [
      'Support campaigns that drive vendor sign-ups and customer engagement across digital channels.',
      'You will coordinate content, social, email, and event activations with the growth team.',
    ],
    requirements: [
      '2+ years in marketing coordination or digital marketing.',
      'Experience with social media, email tools, and basic analytics.',
      'Strong copywriting and organizational skills.',
      'Interest in Nigeria’s SME and e-commerce ecosystem.',
    ],
  },
  {
    slug: 'product-manager',
    title: 'Product Manager',
    dept: 'Product',
    location: 'Lagos, Nigeria [Hybrid]',
    employmentType: 'Full-time',
    salary: '₦1.2M – ₦1.8M / month',
    about: [
      'At Gidira, we are building Nigeria’s digital commerce infrastructure. As Product Manager, you will define vision and drive execution for features that connect businesses with customers.',
      'You will work closely with engineering, design, and go-to-market teams across the full product lifecycle—from discovery through launch and iteration.',
    ],
    requirements: [
      '5+ years of experience in product management, preferably in fintech or high-growth SaaS environments.',
      'Proven track record of delivering successful products from concept to scale.',
      'Strong analytical skills with the ability to use data to inform decisions and measure success.',
      'Excellent communication and leadership skills, with experience managing cross-functional stakeholders.',
      'Deep understanding of Agile methodologies and product development frameworks.',
    ],
  },
]

export function getCareerJobBySlug(slug: string | undefined): CareerJob | undefined {
  if (!slug) return undefined
  return CAREER_JOBS.find((j) => j.slug === slug)
}

export function careerJobPath(slug: string): string {
  return `/careers/${slug}`
}

export function applicationMailto(jobTitle: string): string {
  const subject = `Application: ${jobTitle}`
  return `mailto:${HR_EMAIL}?subject=${encodeURIComponent(subject)}`
}

export async function handleCareerApply(jobTitle: string): Promise<boolean> {
  const subject = `Application: ${jobTitle}`
  const confirmed = await alert.confirm({
    title: 'Apply for this role',
    html: `<p class="text-sm">Your email app will open to <strong>${HR_EMAIL}</strong> with the subject line:</p><p class="mt-2 text-sm font-semibold">${subject}</p><p class="mt-3 text-sm text-body-secondary">Attach your CV and a short cover letter, then send the email.</p>`,
    icon: 'info',
    confirmText: 'Open email',
    cancelText: 'Cancel',
  })
  if (confirmed) {
    window.location.href = applicationMailto(jobTitle)
    return true
  }
  return false
}

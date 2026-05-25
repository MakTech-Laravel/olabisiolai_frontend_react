import type { Attachment } from "@/types/attachment";
import type { MessageStatus } from "@/types/message";

export type LeadChannel = "direct" | "whatsapp" | "admin";
export type LeadStatus = "new" | "contacted";

export type Lead = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  channel: LeadChannel;
  dateTime: string;
  status: LeadStatus;
  message: string;
  lastSeen: string;
  /** When true, list row shows green "Online" dot (direct inbox). */
  online?: boolean;
  /** Optional second line in chat header, e.g. business name */
  chatSubtitle?: string;
};

export type ChatMessage = {
  id: string;
  from: "lead" | "vendor";
  text: string;
  time: string;
  status?: MessageStatus;
  read_by?: number[];
  attachments?: Attachment[];
};

export const leads: Lead[] = [
  {
    id: "ld-001",
    name: "Chinedu Okafor",
    initials: "CO",
    phone: "+234 812 123 4567",
    channel: "whatsapp",
    dateTime: "2026-04-02 10:30 AM",
    status: "new",
    message: "Hello, I'd like to book a reservation for 6 people this Friday evening.",
    lastSeen: "2h ago",
  },
  {
    id: "ld-002",
    name: "Tunde Balogun",
    initials: "TB",
    phone: "+234 807 888 7820",
    channel: "whatsapp",
    dateTime: "2026-04-01 11:45 AM",
    status: "contacted",
    message: "Can I get your premium package details and delivery timeline?",
    lastSeen: "23m ago",
  },
  {
    id: "ld-003",
    name: "Linda Smith",
    initials: "LS",
    phone: "+234 813 222 9191",
    channel: "whatsapp",
    dateTime: "2026-04-01 09:10 AM",
    status: "contacted",
    message: "Please share current pricing for your business listing plans.",
    lastSeen: "Yesterday",
  },
  {
    id: "ld-004",
    name: "Sam Wilson",
    initials: "SW",
    phone: "+234 705 555 7843",
    channel: "whatsapp",
    dateTime: "2026-03-31 08:00 AM",
    status: "contacted",
    message: "I'm looking for weekend availability and full package details.",
    lastSeen: "Fri",
  },
  {
    id: "ld-007",
    name: "Sarah Johnson",
    initials: "SJ",
    phone: "+234 803 111 2222",
    channel: "whatsapp",
    dateTime: "2026-03-28 04:15 PM",
    status: "new",
    message: "Is your team available for a site visit next week?",
    lastSeen: "Mon",
  },
  {
    id: "ld-008",
    name: "Emeka Nwosu",
    initials: "EN",
    phone: "+234 901 444 8899",
    channel: "whatsapp",
    dateTime: "2026-03-27 01:20 PM",
    status: "contacted",
    message: "Following up on the quote you sent last Tuesday.",
    lastSeen: "Tue",
  },
  {
    id: "ld-005",
    name: "Diana Smith",
    initials: "DS",
    phone: "+234 701 765 1632",
    channel: "direct",
    dateTime: "2026-03-30 10:00 AM",
    status: "contacted",
    message: "Do you offer custom plans for medium-sized agencies?",
    lastSeen: "18m ago",
    online: true,
  },
  {
    id: "ld-006",
    name: "Michael Adeyemi",
    initials: "MA",
    phone: "+234 802 245 6789",
    channel: "direct",
    dateTime: "2026-03-29 09:00 AM",
    status: "contacted",
    message: "Interested in monthly contract, can we discuss options?",
    lastSeen: "1h ago",
    online: false,
  },
  {
    id: "ld-009",
    name: "Sarah J.",
    initials: "SJ",
    phone: "+234 810 000 1122",
    channel: "direct",
    dateTime: "2026-04-02 08:15 AM",
    status: "new",
    message: "Quick question about availability for a walkthrough.",
    lastSeen: "now",
    online: true,
    chatSubtitle: "Expert Home Sanctuary",
  },
];

export const chatByLead: Record<string, ChatMessage[]> = {
  "ld-001": [
    { id: "m1", from: "lead", text: "Hello! Is this service available on Friday evening?", time: "09:42 AM" },
    {
      id: "m2",
      from: "vendor",
      text: "Yes, it is available. We can reserve a slot for your event and share the package options.",
      time: "09:44 AM",
    },
    {
      id: "m3",
      from: "lead",
      text: "Great! I need a reservation for six people and full price details.",
      time: "09:46 AM",
    },
    {
      id: "m4",
      from: "vendor",
      text: "Perfect, I'll send the full details in a minute and confirm your booking.",
      time: "09:47 AM",
    },
  ],
  "ld-005": [
    {
      id: "m5-1",
      from: "lead",
      text: "Hi, do you have a custom package for medium agencies?",
      time: "10:02 AM",
    },
    {
      id: "m5-2",
      from: "vendor",
      text: "Yes, we do. We can tailor monthly plans based on lead volume and visibility needs.",
      time: "10:04 AM",
    },
    {
      id: "m5-3",
      from: "lead",
      text: "Great, can you share the pricing range and what is included?",
      time: "10:06 AM",
    },
    {
      id: "m5-4",
      from: "vendor",
      text: "Sure. I'll share starter, growth, and premium options with feature comparison shortly.",
      time: "10:08 AM",
    },
  ],
  "ld-006": [
    {
      id: "m6-1",
      from: "lead",
      text: "I'm interested in a monthly contract. Is there a discount for 3 months upfront?",
      time: "09:10 AM",
    },
    {
      id: "m6-2",
      from: "vendor",
      text: "Yes, we offer discounted pricing for 3 and 6 month commitments.",
      time: "09:13 AM",
    },
    {
      id: "m6-3",
      from: "lead",
      text: "Nice. Can we schedule a quick call tomorrow morning?",
      time: "09:15 AM",
    },
    {
      id: "m6-4",
      from: "vendor",
      text: "Absolutely. I have 10:30 AM and 11:15 AM available. Which one works for you?",
      time: "09:17 AM",
    },
  ],
  "ld-009": [
    {
      id: "m9-1",
      from: "lead",
      text: "Hi! I'd love to confirm a walkthrough for the property we discussed.",
      time: "10:30 AM",
    },
    {
      id: "m9-2",
      from: "vendor",
      text: "Good morning Sarah - happy to help. Does Thursday 2 PM work for you?",
      time: "10:32 AM",
    },
    {
      id: "m9-3",
      from: "lead",
      text: "Thursday works. Could you also send the checklist beforehand?",
      time: "10:35 AM",
    },
    {
      id: "m9-4",
      from: "vendor",
      text: "Absolutely. I'll email the checklist and meeting link in the next few minutes.",
      time: "10:36 AM",
    },
    {
      id: "m9-5",
      from: "lead",
      text: "Perfect, thank you!",
      time: "10:38 AM",
    },
    {
      id: "m9-6",
      from: "vendor",
      text: "You're welcome - talk soon!",
      time: "10:45 AM",
    },
  ],
};

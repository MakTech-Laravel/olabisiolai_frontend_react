export type LeadTypeFilter = "all" | "whatsapp" | "direct_message" | "quote";

export type LeadRow = {
  id: number;
  business: string;
  userName: string;
  phone: string;
  leadType: "whatsapp" | "direct_message" | "quote";
  /** Short date in table, e.g. Apr 1, 02:30 PM */
  dateShort: string;
  /** Modal copy, e.g. April 1, 2024 at 02:30 PM */
  dateTimeLong: string;
};

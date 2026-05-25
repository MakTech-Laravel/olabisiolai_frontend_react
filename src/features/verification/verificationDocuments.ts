import type { LucideIcon } from "lucide-react";
import { FileText, Home } from "lucide-react";

export type RequiredDocType =
  | "business_registration"
  | "identity_proof"
  | "address_proof";

export type RequiredDocSpec = {
  documentType: RequiredDocType;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const REQUIRED_VERIFICATION_DOCUMENTS: RequiredDocSpec[] = [
  {
    documentType: "business_registration",
    title: "Business Registration",
    description: "Certificate of business registration or incorporation",
    icon: FileText,
  },
  {
    documentType: "identity_proof",
    title: "Identity Proof",
    description: "Government-issued photo ID of authorized representative",
    icon: FileText,
  },
  {
    documentType: "address_proof",
    title: "Address Proof",
    description: "Recent utility bill or bank statement",
    icon: Home,
  },
];

export const DOC_TITLE_TO_TYPE: Record<string, RequiredDocType> = {
  "Business Registration": "business_registration",
  "Identity Proof": "identity_proof",
  "Address Proof": "address_proof",
};

export type DocumentUiStatus = "missing" | "in_review" | "approved" | "flagged";

export function mapApiDocStatus(
  apiStatus: string | undefined,
  hasRecord: boolean,
): DocumentUiStatus {
  if (!hasRecord) return "missing";
  if (apiStatus === "approved") return "approved";
  if (apiStatus === "rejected") return "flagged";
  return "in_review";
}

export function needsDocumentAction(status: DocumentUiStatus): boolean {
  return status === "missing" || status === "flagged";
}

export function documentTypeLabel(documentType: string): string {
  const spec = REQUIRED_VERIFICATION_DOCUMENTS.find((d) => d.documentType === documentType);
  if (spec) return spec.title;
  return documentType.replace(/_/g, " ");
}

export type NestedDocFile<T extends { id: number }> = T & {
  children: NestedDocFile<T>[];
};

export function nestDocumentsByParent<T extends { id: number; parent_document_id?: number | null }>(
  documents: T[],
): NestedDocFile<T>[] {
  const nodes = new Map<number, NestedDocFile<T>>();
  const roots: NestedDocFile<T>[] = [];

  for (const doc of documents) {
    nodes.set(doc.id, { ...doc, children: [] });
  }

  for (const doc of documents) {
    const node = nodes.get(doc.id);
    if (!node) continue;

    const parentId = doc.parent_document_id ?? null;
    if (parentId !== null && nodes.has(parentId)) {
      nodes.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function groupDocumentsByType<
  T extends { document_type: string; id: number; parent_document_id?: number | null },
>(documents: T[]): Array<{ documentType: string; label: string; items: NestedDocFile<T>[] }> {
  const map = new Map<string, T[]>();

  for (const doc of documents) {
    const list = map.get(doc.document_type) ?? [];
    list.push(doc);
    map.set(doc.document_type, list);
  }

  const orderedTypes = REQUIRED_VERIFICATION_DOCUMENTS.map((d) => d.documentType);
  const groups: Array<{ documentType: string; label: string; items: NestedDocFile<T>[] }> = [];

  for (const documentType of orderedTypes) {
    const items = map.get(documentType);
    if (items?.length) {
      groups.push({
        documentType,
        label: documentTypeLabel(documentType),
        items: nestDocumentsByParent(items),
      });
      map.delete(documentType);
    }
  }

  for (const [documentType, items] of map.entries()) {
    groups.push({
      documentType,
      label: documentTypeLabel(documentType),
      items: nestDocumentsByParent(items),
    });
  }

  return groups;
}

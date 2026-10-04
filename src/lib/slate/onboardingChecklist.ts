export const SECTIONS = ['Engagement', 'Negotiation', 'Onboarding', 'Marketing Launch', 'Training', 'Deployment', 'Monitor'] as const;
export type Section = typeof SECTIONS[number];

export type CheckState = 'done' | 'na';

export interface OnboardingItem {
  id: string;
  stage: string;
  bucket: string;
  label: string;
  state: CheckState | null;
}

export interface Onboarding {
  id: string;
  brand_name: string;
  verbal_date: string | null;
  checks: Record<string, string>; // _stage key stores current stage; other keys are legacy
  items: OnboardingItem[] | null;
  archived: boolean;
  created_at: string;
}

export interface ChecklistBucket {
  name: 'Ops' | 'Marketing' | 'Finance';
  items: Array<{ key: string; label: string }>;
}

export interface ChecklistStage {
  stage: string;
  buckets: ChecklistBucket[];
}

export const CHECKLIST: ChecklistStage[] = [
  {
    stage: '1 · Pre-Contract',
    buckets: [
      {
        name: 'Ops',
        items: [
          { key: 'pc_ops_1', label: 'Get onboarding documents from merchant (ACRA, bank statement header, outlet list)' },
          { key: 'pc_ops_2', label: 'Get onboarding contacts: name, email, phone, and portal access level for Marketing, Finance (portal + refund access), and Signatory (incl. designation)' },
          { key: 'pc_ops_3', label: 'Prep contract per the Expectation-to-Contract guide' },
        ],
      },
      {
        name: 'Finance',
        items: [
          { key: 'pc_fin_1', label: 'Walk merchant through finance report and merchant portal (optional now, mandatory before signing)' },
        ],
      },
    ],
  },
  {
    stage: '2 · Pending Signature',
    buckets: [
      {
        name: 'Ops',
        items: [
          { key: 'ps_ops_1', label: 'Confirm BAU payment QR needs (pay-at-counter vs bill-book stickers)' },
          { key: 'ps_ops_2', label: 'Confirm BAU POSM needs (in-store materials, store credits, etc.)' },
          { key: 'ps_ops_3', label: 'Confirm refund process with merchant (shared refund codes or not; what GOps tells outlets)' },
          { key: 'ps_ops_4', label: 'Merchant to create POS button (flag to their tech/ops team)' },
          { key: 'ps_ops_5', label: 'Align deployment and training schedule with GOps, then share dates with merchant' },
        ],
      },
      {
        name: 'Marketing',
        items: [
          { key: 'ps_mkt_1', label: 'Collect high-res logo and product/lifestyle images from merchant' },
        ],
      },
    ],
  },
  {
    stage: '3 · Post Signing',
    buckets: [
      {
        name: 'Ops',
        items: [
          { key: 'posign_ops_1', label: 'Upload to #fs-ops-regional Slack: counter-signed contract, outlet list link, ACRA, bank statement header' },
          { key: 'posign_ops_2', label: 'Check onboarding is in order (Salesforce commercial setup correct, in-app listing looks right)' },
          { key: 'posign_ops_3', label: 'Create WhatsApp group with outlet/area managers if needed' },
          { key: 'posign_ops_4', label: 'Submit POSM request via the 2026 POSM Request Sheet' },
        ],
      },
      {
        name: 'Marketing',
        items: [
          { key: 'posign_mkt_1', label: 'Coordinate with MM on assets/promo setup if launch campaign planned' },
          { key: 'posign_mkt_2', label: "BD-supported (upsized cashback, flash deal SC): action on MM's instruction" },
          { key: 'posign_mkt_3', label: 'Launch package only: BD books self-serve assets' },
        ],
      },
    ],
  },
  {
    stage: '4 · Post-Onboarding',
    buckets: [
      {
        name: 'Ops',
        items: [
          { key: 'pob_ops_1', label: 'Update outlet list with refund and outlet login codes (keep maintained with merchant)' },
        ],
      },
      {
        name: 'Finance',
        items: [
          { key: 'pob_fin_1', label: 'Verify all required portal accesses are working (marketing, finance, signatory)' },
        ],
      },
    ],
  },
  {
    stage: '5 · Post-Launch',
    buckets: [
      {
        name: 'Ops',
        items: [
          { key: 'pl_ops_1', label: 'Monitor transactions; surface issues fast' },
        ],
      },
      {
        name: 'Marketing',
        items: [
          { key: 'pl_mkt_1', label: 'Execute launch campaign (if any) per the marketing plan agreed' },
        ],
      },
    ],
  },
];

export function createDefaultItems(): OnboardingItem[] {
  return [];
}

export function isOnboardingComplete(items: OnboardingItem[]): boolean {
  return items.length > 0 && items.every(i => i.state === 'done' || i.state === 'na');
}

export function countChecked(items: OnboardingItem[]): number {
  return items.filter(i => i.state === 'done' || i.state === 'na').length;
}

export function groupItems(items: OnboardingItem[]): Map<string, Map<string, OnboardingItem[]>> {
  const stageMap = new Map<string, Map<string, OnboardingItem[]>>();
  for (const item of items) {
    if (!stageMap.has(item.stage)) stageMap.set(item.stage, new Map());
    const bucketMap = stageMap.get(item.stage)!;
    if (!bucketMap.has(item.bucket)) bucketMap.set(item.bucket, []);
    bucketMap.get(item.bucket)!.push(item);
  }
  return stageMap;
}

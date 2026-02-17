// services/trustlessworkService.ts

/* =========================
   Types
========================= */

export interface AgreementPayload {
  title: string;
  description: string;
  amount: string;
  platformFee: string;
  signer: string;
  serviceType: string;
  roles: Record<string, string>;
  milestones: Array<{
    description: string;
    amount: string;
    status: string;
  }>;
  notifications: {
    notifyEmail: string;
    signerEmail: string;
  };
}

export interface AgreementResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/* =========================
   Config
========================= */

const PLATFORM_ADDRESS = process.env.NEXT_PUBLIC_PLATFORM_ADDRESS ?? "GBTTKTSBLHGMRY3T65JXT423MHQZXTD26TTHQEY5HNF2KWFFDKKVHVPD";
const DISPUTE_RESOLVER = process.env.NEXT_PUBLIC_DISPUTE_RESOLVER ?? "GB6MP3L6UGIDY6O6MXNLSKHLXT2T2TCMPZIZGUTOGYKOLHW7EORWMFCK";
const TRUSTLINE_USDC = { symbol: "USDC", address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" }

const TRUSTLESSWORK_API_BASE_URL =
  process.env.NEXT_PUBLIC_TRUSTLESSWORK_API_URL ??
  "https://dev.api.trustlesswork.com";

const TRUSTLESSWORK_API_KEY =
  process.env.NEXT_PUBLIC_TRUSTLESSWORK_API_KEY ??
  "bJJ8-62SYFUzv3kwajoLEw.2b170e199a57120ec56de4bdece08f54b03e5242fea50c5e44ca810b987412ea";

const CREATE_SINGLE_RELEASE_URL = `${TRUSTLESSWORK_API_BASE_URL}/deployer/single-release`;
const CREATE_MULTI_RELEASE_URL = `${TRUSTLESSWORK_API_BASE_URL}/deployer/multi-release`;
const SEND_TRANSACTION_URL = `${TRUSTLESSWORK_API_BASE_URL}/helper/send-transaction`;

/* =========================
   Helpers
========================= */

const buildHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  ...(TRUSTLESSWORK_API_KEY && { "x-api-key": TRUSTLESSWORK_API_KEY }),
});

async function safeFetch<T>(
  url: string,
  body: unknown
): Promise<AgreementResponse<T>> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = (await response.json()) as T;
    return { success: true, data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const DEFAULT_SIGNER = process.env.NEXT_PUBLIC_DEFAULT_SIGNER ?? "GBTTKTSBLHGMRY3T65JXT423MHQZXTD26TTHQEY5HNF2KWFFDKKVHVPD";
const DEFAULT_APPROVER = process.env.NEXT_PUBLIC_DEFAULT_APPROVER ?? "GB6MP3L6UGIDY6O6MXNLSKHLXT2T2TCMPZIZGUTOGYKOLHW7EORWMFCK";

function generateEngagementId(type: "MULTIRELEASE" | "SINGLERELEASE") {
  return `THALOS-v2-${type}-${Date.now().toString(36).toUpperCase()}`;
}

type ServiceType = "multi-release" | "single-release";

function buildRoles(serviceType: ServiceType) {
  const baseRoles = {
    approver: DEFAULT_APPROVER,
    serviceProvider: DEFAULT_SIGNER,
    platformAddress: PLATFORM_ADDRESS,
    releaseSigner: DEFAULT_SIGNER,
    disputeResolver: DISPUTE_RESOLVER,
  };

  if (serviceType === "single-release") {
    return {
      ...baseRoles,
      receiver: DEFAULT_SIGNER,
    };
  }

  return baseRoles;
}

function buildBaseAgreement(payload: AgreementPayload,
  serviceType: ServiceType,
  engagementType: "MULTIRELEASE" | "SINGLERELEASE") {
  return {
    signer: DEFAULT_SIGNER,
    engagementId: generateEngagementId(engagementType),
    title: payload.title,
    description: payload.description,
    roles: buildRoles(serviceType),
    platformFee: Number(payload.platformFee),
    trustline: TRUSTLINE_USDC,
  };
}

function buildAgreementBody(payload: AgreementPayload) {
  const isMultiRelease = payload.serviceType === "multi-release";

  const base = buildBaseAgreement(
    payload,
    payload.serviceType as ServiceType,
    isMultiRelease ? "MULTIRELEASE" : "SINGLERELEASE"
  );

  if (isMultiRelease) {
    return {
      ...base,
      milestones: payload.milestones.map((m) => ({
        description: m.description,
        amount: Number(m.amount),
        status: m.status,
        receiver: DEFAULT_SIGNER,
      })),
    };
  }

  return {
    ...base,
    amount: Number(payload.amount),
    milestones: payload.milestones.map((m) => ({
      description: m.description,
    })),
  };
}

/* =========================
   Public API
========================= */


export async function createAgreement(
  payload: AgreementPayload
): Promise<AgreementResponse> {
  console.log("Creating agreement with payload:", payload);
  const body = buildAgreementBody(payload);
  const url = payload.serviceType === "multi-release" ? CREATE_MULTI_RELEASE_URL : CREATE_SINGLE_RELEASE_URL;
  return safeFetch(url, body);
}

export async function sendTransaction(
  signedXdr: string
): Promise<AgreementResponse> {
  return safeFetch(SEND_TRANSACTION_URL, { signedXdr });
}

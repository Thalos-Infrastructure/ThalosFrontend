// services/trustlessworkService.ts

/* =========================
   Types
========================= */

export interface AgreementPayload {
  engagementId: string;
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
  trustline: {
    symbol: string;
    address: string;
  };
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

const TRUSTLESSWORK_API_URL =
  process.env.NEXT_PUBLIC_TRUSTLESSWORK_API_URL ??
  "https://dev.api.trustlesswork.com/deployer/single-release";

const TRUSTLESSWORK_API_KEY =
  process.env.NEXT_PUBLIC_TRUSTLESSWORK_API_KEY ??
  "bJJ8-62SYFUzv3kwajoLEw.2b170e199a57120ec56de4bdece08f54b03e5242fea50c5e44ca810b987412ea";

const SEND_TRANSACTION_URL =
  process.env.NEXT_PUBLIC_TRUSTLESSWORK_SEND_TX_URL ??
  TRUSTLESSWORK_API_URL.replace(
    "/deployer/single-release",
    "/helper/send-transaction"
  );

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

function buildAgreementBody(payload: AgreementPayload) {
  return {
    //signer: payload.signer,
    signer: "GBTTKTSBLHGMRY3T65JXT423MHQZXTD26TTHQEY5HNF2KWFFDKKVHVPD",
    engagementId: payload.engagementId,
    title: payload.title,
    description: payload.description,
    //roles: payload.roles,
    roles: { 
      approver: "GB6MP3L6UGIDY6O6MXNLSKHLXT2T2TCMPZIZGUTOGYKOLHW7EORWMFCK", 
      serviceProvider: "GBTTKTSBLHGMRY3T65JXT423MHQZXTD26TTHQEY5HNF2KWFFDKKVHVPD", 
      platformAddress: "GBTTKTSBLHGMRY3T65JXT423MHQZXTD26TTHQEY5HNF2KWFFDKKVHVPD", 
      releaseSigner: "GBTTKTSBLHGMRY3T65JXT423MHQZXTD26TTHQEY5HNF2KWFFDKKVHVPD", 
      disputeResolver: "GB6MP3L6UGIDY6O6MXNLSKHLXT2T2TCMPZIZGUTOGYKOLHW7EORWMFCK", 
      receiver: "GBTTKTSBLHGMRY3T65JXT423MHQZXTD26TTHQEY5HNF2KWFFDKKVHVPD" 
    },
    amount: Number(payload.amount),
    platformFee: Number(payload.platformFee),
    milestones: payload.milestones.map((m) => ({
      description: m.description,
    })),
    trustline: payload.trustline,
  };
}

/* =========================
   Public API
========================= */

export async function createAgreement(
  payload: AgreementPayload
): Promise<AgreementResponse> {
  const body = buildAgreementBody(payload);
  return safeFetch(TRUSTLESSWORK_API_URL, body);
}

export async function sendTransaction(
  signedXdr: string
): Promise<AgreementResponse> {
  return safeFetch(SEND_TRANSACTION_URL, { signedXdr });
}

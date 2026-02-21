// ======================================================
// services/trustlessworkService.ts
// ======================================================

/* =====================================================
   TYPES
===================================================== */

export type ServiceType = "single-release" | "multi-release";

export interface AgreementPayload {
  title: string;
  description: string;
  amount: string;
  platformFee: string;
  signer: string;
  serviceType: ServiceType;
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

/* ---------------- Escrow Types ---------------- */

export interface EscrowRole {
  approver: string;
  serviceProvider: string;
  platformAddress: string;
  releaseSigner: string;
  disputeResolver: string;
  receiver?: string;
  observers?: string[];
}

export interface EscrowFlags {
  disputed: boolean;
  released: boolean;
  resolved: boolean;
}

export interface EscrowTrustline {
  address: string;
  contractId: string;
  symbol: string;
}

export interface EscrowMilestone {
  description: string;
  status: string;
  evidence: string;
  approved?: boolean;
  amount?: number;
  flags?: EscrowFlags;
  receiver?: string;
}

export interface EscrowInconsistencies {
  inconsistencyFound: boolean;
  message: string;
  differences: string[];
}

export interface Escrow {
  contractId: string;
  contractBaseId: string;
  signer: string;
  type: string;
  engagementId: string;
  title: string;
  description: string;
  amount?: number;
  platformFee: number;
  roles: EscrowRole;
  flags?: EscrowFlags;
  trustline: EscrowTrustline;
  milestones: EscrowMilestone[];
  isActive: boolean;
  createdAt: { _seconds: number; _nanoseconds: number };
  updatedAt: { _seconds: number; _nanoseconds: number };
  balance: number;
  inconsistencies: EscrowInconsistencies;
}

/* =====================================================
   CONFIG
===================================================== */

const BASE_URL =
  process.env.NEXT_PUBLIC_TRUSTLESSWORK_API_URL ??
  "https://dev.api.trustlesswork.com";

const API_KEY =
  process.env.NEXT_PUBLIC_TRUSTLESSWORK_API_KEY ??
  "bJJ8-62SYFUzv3kwajoLEw.2b170e199a57120ec56de4bdece08f54b03e5242fea50c5e44ca810b987412ea";

const PLATFORM_ADDRESS =
  process.env.NEXT_PUBLIC_PLATFORM_ADDRESS ?? "GBTTKTSBLHGMRY3T65JXT423MHQZXTD26TTHQEY5HNF2KWFFDKKVHVPD";

const DISPUTE_RESOLVER =
  process.env.NEXT_PUBLIC_DISPUTE_RESOLVER ?? "GB6MP3L6UGIDY6O6MXNLSKHLXT2T2TCMPZIZGUTOGYKOLHW7EORWMFCK";

import { TRUSTLINE_USDC } from "@/lib/config";

/* =====================================================
   ENDPOINT BUILDER
===================================================== */

const endpoints = {
  deployer: {
    single: `${BASE_URL}/deployer/single-release`,
    multi: `${BASE_URL}/deployer/multi-release`,
  },
  escrow: {
    fund: (type: ServiceType) =>
      `${BASE_URL}/escrow/${type}/fund-escrow`,
    release: (type: ServiceType) =>
      type === "single-release"
        ? `${BASE_URL}/escrow/${type}/release-funds`
        : `${BASE_URL}/escrow/${type}/release-milestone-funds`,
    approve: (type: ServiceType) =>
      `${BASE_URL}/escrow/${type}/approve-milestone`,
  },
  helper: {
    sendTransaction: `${BASE_URL}/helper/send-transaction`,
    getEscrowsBySigner: `${BASE_URL}/helper/get-escrows-by-signer`,
  },
};

/* =====================================================
   HTTP LAYER
===================================================== */

const buildHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  ...(API_KEY && { "x-api-key": API_KEY }),
});

async function safeFetch<T>(
  url: string,
  options: RequestInit
): Promise<AgreementResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: buildHeaders(),
      ...options,
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = (await response.json()) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/* =====================================================
   INTERNAL BUILDERS
===================================================== */

function generateEngagementId(type: "MULTIRELEASE" | "SINGLERELEASE") {
  return `THALOS-v2-${type}-${Date.now().toString(36).toUpperCase()}`;
}

function buildRoles(serviceType: ServiceType, roles: Record<string, string>) {
  const base = {
    approver: roles.approver,
    serviceProvider: roles.serviceProvider,
    platformAddress: PLATFORM_ADDRESS,
    releaseSigner: roles.releaseSigner,
    disputeResolver: DISPUTE_RESOLVER,
  };

  return serviceType === "single-release"
    ? { ...base, receiver: roles.receiver }
    : base;
}

function buildAgreementBody(payload: AgreementPayload) {
  const isMulti = payload.serviceType === "multi-release";

  const base = {
    signer: payload.signer,
    engagementId: generateEngagementId(
      isMulti ? "MULTIRELEASE" : "SINGLERELEASE"
    ),
    title: payload.title,
    description: payload.description,
    roles: buildRoles(payload.serviceType, payload.roles),
    platformFee: Number(payload.platformFee),
    trustline: TRUSTLINE_USDC,
  };

  if (isMulti) {
    return {
      ...base,
      milestones: payload.milestones.map((m) => ({
        description: m.description,
        amount: Number(m.amount),
        status: m.status,
        receiver: payload.signer,
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

/* =====================================================
   PUBLIC API
===================================================== */

export async function createAgreement(
  payload: AgreementPayload
): Promise<AgreementResponse> {
  const body = buildAgreementBody(payload);

  const url =
    payload.serviceType === "multi-release"
      ? endpoints.deployer.multi
      : endpoints.deployer.single;

  return safeFetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fundEscrow(
  contractId: string,
  signer: string,
  amount: number,
  type: ServiceType
) {
  return safeFetch(endpoints.escrow.fund(type), {
    method: "POST",
    body: JSON.stringify({ contractId, signer, amount }),
  });
}

export async function releaseFunds(
  contractId: string,
  releaseSigner: string,
  type: ServiceType,
  milestoneIndex?: string
) {
  return safeFetch(endpoints.escrow.release(type), {
    method: "POST",
    body: JSON.stringify({ contractId, releaseSigner, milestoneIndex }),
  });
}

export async function approveMilestone(
  contractId: string,
  milestoneIndex: string,
  approver: string,
  type: ServiceType
) {
  return safeFetch(endpoints.escrow.approve(type), {
    method: "POST",
    body: JSON.stringify({ contractId, milestoneIndex, approver }),
  });
}

export async function sendTransaction(signedXdr: string) {
  return safeFetch(endpoints.helper.sendTransaction, {
    method: "POST",
    body: JSON.stringify({ signedXdr }),
  });
}

export async function getEscrowsBySigner(
  signer: string,
  page = 1,
  validateOnChain = true,
  pageSize = 10
): Promise<AgreementResponse<Escrow[]>> {
  const url = `${endpoints.helper.getEscrowsBySigner}?signer=${encodeURIComponent(
    signer
  )}&page=${page}&validateOnChain=${validateOnChain}&pageSize=${pageSize}`;

  return safeFetch<Escrow[]>(url, {
    method: "GET",
  });
}

/**
 * Get escrows by role and advanced filters.
 * @param params All possible filters for the endpoint.
 */
export async function getEscrowsByRole(params: {
  signer?: string;
  role?: string;
  roleAddress?: string;
  status?: string;
  type?: string;
  engagementId?: string;
  title?: string;
  startDate?: string;
  minAmount?: number;
  maxAmount?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  contractID?: string;
  endDate?: string;
}) {
  const url = new URL(`${BASE_URL}/helper/get-escrows-by-role`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, String(value));
    }
  });
  return safeFetch<Escrow[]>(url.toString(), {
    method: "GET",
  });
}

import { getAgreement, type Agreement } from "@/lib/api/agreements"

export type AgreementSyncResult = { ok: true; agreement: Agreement } | { ok: false; error: string }

export async function revalidateAgreement(
  agreementId: string,
  token?: string,
): Promise<AgreementSyncResult> {
  const result = await getAgreement(agreementId, token)

  if (result.success && result.data) {
    return {
      ok: true,
      agreement: { ...result.data, lastSyncedAt: new Date().toISOString(), syncError: null },
    }
  }

  const rawError = result.error?.toLowerCase() ?? ""
  if (rawError.includes("not found") || rawError.includes("404")) {
    return { ok: false, error: "Este acuerdo no existe o no tienes permiso" }
  }
  if (
    rawError.includes("forbidden") ||
    rawError.includes("permission") ||
    rawError.includes("403")
  ) {
    return { ok: false, error: "No tienes permiso para realizar esta acción" }
  }
  return { ok: false, error: "Status pending confirmation" }
}

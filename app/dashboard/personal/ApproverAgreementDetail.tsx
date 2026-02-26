type Milestone = { description: string; amount: string; status: "pending" | "approved" | "released"; approved?: boolean };
type Agreement = {
  id: string;
  title: string;
  status: string;
  type: "Single Release" | "Multi Release";
  counterparty: string;
  amount: string;
  date: string;
  releaseStrategy?: string;
  milestones: Milestone[];
  receiver: string;
  balance?: string;
  serviceProvider?: string;
  released?: boolean;
};
interface ApproverAgreementDetailProps {
  agr: Agreement;
  walletAddress: string;
}

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { statusConfig } from "./statusConfig";
import { useLanguage } from "@/lib/i18n";
import { fundAndSignEscrow } from "@/lib/agreementActions";

export function ApproverAgreementDetail({ agr, walletAddress }: ApproverAgreementDetailProps) {
  const [showDetail, setShowDetail] = React.useState(false);
  const [loadingMs, setLoadingMs] = React.useState<number | null>(null);
  const [errorMs, setErrorMs] = React.useState<string | null>(null);
  const [localMilestones, setLocalMilestones] = React.useState<Milestone[]>(agr.milestones);
  const [funding, setFunding] = React.useState(false);
  const [fundSuccess, setFundSuccess] = React.useState(false);
  const [fundError, setFundError] = React.useState<string | null>(null);
  const allApproved = localMilestones.every(m => m.approved === true);
  const allReleased = localMilestones.every(m => m.status === "released");
  const someApproved = localMilestones.some(m => m.approved === true || m.status === "approved");
  const completedMs = localMilestones.filter(m => m.status === "released").length;
  const progressPct = localMilestones.length > 0 ? (completedMs / localMilestones.length) * 100 : 0;
  const amountNum = Number(agr.amount);
  const balanceNum = Number(agr.balance);
  const isFunded = fundSuccess || (balanceNum >= amountNum);
  const disableFund = funding || isFunded;
  const { t } = useLanguage();

  // Determine current step for the 3-step indicator
  const currentStep = allReleased ? 3 : (someApproved || allApproved) ? 2 : isFunded ? 1 : 0;

  async function handleApprove(idx: number) {
    setLoadingMs(idx);
    setErrorMs(null);
    try {
      const { approveMilestone, sendTransaction } = await import("@/services/trustlessworkService");
      const res = await approveMilestone(agr.id, idx.toString(), walletAddress, agr.type === "Multi Release" ? "multi-release" : "single-release");
      if (!res.success) throw new Error(res.error || "Error approving milestone");
      const xdr = res.data && typeof res.data === 'object' && 'unsignedTransaction' in res.data ? (res.data as any).unsignedTransaction : undefined;
      if (xdr) {
        const { signTransaction: freighterSign } = await import("@stellar/freighter-api");
        const signedResult = await freighterSign(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
        if (!signedResult?.signedTxXdr) {
          if (signedResult?.error) throw new Error("Freighter error: " + signedResult.error);
          throw new Error("Transaction signing failed (no XDR returned)");
        }
        try {
          const sendRes = await sendTransaction(signedResult.signedTxXdr);
          if (!sendRes.success) throw new Error(sendRes.error || "Error sending transaction");
        } catch (e: any) {
          setErrorMs("Error sending transaction: " + (e.message || "Unknown error"));
        }
      }
      setLocalMilestones(ms => ms.map((m, i) => i === idx ? { ...m, status: "approved" as const, approved: true } : m));
    } catch (e: any) {
      setErrorMs(e.message || "Unknown error");
    } finally {
      setLoadingMs(null);
    }
  }

  async function handleReleaseAll() {
    setLoadingMs(-1);
    setErrorMs(null);
    try {
      const { releaseFunds, sendTransaction } = await import("@/services/trustlessworkService");
      const type = agr.type === "Multi Release" ? "multi-release" : "single-release";
      const res = await releaseFunds(agr.id, walletAddress, type);
      if (!res.success) throw new Error(res.error || "Error releasing funds");
      const xdr = res.data && typeof res.data === 'object' && 'unsignedTransaction' in res.data ? (res.data as any).unsignedTransaction : undefined;
      if (xdr) {
        const { signTransaction: freighterSign } = await import("@stellar/freighter-api");
        const signedResult = await freighterSign(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
        if (!signedResult?.signedTxXdr) {
          if (signedResult?.error) throw new Error("Freighter error: " + signedResult.error);
          throw new Error("Transaction signing failed (no XDR returned)");
        }
        const sendRes = await sendTransaction(signedResult.signedTxXdr);
        if (!sendRes.success) throw new Error(sendRes.error || "Error sending transaction");
      }
      setLocalMilestones(ms => ms.map(m => ({ ...m, status: "released" as const })));
    } catch (e: any) {
      setErrorMs(e.message || "Unknown error");
    } finally {
      setLoadingMs(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-5 backdrop-blur-md">
      {/* Buyer role badge */}
      <div className="mb-4 rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-2 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
        <p className="text-xs text-blue-400/80 font-semibold">{t("flow.buyerView")}</p>
      </div>

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full cursor-pointer" onClick={() => setShowDetail(v => !v)}>
        <div>
          <p className="text-base font-semibold text-white">{agr.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/35">
            <span className="font-semibold text-white/60">{agr.type}</span>
            <span className="text-white/15">|</span>
            <span title={agr.id} className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap inline-block align-bottom">
              {agr.id}
            </span>
            <span className="text-white/15">|</span>
            <span>{agr.date}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          {(() => {
            const st = statusConfig[agr.status] || statusConfig.funded;
            return <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", st.color)}>{t(st.labelKey) ?? "Unknown"}</span>;
          })()}
          <p className="text-lg font-bold text-white">
            {"$"}{agr.milestones.length === 1 ? agr.amount : agr.milestones.reduce((acc, ms) => acc + Number(ms.amount), 0)}
            <span className="text-xs font-normal text-white/35 ml-1">USDC</span>
          </p>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={cn("text-white/30 transition-transform", showDetail && "rotate-180")}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Progress bar */}
      {localMilestones.length >= 1 && (
        <div className="flex items-center gap-3 w-full mt-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className={cn("h-full rounded-full transition-all duration-500", allReleased ? "bg-emerald-400" : "bg-[#f0b400]")} style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs text-white/30">{completedMs}/{localMilestones.length}</span>
        </div>
      )}

      {/* 3-step flow indicator */}
      <div className="mt-4 flex items-center gap-0">
        {[
          { label: t("flow.stepFund"), done: isFunded, active: currentStep === 0 },
          { label: t("flow.stepReview"), done: allApproved, active: currentStep === 1 || currentStep === 2 },
          { label: t("flow.stepRelease"), done: allReleased, active: currentStep === 2 && allApproved },
        ].map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className={cn("h-px flex-1", s.done || s.active ? "bg-[#f0b400]/40" : "bg-white/[0.06]")} />}
            <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all",
              s.done ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : s.active ? "bg-[#f0b400]/10 text-[#f0b400] border border-[#f0b400]/20"
                : "bg-white/[0.03] text-white/20 border border-white/[0.04]"
            )}>
              {s.done ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <span className={cn("h-1.5 w-1.5 rounded-full", s.active ? "bg-[#f0b400]" : "bg-white/20")} />
              )}
              {s.label}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Fund Escrow button (step 1) */}
      {!isFunded && !allReleased && (
        <div className="mt-4 rounded-xl border border-blue-500/15 bg-blue-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{t("flow.fundEscrow")}</p>
            <p className="text-xs text-white/35 mt-0.5">{t("flow.pendingFundingDesc")}</p>
          </div>
          <Button
            onClick={() => fundAndSignEscrow({
              contractId: agr.id,
              amount: agr.amount,
              walletAddress,
              serviceType: agr.type === "Multi Release" ? "multi-release" : "single-release",
              openWalletModal: async () => {},
              signTransaction: async () => {},
              setFunding,
              setError: setFundError,
              setSuccess: setFundSuccess
            })}
            disabled={disableFund}
            className="rounded-full bg-blue-500 px-6 text-sm font-semibold text-white hover:bg-blue-600 shadow-[0_4px_16px_rgba(59,130,246,0.25)]"
          >
            {funding ? t("flow.funding") : t("flow.fundEscrow")}
          </Button>
        </div>
      )}
      {fundError && <div className="text-red-400 text-xs mt-2">{fundError}</div>}
      {fundSuccess && <div className="text-emerald-400 text-xs mt-2">{t("flow.funded")} - Escrow funded successfully!</div>}

      {/* Expanded detail: milestones */}
      {showDetail && (
        <div className="mt-4">
          <div className="flex flex-col gap-3">
            {localMilestones.map((ms, idx) => (
              <div key={idx} className={cn("rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                ms.status === "released" ? "border-emerald-500/20 bg-emerald-500/5" : (ms.status === "approved" || ms.approved) ? "border-[#f0b400]/20 bg-[#f0b400]/5" : "border-white/[0.06] bg-[#0a0a0c]/70"
              )}>
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    ms.status === "released" ? "bg-emerald-500/20 text-emerald-400" : (ms.status === "approved" || ms.approved) ? "bg-[#f0b400]/20 text-[#f0b400]" : "bg-white/10 text-white/40"
                  )}>{idx + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{ms.description}</p>
                    <p className={cn("text-xs font-medium mt-0.5",
                      ms.status === "released" ? "text-emerald-400" : (ms.status === "approved" || ms.approved) ? "text-[#f0b400]" : "text-white/30"
                    )}>
                      {ms.status === "released" ? t("flow.released")
                        : (ms.status === "approved" || ms.approved) ? t("flow.evidenceReady")
                        : isFunded ? t("flow.awaitingEvidence") : t("flow.pendingFundingDesc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-white">{"$"}{localMilestones.length === 1 && idx === 0 ? agr.amount : ms.amount} <span className="text-xs font-normal text-white/35">USDC</span></p>
                  {isFunded && ms.status === "pending" && !allReleased && ms.approved === false && (
                    <Button size="sm" onClick={() => handleApprove(idx)} disabled={loadingMs === idx}
                      className="rounded-full bg-[#f0b400]/15 text-xs font-semibold text-[#f0b400] hover:bg-[#f0b400]/25 border border-[#f0b400]/20">
                      {loadingMs === idx ? t("flow.approving") : t("flow.approveMs")}
                    </Button>
                  )}
                  {ms.status === "released" && (
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                      {t("flow.released")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {errorMs && <div className="text-red-400 text-xs mt-2">{errorMs}</div>}

          {/* Release button */}
          {allApproved && !agr.released && !allReleased && (
            <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-400">{t("flow.releaseAll")}</p>
                <p className="text-xs text-white/35 mt-0.5">All milestones are approved. Release funds to the seller.</p>
              </div>
              <Button
                onClick={() => handleReleaseAll()}
                disabled={loadingMs === -1}
                className="rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white hover:bg-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.25)]"
              >
                {loadingMs === -1 ? t("flow.releasing") : t("flow.releaseAll")}
              </Button>
            </div>
          )}

          {/* All released success */}
          {allReleased && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" className="mx-auto mb-2"><polyline points="20 6 9 17 4 12"/></svg>
              <p className="text-sm font-bold text-emerald-400">{t("flow.allFundsReleased")}</p>
              <p className="text-xs text-white/35 mt-0.5">{t("flow.allFundsReleasedDesc")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



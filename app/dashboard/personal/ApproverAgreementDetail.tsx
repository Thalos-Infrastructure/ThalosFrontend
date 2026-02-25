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
  const completedMs = localMilestones.filter(m => m.status === "released").length;
  const progressPct = localMilestones.length > 0 ? (completedMs / localMilestones.length) * 100 : 0;
  const amountNum = Number(agr.amount);
  const balanceNum = Number(agr.balance);
  const disableFund = funding || fundSuccess || (balanceNum >= amountNum);
  const { t } = useLanguage();
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
      setLocalMilestones(ms => ms.map((m, i) => i === idx ? { ...m, status: "approved" } : m));
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
      setLocalMilestones(ms => ms.map(m => ({ ...m, status: "released" })));
    } catch (e: any) {
      setErrorMs(e.message || "Unknown error");
    } finally {
      setLoadingMs(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/6 bg-[#0a0a0c]/70 p-5 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <p className="text-base font-semibold text-white cursor-pointer" onClick={() => setShowDetail(v => !v)}>{agr.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/35">
            <span className="font-semibold text-white/60">{agr.type}</span>
            <span className="text-white/15">|</span>
            <span title={agr.id} style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'bottom' }}>
              {agr.id}
            </span>
            <span className="text-white/15">|</span>
            <span>{agr.date}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {(() => {
            const st = statusConfig[agr.status] || statusConfig.funded;
            return (
              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", st.color)}>{t(st.labelKey) ?? "Desconocido"}</span>
            );
          })()}
          <p className="text-lg font-bold text-white flex items-center gap-2">
            {"$"}
              {agr.milestones.length === 1 ? agr.amount : agr.milestones.reduce((acc, ms) => acc + Number(ms.amount), 0)} 
            <span className="text-xs font-normal text-white/35">USDC</span>
            <Button size="sm"
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
              className="ml-2"
            >
              {funding ? "Funding..." : fundSuccess ? "Funded!" : "Funds"}
            </Button>
          </p>
        </div>
      </div>
      {/* Progress bar for milestones (show for both single and multi release) */}
      {localMilestones.length >= 1 && (
        <div className="flex items-center gap-3 w-full mt-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/6">
            <div className={cn("h-full rounded-full transition-all duration-500", allReleased ? "bg-emerald-400" : "bg-[#f0b400]")} style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs text-white/30">{completedMs}/{localMilestones.length}</span>
        </div>
      )}
      {fundError && <div className="text-red-400 text-xs mt-2">{fundError}</div>}
      {fundSuccess && <div className="text-emerald-400 text-xs mt-2">Escrow funded and transaction signed!</div>}
      {showDetail && (
        <div className="mt-4">
          <div className="flex flex-col gap-3">
            {localMilestones.map((ms, idx) => (
              <div key={idx} className={cn("rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                ms.status === "released" ? "border-emerald-500/20 bg-emerald-500/5" : ms.status === "approved" ? "border-[#f0b400]/20 bg-[#f0b400]/5" : "border-white/6 bg-[#0a0a0c]/70"
              )}>
                <div>
                  <p className="text-sm font-semibold text-white">{ms.description}</p>
                  <p className={cn("text-xs font-medium mt-0.5",
                    ms.status === "released" ? "text-emerald-400" : ms.status === "approved" ? "text-[#f0b400]" : "text-white/30"
                  )}>
                    {ms.status === "released" ? "Released" : ms.status === "approved" ? "Approved - Ready to release" : "Pending approval"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-white">{"$"}{localMilestones.length === 1 && idx === 0 ? agr.amount : ms.amount} <span className="text-xs font-normal text-white/35">USDC</span></p>
                  {ms.status === "pending" && !allReleased && ms.approved === false && (
                    <Button size="sm" onClick={() => handleApprove(idx)} disabled={loadingMs === idx}>{loadingMs === idx ? "Approving..." : "Approve"}</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {errorMs && <div className="text-red-400 text-xs mt-2">{errorMs}</div>}
          {allApproved && !agr.released && (
            <Button className="mt-4" onClick={() => handleReleaseAll()} disabled={loadingMs === -1}>{loadingMs === -1 ? "Releasing..." : "Release"}</Button>
          )}
        </div>
      )}
    </div>
  );
}



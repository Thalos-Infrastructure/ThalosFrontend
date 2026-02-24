import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Local statusConfig to avoid import issues
const statusConfig = {
  funded: { label: "Funded", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  in_progress: { label: "In Progress", color: "bg-[#f0b400]/10 text-[#f0b400] border-[#f0b400]/20" },
  awaiting: { label: "Awaiting Approval", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  released: { label: "Released", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

import { fundAndSignEscrow } from "@/lib/agreementActions";

export function ApproverAgreementDetail({ agr, walletAddress }) {
  const [showDetail, setShowDetail] = React.useState(false);
  const [loadingMs, setLoadingMs] = React.useState(null);
  const [errorMs, setErrorMs] = React.useState(null);
  const [localMilestones, setLocalMilestones] = React.useState(agr.milestones);
  const [funding, setFunding] = React.useState(false);
  const [fundError, setFundError] = React.useState(null);
  const [fundSuccess, setFundSuccess] = React.useState(false);
  const allApproved = localMilestones.every(m => m.approved === true);
  console.log("Milestones and approval status:", localMilestones, "All approved:", allApproved);
  const allReleased = localMilestones.every(m => m.status === "released");

  // Deshabilitar si amount >= balance
  const amountNum = Number(agr.amount);
  const balanceNum = Number(agr.balance);
  //const balanceNum = 0; // Temporalmente forzar a 0 para pruebas, quitar esta línea en producción
  const disableFund = funding || fundSuccess || (balanceNum >= amountNum);

  async function handleApprove(idx) {
    setLoadingMs(idx);
    setErrorMs(null);
    try {
      const { approveMilestone } = await import("@/services/trustlessworkService");
      const res = await approveMilestone(agr.id, idx.toString(), walletAddress, agr.type === "Multi Release" ? "multi-release" : "single-release");
      if (!res.success) throw new Error(res.error || "Error approving milestone");
      
      console.log("Milestone approved, response:", res);
      // sign the transaction if XDR is returned
      const xdr = res.data?.unsignedTransaction;
      if (xdr) {
        const { signTransaction: freighterSign } = await import("@stellar/freighter-api");
        const signedResult = await freighterSign(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
        console.log("Transaction signed, result:", signedResult);
        if (!signedResult?.signedTxXdr) {
          if (signedResult?.error) throw new Error("Freighter error: " + signedResult.error);
          throw new Error("Transaction signing failed (no XDR returned)");
        }
        // Enviar la transacción firmada al backend
        try {
          const { sendTransaction } = await import("@/services/trustlessworkService");
          const sendRes = await sendTransaction(signedResult.signedTxXdr);
          if (!sendRes.success) throw new Error(sendRes.error || "Error sending transaction");
        } catch (e) {
          setErrorMs("Error sending transaction: " + (e.message || "Unknown error"));
        }
      }
      setLocalMilestones(ms => ms.map((m, i) => i === idx ? { ...m, status: "approved" } : m));

      // Llamar a changeMilestoneStatus
      try {
        const { changeMilestoneStatus } = await import("@/services/trustlessworkService");
        const res1 = await changeMilestoneStatus(
          agr.id,
          idx.toString(),
          "Milestone approved", // Puedes ajustar la evidencia
          "approved",
          agr.serviceProvider,
          agr.type === "Multi Release" ? "multi-release" : "single-release"
        );
        if (!res1.success) throw new Error(res1.error || "Error updating milestone status");
        console.log("Milestone approved, response:", res);
      // sign the transaction if XDR is returned
      const xdr = res1.data?.unsignedTransaction;
      if (xdr) {
        const { signTransaction: freighterSign } = await import("@stellar/freighter-api");
        const signedResult = await freighterSign(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
        console.log("Transaction signed, result:", signedResult);
        if (!signedResult?.signedTxXdr) {
        if (signedResult?.error) throw new Error("Freighter error: " + signedResult.error);
            throw new Error("Transaction signing failed (no XDR returned)");
        }
       }
      } catch (e) {
        setErrorMs("Error updating milestone status: " + (e.message || "Unknown error"));
      }
    } catch (e) {
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
      // Firmar y enviar transacción si hay XDR
      const xdr = res.data?.unsignedTransaction;
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
    } catch (e) {
      setErrorMs(e.message || "Unknown error");
    } finally {
      setLoadingMs(null);
    }
  }
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-5 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <p className="text-base font-semibold text-white cursor-pointer" onClick={() => setShowDetail(v => !v)}>{agr.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/35">
            <span>{agr.id}</span><span className="text-white/15">|</span><span>{agr.amount} USDC</span><span className="text-white/15">|</span><span>{agr.status}</span><span className="text-white/15">|</span><span>{agr.date}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusConfig[agr.status]?.color)}>{statusConfig[agr.status]?.label}</span>
          <p className="text-lg font-bold text-white flex items-center gap-2">
            {"$"}
            {agr.milestones.length === 1 ? agr.amount : agr.milestones.reduce((acc, ms) => acc + Number(ms.amount), 0)}
            <span className="text-xs font-normal text-white/35">USDC</span>
            <Button size="sm"
              onClick={() => fundAndSignEscrow({
                contractId: agr.id,
                amount: agr.amount,
                walletAddress,
                openWalletModal: () => {}, // No modal in this context
                signTransaction: () => {}, // No sign in this context
                setFunding,
                setError: setFundError,
                setSuccess: setFundSuccess,
              })}
              disabled={disableFund}
              className="ml-2"
            >
              {funding ? "Funding..." : fundSuccess ? "Funded!" : "Funds"}
            </Button>
          </p>
        </div>
      </div>
      {fundError && <div className="text-red-400 text-xs mt-2">{fundError}</div>}
      {fundSuccess && <div className="text-emerald-400 text-xs mt-2">Escrow funded and transaction signed!</div>}
      {showDetail && (
        <div className="mt-4">
          <div className="flex flex-col gap-3">
            {localMilestones.map((ms, idx) => (
              <div key={idx} className={cn("rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                ms.status === "released" ? "border-emerald-500/20 bg-emerald-500/5" : ms.status === "approved" ? "border-[#f0b400]/20 bg-[#f0b400]/5" : "border-white/[0.06] bg-[#0a0a0c]/70"
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
            <Button className="mt-4" onClick={handleReleaseAll} disabled={loadingMs === -1}>{loadingMs === -1 ? "Releasing..." : "Release"}</Button>
          )}
        </div>
      )}
    </div>
  );
}

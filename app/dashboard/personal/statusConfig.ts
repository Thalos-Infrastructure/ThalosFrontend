export const statusConfig: Record<string, { labelKey: string; color: string }> = {
  funded: { labelKey: "status.funded", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  in_progress: { labelKey: "status.inProgress", color: "bg-[#f0b400]/10 text-[#f0b400] border-[#f0b400]/20" },
  awaiting: { labelKey: "status.awaitingApproval", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  released: { labelKey: "status.released", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

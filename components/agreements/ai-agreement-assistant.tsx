"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Sparkles, ChevronRight } from "lucide-react";

interface AgreementDraft {
  title: string;
  description: string;
  amount: string;
  asset: "USDC";
  agreement_type: "single" | "multi";
  milestones: { description: string; amount: string; status: "pending" }[];
  metadata: { generatedByAI: true; riskFlags: string[]; useCase?: string };
}

interface AIAgreementAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onUseDraft: (draft: AgreementDraft) => void;
  useCases?: Array<{ id: string; suggestedTitle: string; suggestedDesc: string }>;
}

export function AIAgreementAssistant({
  isOpen,
  onClose,
  onUseDraft,
  useCases = [],
}: AIAgreementAssistantProps) {
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<AgreementDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!userInput.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/agreement-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput,
          useCases,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate draft");
      }

      const data = await response.json();
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseDraft = () => {
    if (draft) {
      onUseDraft(draft);
      onClose();
      setUserInput("");
      setDraft(null);
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#f0b400]" />
            AI Agreement Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!draft ? (
            <>
              <p className="text-sm text-muted-foreground">
                Describe the agreement you want to create in plain language, and I'll help you structure it.
              </p>
              <Textarea
                placeholder="e.g., I need an agreement for a website redesign with a total budget of $2,500, half upfront and half on completion..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="min-h-[120px]"
              />
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Proposed Title</h3>
                      <p className="text-lg">{draft.title}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Description</h3>
                      <p className="text-sm">{draft.description}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Amount</h3>
                      <p className="text-lg font-bold">{draft.amount} {draft.asset}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground">Milestones</h3>
                      <ul className="space-y-2 mt-2">
                        {draft.milestones.map((milestone, idx) => (
                          <li key={idx} className="flex justify-between items-center p-2 bg-muted rounded-md">
                            <span className="text-sm">{milestone.description}</span>
                            <span className="font-semibold">{milestone.amount} {draft.asset}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {draft.metadata.riskFlags.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">Risk Flags</h3>
                        <ul className="space-y-1">
                          {draft.metadata.riskFlags.map((flag, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                              <AlertCircle className="h-4 w-4" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {!draft ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !userInput.trim()}
              className="bg-[#f0b400] hover:bg-[#f0b400]/90 text-black"
            >
              {isGenerating ? "Generating..." : "Generate Draft"}
            </Button>
          ) : (
            <Button
              onClick={handleUseDraft}
              className="bg-[#f0b400] hover:bg-[#f0b400]/90 text-black flex items-center gap-2"
            >
              Use This Draft
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

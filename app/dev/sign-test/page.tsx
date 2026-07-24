import { TestSignMessage } from "@/components/test-sign-message";

export default function DevSignTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">Debug: Sign Message Test</h1>
      <TestSignMessage />
    </div>
  );
}
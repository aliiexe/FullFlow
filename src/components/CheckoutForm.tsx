import dynamic from "next/dynamic";
import { useState } from "react";
import { useUser } from "@clerk/nextjs"; // Use the client hook

interface CheckoutFormProps {
  selectedServices: string[];
}

const PayPalButtonsContainer = dynamic(
  () => import("./PayPalButtonsContainer"),
  { ssr: false }
);

export default function CheckoutForm({ selectedServices }: CheckoutFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser(); // Get the client-side user

  if (!user) {
    return (
      <div className="text-red-500">You must be signed in to checkout.</div>
    );
  }

  return (
    <div>
      {/* Your form elements */}
      <PayPalButtonsContainer
        selectedServices={selectedServices}
        totalPrice={150}
        user={user}
        setIsLoading={setIsLoading}
        setError={setError}
      />
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {isLoading && <div className="mt-2">Processing payment...</div>}
    </div>
  );
}

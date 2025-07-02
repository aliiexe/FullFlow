import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import the PayPalButtonsContainer with SSR disabled
const PayPalButtonsContainer = dynamic(
  () => import("./PayPalButtonsContainer"),
  { ssr: false }
);

// Your checkout form component
export default function CheckoutForm({ user, selectedServices }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

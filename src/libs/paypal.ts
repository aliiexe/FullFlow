export async function getPayPalAccessToken() {
    const authResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error("[DEBUG] PayPal auth error:", errorText);
        throw new Error(`PayPal auth failed: ${errorText}`);
    }

    const { access_token } = await authResponse.json();
    return access_token;
}

export async function getOrderDetails(orderId: string, accessToken: string) {
    const orderDetailsResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!orderDetailsResponse.ok) {
        const errorText = await orderDetailsResponse.text();
        console.error("[DEBUG] PayPal order details error:", errorText);
        throw new Error(`Failed to get order details: ${errorText}`);
    }

    return orderDetailsResponse.json();
}

export async function capturePayPalOrder(orderId: string, accessToken: string) {
    const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!captureResponse.ok) {
        const errorText = await captureResponse.text();
        console.error("[DEBUG] PayPal capture error:", errorText);
        throw new Error(`PayPal capture failed: ${errorText}`);
    }

    return captureResponse.json();
} 
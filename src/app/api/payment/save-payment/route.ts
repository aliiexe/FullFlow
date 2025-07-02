import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const paymentData = await request.json();

        console.log("Saving payment data:", paymentData);

        // Extract payment details
        const {
            orderId,
            captureId,
            amount,
            currency,
            customerEmail,
            customerName,
            selectedServices,
            isSubscription,
            clerkId
        } = paymentData;

        // Validate required fields
        if (!orderId || !amount || !customerEmail) {
            return NextResponse.json(
                { error: "Missing required payment data" },
                { status: 400 }
            );
        }

        // TODO: Save to your database here
        // This is where you would save the payment to your database
        // For now, we'll just log it and return success

        const paymentRecord = {
            payment_id: captureId || orderId,
            order_id: orderId,
            amount: parseFloat(amount),
            currency: currency || "USD",
            customer_email: customerEmail,
            customer_name: customerName || "",
            payment_type: isSubscription ? "subscription" : "one_time",
            payment_status: "completed",
            selected_services: selectedServices || [],
            clerk_id: clerkId || "",
            payment_date: new Date().toISOString(),
            payment_processor: "paypal"
        };

        console.log("Payment record to save:", paymentRecord);

        // TODO: Replace this with actual database save
        // Example: await db.payments.create(paymentRecord);

        return NextResponse.json({
            success: true,
            message: "Payment saved successfully",
            payment_id: paymentRecord.payment_id
        });

    } catch (error) {
        console.error("Error saving payment:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save payment" },
            { status: 500 }
        );
    }
} 
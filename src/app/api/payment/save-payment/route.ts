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
            clerkId,
            subscriptionId
        } = paymentData;
        
        // Validate required fields
        if (!orderId || !amount || !customerEmail) {
            return NextResponse.json(
                { error: "Missing required payment data" },
                { status: 400 }
            );
        }
        
        // Validate clerk_id is present and not a placeholder
        if (!clerkId || clerkId === 'user' || clerkId === '') {
            console.error('🔍 PAYMENT HANDLER ERROR: Invalid or missing clerk_id:', clerkId);
            return NextResponse.json(
                { error: "Invalid or missing clerk_id. Please ensure user is authenticated." },
                { status: 400 }
            );
        }
        
        // Determine which payment type to process
        if (isSubscription) {
            console.log('🔍 PAYMENT HANDLER: Processing subscription payment');
            
            // Handle subscription payment
            if (!subscriptionId) {
                console.error('🔍 PAYMENT HANDLER ERROR: Missing subscriptionId in payment data');
                return NextResponse.json(
                    { error: 'Missing subscriptionId in payment data' },
                    { status: 400 }
                );
            }
            
            if (!subscriptionId) {
                console.error('🔍 PAYMENT HANDLER ERROR: Missing subscriptionId in payment data');
                return NextResponse.json(
                    { error: 'Missing subscriptionId in payment data' },
                    { status: 400 }
                );
            }
            
            const subscriptionPaymentData = {
                clerk_id: clerkId || '',
                email: customerEmail,
                fullname: customerName || '',
                amount: parseFloat(amount),
                payment_method: 'PayPal',
                status: 'paid',
                transaction_id: captureId || orderId,
                subscription_id: subscriptionId
            };
            
            console.log('🔍 PAYMENT HANDLER: Subscription payment data:', subscriptionPaymentData);
            
            const subscriptionApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/payments/subscription`;
            console.log('🔍 PAYMENT HANDLER: Making API request to:', subscriptionApiUrl);
            
            try {
                console.log('🔍 PAYMENT HANDLER: Sending subscription payment data...');
                const response = await fetch(subscriptionApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(subscriptionPaymentData),
                });
                
                console.log('🔍 PAYMENT HANDLER: API response status:', response.status);
                console.log('🔍 PAYMENT HANDLER: API response status text:', response.statusText);
                
                // Log response headers
                const responseHeaders = Object.fromEntries(response.headers.entries());
                console.log('🔍 PAYMENT HANDLER: API response headers:', responseHeaders);
                
                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('🔍 PAYMENT HANDLER ERROR: API error response:', errorData);
                    return NextResponse.json(
                        { error: `API error: ${response.status} ${response.statusText} - ${errorData}` },
                        { status: 500 }
                    );
                }
                
                const responseData = await response.json();
                console.log('🔍 PAYMENT HANDLER SUCCESS: API response data:', responseData);
                
                return NextResponse.json({
                    success: true,
                    message: "Subscription payment saved successfully",
                    payment_id: captureId || orderId,
                    data: responseData
                });
                
            } catch (error) {
                console.error('🔍 PAYMENT HANDLER ERROR: Failed to send subscription payment data:', error);
                console.error('🔍 PAYMENT HANDLER ERROR: Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
                return NextResponse.json(
                    { error: 'Failed to process subscription payment' },
                    { status: 500 }
                );
            }
            
        } else {
            console.log('🔍 PAYMENT HANDLER: Processing one-time payment for deliverables');
            
            // Handle one-time payment for deliverables
            if (!selectedServices || selectedServices.length === 0) {
                console.error('🔍 PAYMENT HANDLER ERROR: Missing selectedServices in payment data');
                return NextResponse.json(
                    { error: 'Missing selectedServices in payment data' },
                    { status: 400 }
                );
            }
            
            let deliverableIds: string[];
            try {
                console.log('🔍 PAYMENT HANDLER: Processing selectedServices:', selectedServices);
                // If selectedServices is already an array, use it directly
                // If it's a JSON string, parse it
                if (typeof selectedServices === 'string') {
                    deliverableIds = JSON.parse(selectedServices);
                } else {
                    deliverableIds = selectedServices;
                }
                console.log('🔍 PAYMENT HANDLER: Parsed deliverable IDs:', deliverableIds);
            } catch (e) {
                console.error('🔍 PAYMENT HANDLER ERROR: Failed to parse selectedServices:', e);
                return NextResponse.json(
                    { error: `Failed to parse selectedServices: ${e}` },
                    { status: 400 }
                );
            }
            
            const deliverablePaymentData = {
                clerk_id: clerkId || '',
                email: customerEmail,
                fullname: customerName || '',
                payment_method: 'PayPal',
                status: 'paid',
                transaction_id: captureId || orderId,
                deliverable_ids: deliverableIds
            };
            
            console.log('🔍 PAYMENT HANDLER: Deliverable payment data:', deliverablePaymentData);
            
            const deliverableApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/payments/deliverables`;
            console.log('🔍 PAYMENT HANDLER: Making API request to:', deliverableApiUrl);
            
            try {
                console.log('🔍 PAYMENT HANDLER: Sending deliverable payment data...');
                const response = await fetch(deliverableApiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(deliverablePaymentData),
                });
                
                console.log('🔍 PAYMENT HANDLER: API response status:', response.status);
                console.log('🔍 PAYMENT HANDLER: API response status text:', response.statusText);
                
                // Log response headers
                const responseHeaders = Object.fromEntries(response.headers.entries());
                console.log('🔍 PAYMENT HANDLER: API response headers:', responseHeaders);
                
                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('🔍 PAYMENT HANDLER ERROR: API error response:', errorData);
                    return NextResponse.json(
                        { error: `API error: ${response.status} ${response.statusText} - ${errorData}` },
                        { status: 500 }
                    );
                }
                
                const responseData = await response.json();
                console.log('🔍 PAYMENT HANDLER SUCCESS: API response data:', responseData);
                
                return NextResponse.json({
                    success: true,
                    message: "Deliverable payment saved successfully",
                    payment_id: captureId || orderId,
                    data: responseData
                });
                
            } catch (error) {
                console.error('🔍 PAYMENT HANDLER ERROR: Failed to send deliverable payment data:', error);
                console.error('🔍 PAYMENT HANDLER ERROR: Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
                return NextResponse.json(
                    { error: 'Failed to process deliverable payment' },
                    { status: 500 }
                );
            }
        }
        
    } catch (error) {
        console.error("Error saving payment:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save payment" },
            { status: 500 }
        );
    }
}
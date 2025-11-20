import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customer_email: string;
  customer_name: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeSecret) {
      return new Response(
        JSON.stringify({
          error: "Stripe not configured. Please set STRIPE_SECRET_KEY."
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-11-20.acacia",
    });

    const { amount, currency, description, customer_email, customer_name }: PaymentRequest = await req.json();

    if (!amount || !currency || !customer_email) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: amount, currency, customer_email"
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      description: description || "Compra na Shopee",
      receipt_email: customer_email,
      metadata: {
        customer_name: customer_name || "",
        customer_email: customer_email,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Payment Intent Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to create payment intent",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
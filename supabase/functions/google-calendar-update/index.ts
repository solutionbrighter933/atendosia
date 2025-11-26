import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { calendar_id, calendar_name } = await req.json();

    if (!calendar_id) {
      return new Response(
        JSON.stringify({ error: "calendar_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📅 Atualizando calendário selecionado para: ${calendar_id}`);

    // Atualizar integração com o novo calendário selecionado
    const { error: updateError } = await supabaseClient
      .from("google_calendar_integrations")
      .update({
        primary_calendar_id: calendar_id,
        calendar_name: calendar_name || calendar_id,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (updateError) {
      console.error("❌ Erro ao atualizar calendário:", updateError);
      throw new Error("Failed to update calendar selection");
    }

    console.log("✅ Calendário atualizado com sucesso!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Calendar updated successfully",
        calendar_id,
        calendar_name,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Google Calendar Update Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

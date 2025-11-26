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

    // Buscar integração do usuário
    const { data: integration, error: integrationError } = await supabaseClient
      .from("google_calendar_integrations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: "Google Calendar not connected" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("📋 Buscando lista de calendários do usuário...");

    // Buscar lista de calendários do Google
    const calendarListResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
        },
      }
    );

    if (!calendarListResponse.ok) {
      const errorData = await calendarListResponse.json();
      console.error("❌ Erro ao buscar calendários:", errorData);

      // Se o token expirou, retornar 401 para forçar reconexão
      if (calendarListResponse.status === 401) {
        return new Response(
          JSON.stringify({
            error: "Token expired",
            message: "Por favor, reconecte sua conta do Google Calendar",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error("Failed to fetch calendar list from Google");
    }

    const calendarListData = await calendarListResponse.json();

    const totalCalendars = calendarListData.items ? calendarListData.items.length : 0;
    console.log(`✅ ${totalCalendars} calendários encontrados`);

    // Formatar lista de calendários
    const calendars = (calendarListData.items || []).map((cal: any) => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description || null,
      primary: cal.primary || false,
      accessRole: cal.accessRole,
      backgroundColor: cal.backgroundColor,
      foregroundColor: cal.foregroundColor,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        calendars,
        current_calendar_id: integration.primary_calendar_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Google Calendar List Error:", error);
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

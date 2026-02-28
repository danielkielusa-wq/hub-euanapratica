import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdminOrAssistant, getCorsHeaders } from "../_shared/authGuard.ts";
import { getApiConfig } from "../_shared/apiConfigService.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    // Admin or Assistant
    const authError = await requireAdminOrAssistant(req);
    if (authError) return authError;

    const config = await getApiConfig("evolution_api");

    if (!config.is_active) {
      return new Response(
        JSON.stringify({
          connected: false,
          error: "Evolution API está desativada. Ative nas configurações de APIs.",
        }),
        { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = config.base_url;
    const apiKey = config.credentials.api_key;
    const instanceName = config.parameters?.instance_name || "enp_hub";

    if (!baseUrl || !apiKey) {
      return new Response(
        JSON.stringify({
          connected: false,
          error: "Evolution API não configurada (falta base_url ou api_key)",
        }),
        { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // Check connection state
    const stateResponse = await fetch(
      `${baseUrl}/instance/connectionState/${instanceName}`,
      { headers: { apikey: apiKey } }
    );

    if (!stateResponse.ok) {
      const errorText = await stateResponse.text();
      console.error(`[check-whatsapp] Connection state error: ${stateResponse.status}`, errorText);
      return new Response(
        JSON.stringify({
          connected: false,
          error: `Erro ao verificar estado: HTTP ${stateResponse.status}`,
          instance: instanceName,
        }),
        { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const stateData = await stateResponse.json();
    const state = stateData?.instance?.state || stateData?.state || "unknown";
    const connected = state === "open" || state === "connected";

    console.log(`[check-whatsapp] Instance ${instanceName} state: ${state}`);

    // If disconnected, try to get QR code
    let qrCode: string | null = null;
    if (!connected) {
      try {
        const qrResponse = await fetch(
          `${baseUrl}/instance/connect/${instanceName}`,
          { headers: { apikey: apiKey } }
        );

        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          qrCode = qrData?.base64 || qrData?.qrcode || null;
        }
      } catch (qrErr) {
        console.warn("[check-whatsapp] Failed to fetch QR code:", qrErr);
      }
    }

    return new Response(
      JSON.stringify({
        connected,
        state,
        instance: instanceName,
        qrCode,
      }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[check-whatsapp] Error:", err);
    return new Response(
      JSON.stringify({
        connected: false,
        error: err instanceof Error ? err.message : "Internal error",
      }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
});

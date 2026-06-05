const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { fileBase64, mimeType } = await req.json();

    if (!fileBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: "fileBase64 and mimeType are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPdf = mimeType === "application/pdf";

    // Build the content array for the message
    const contentArray: unknown[] = [];

    if (isPdf) {
      contentArray.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: fileBase64,
        },
      });
    } else {
      contentArray.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType,
          data: fileBase64,
        },
      });
    }

    contentArray.push({
      type: "text",
      text: `Analysiere dieses Dokument (Dienstanweisung, Sperrung oder Umleitung für Busfahrer) und extrahiere folgende Informationen als JSON.

Gib NUR valides JSON zurück, KEIN Markdown, KEINE Erklärungen, KEINE Codeblöcke.

JSON-Schema:
{
  "titel": "Kurzer Titel max. 60 Zeichen",
  "linien_fahrten": [
    {
      "linie": "715",
      "fahrten": ["014", "016", "024"]
    }
  ],
  "valid_from": "2024-01-15T00:00:00" oder null,
  "valid_until": "2024-01-20T23:59:00" oder null,
  "summary": "2-4 Sätze Zusammenfassung für den Busfahrer: Umleitungsinfos, gesperrte Haltestellen, besondere Hinweise."
}

Hinweise:
- "linie" ist die Liniennummer (z.B. "715", "725", "736")
- "fahrten" sind die letzten 3 Stellen der Fahrt-Nummern (z.B. ["014","016"]). Wenn ALLE Fahrten einer Linie betroffen sind, setze fahrten auf null oder leeres Array.
- Datumsangaben im ISO 8601 Format (ohne Zeitzone-Suffix wenn nicht angegeben)
- Wenn kein Datum erkennbar: null
- summary auf Deutsch, präzise und praktisch für den Fahrer`,
    });

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: contentArray,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      return new Response(JSON.stringify({ error: `Anthropic API error: ${anthropicResponse.status} ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicData = await anthropicResponse.json();
    const rawText = anthropicData?.content?.[0]?.text || "";

    // Parse the JSON response - strip any accidental markdown
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Failed to parse AI response as JSON", raw: rawText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

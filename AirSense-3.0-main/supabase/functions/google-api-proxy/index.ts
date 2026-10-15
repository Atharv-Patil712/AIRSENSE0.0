const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_KEY = Deno.env.get("GOOGLE_API_KEY");

interface ProxyRequestBody {
  endpoint: string;
  params?: Record<string, string>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (!API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "GOOGLE_API_KEY is not configured. Add it as an edge function secret named GOOGLE_API_KEY.",
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const body: ProxyRequestBody = await req.json();
    const { endpoint, params } = body;

    if (!endpoint || typeof endpoint !== "string") {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid 'endpoint' in request body.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const allowedPrefixes = [
      "https://maps.googleapis.com/maps/api/",
      "https://airquality.googleapis.com/v1/",
      "https://geocoding.googleapis.com/",
      "https://reversegeocoder.googleapis.com/",
    ];

    const matchedPrefix = allowedPrefixes.find((p) =>
      endpoint.startsWith(p)
    );

    if (!matchedPrefix) {
      return new Response(
        JSON.stringify({
          error:
            "Endpoint not allowed. Only Google Maps, Air Quality, and Geocoding APIs are permitted.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const url = new URL(endpoint);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    url.searchParams.set("key", API_KEY);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let errorBody: unknown = null;

      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Google API quota exceeded. Try again later.",
            details: errorBody,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      if (response.status === 403) {
        return new Response(
          JSON.stringify({
            error:
              "Google API access denied. Check that the API is enabled and the key has the right restrictions.",
            details: errorBody,
          }),
          {
            status: 403,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          error: `Google API returned status ${response.status}.`,
          details: errorBody,
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Request to Google API failed.",
        details:
          err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
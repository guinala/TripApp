import { createClient } from "@supabase/supabase-js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") {
    return new Response("{}", { status: 405, headers });
  }
  const authorization = req.headers.get("Authorization");
  if (!authorization) return new Response("{}", { status: 401, headers });
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return new Response("{}", { status: 401, headers });
  const result = await client.rpc("request_account_deletion");

  if (result.error) {
    return new Response(JSON.stringify({ error: "DELETE_REQUEST_FAILED" }), {
      status: 500,
      headers,
    });
  }

  // Worker elimina Storage y luego Auth.
  return new Response(JSON.stringify({ status: "pending" }), {
    status: 202,
    headers,
  });
});

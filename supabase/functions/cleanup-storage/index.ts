import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Drena siempre la primera página, sin saltar archivos al borrar.
async function drain(
  admin: SupabaseClient,
  bucket: string,
  prefix: string,
  budget: { left: number },
): Promise<boolean> {
  if (budget.left <= 0) return false;
  budget.left--;
  const { data, error } = await admin.storage
    .from(bucket)
    .list(prefix, {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });
  if (error) throw error;
  const entries = data ?? [];
  if (!entries.length) return true;
  const files = entries.filter((entry) => entry.id).map((entry) =>
    `${prefix}/${entry.name}`
  );
  if (files.length) {
    const removed = await admin.storage.from(bucket).remove(files);
    if (removed.error) throw removed.error;
  }
  for (const dir of entries.filter((entry) => !entry.id)) {
    if (!(await drain(admin, bucket, `${prefix}/${dir.name}`, budget))) {
      return false;
    }
  }

  return drain(admin, bucket, prefix, budget);
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("STORAGE_CLEANUP_SECRET");
  if (req.method !== "POST") return new Response("", { status: 405 });
  if (!secret || req.headers.get("x-cleanup-secret") !== secret) {
    return new Response("", { status: 401 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  let failed = 0;
  const now = new Date().toISOString();
  const jobs = await admin
    .from("storage_delete_jobs")
    .select("*")
    .lte("next_attempt_at", now)
    .order("created_at")
    .limit(50);

  if (jobs.error) return new Response("QUEUE_READ_FAILED", { status: 500 });

  for (const job of jobs.data ?? []) {
    try {
      const result = await admin.storage.from(job.bucket).remove([job.path]);
      if (result.error) throw result.error;
      const done = await admin.from("storage_delete_jobs").delete().eq(
        "id",
        job.id,
      );
      if (done.error) throw done.error;
    } catch {
      failed++;
      const retry = await admin
        .from("storage_delete_jobs")
        .update({
          attempts: job.attempts + 1,
          last_error: "STORAGE_DELETE_FAILED",
          next_attempt_at: new Date(
            Date.now() +
              Math.min(3600, 30 * 2 ** Math.min(job.attempts, 7)) * 1000,
          ).toISOString(),
        })
        .eq("id", job.id);
      if (retry.error) {
        return new Response("QUEUE_WRITE_FAILED", { status: 500 });
      }
    }
  }

  const accounts = await admin
    .from("account_delete_jobs")
    .select("*")
    .lte("next_attempt_at", now)
    .order("created_at")
    .limit(1);

  if (accounts.error) {
    return new Response("ACCOUNT_QUEUE_READ_FAILED", { status: 500 });
  }

  for (const job of accounts.data ?? []) {
    try {
      const budget = { left: 20 };
      if (!(await drain(admin, "trip-photos", job.user_id, budget))) continue;
      if (!(await drain(admin, "trip-covers", job.user_id, budget))) continue;
      const avatar = await admin.storage
        .from("user-avatars")
        .remove([`avatars/${job.user_id}.jpg`]);
      if (avatar.error) throw avatar.error;
      const purged = await admin.rpc("purge_account_rows", {
        p_user_id: job.user_id,
      });
      if (purged.error) throw purged.error;

      const auth = await admin.auth.admin.getUserById(job.user_id);

      if (auth.error && auth.error.code !== "user_not_found") throw auth.error;
      if (auth.data.user) {
        const deleted = await admin.auth.admin.deleteUser(job.user_id);
        if (deleted.error) throw deleted.error;
      }

      const profile = await admin.from("profiles").delete().eq(
        "id",
        job.user_id,
      );

      if (profile.error) throw profile.error;

      const done = await admin.from("account_delete_jobs").delete().eq(
        "user_id",
        job.user_id,
      );

      if (done.error) throw done.error;
    } catch {
      failed++;
      const retry = await admin
        .from("account_delete_jobs")
        .update({
          attempts: job.attempts + 1,
          last_error: "ACCOUNT_DELETE_FAILED",
          next_attempt_at: new Date(Date.now() + 60_000).toISOString(),
        })
        .eq("user_id", job.user_id);
      if (retry.error) {
        return new Response("ACCOUNT_QUEUE_WRITE_FAILED", { status: 500 });
      }
    }
  }
  return Response.json({ failed });
});

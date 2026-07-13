import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Borra recursivamente un prefijo del bucket (list no es recursivo) */
async function removeFolder(admin: SupabaseClient, bucket: string, prefix: string) {
  const { data: entries } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (!entries || entries.length === 0) return;

  const files: string[] = [];
  for (const entry of entries) {
    if (entry.id) files.push(`${prefix}/${entry.name}`);
    else await removeFolder(admin, bucket, `${prefix}/${entry.name}`);
  }
  if (files.length > 0) await admin.storage.from(bucket).remove(files);
}

Deno.serve(async (req) => {
  try {
    // 1. Identificar al llamante con SU token 
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401 });

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return new Response('Unauthorized', { status: 401 });

    // 2. Cliente admin con service_role 
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 3. Storage primero
    await admin.storage.from('user-avatars').remove([`avatars/${user.id}.jpg`]);
    await removeFolder(admin, 'trip-photos', user.id);

    // 4. Borrar el usuario 
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
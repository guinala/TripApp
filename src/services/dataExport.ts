import { supabase } from "@/services/supabase";
import { accountOwner, accountVersion, assertAccount } from "./account-session";

export async function exportUserData(userId: string) {
  const started = accountVersion();
  assertAccount(started);
  if (userId !== accountOwner()) throw new Error("SESSION_CHANGED");
  const { data, error } = await supabase.rpc("export_my_data");
  assertAccount(started);

  if (error) throw error;

  if (
    !data || typeof data !== "object" || Array.isArray(data) || !data.profile
  ) {
    throw new Error("INCOMPLETE_EXPORT");
  }

  if (JSON.stringify(data).length > 20_000_000) {
    throw new Error("EXPORT_TOO_LARGE");
  }

  return data;
}

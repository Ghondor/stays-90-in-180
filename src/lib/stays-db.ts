import { supabase } from "./supabase";
import type { Stay } from "./rule90-180";

interface StayRow {
  id: string;
  user_id: string;
  country: string;
  entry_date: string;
  exit_date: string;
  created_at: string;
}

function rowToStay(row: StayRow): Stay {
  return {
    id: row.id,
    country: row.country,
    entryDate: row.entry_date,
    exitDate: row.exit_date,
  };
}

/**
 * Fetch all stays for the given user, ordered by entry_date ascending.
 */
export async function fetchStays(userId: string): Promise<Stay[]> {
  const { data, error } = await supabase
    .from("stays")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as StayRow[]).map(rowToStay);
}

/**
 * Insert a single stay for the given user. Returns the created Stay.
 */
export async function insertStay(
  userId: string,
  stay: Omit<Stay, "id">
): Promise<Stay> {
  const { data, error } = await supabase
    .from("stays")
    .insert({
      user_id: userId,
      country: stay.country,
      entry_date: stay.entryDate,
      exit_date: stay.exitDate,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToStay(data as StayRow);
}

/**
 * Delete a stay by its id.
 */
export async function deleteStay(stayId: string): Promise<void> {
  const { error } = await supabase.from("stays").delete().eq("id", stayId);
  if (error) throw new Error(error.message);
}

/**
 * Update an existing stay. Returns the updated Stay.
 */
export async function updateStay(
  stayId: string,
  fields: Partial<Omit<Stay, "id">>
): Promise<Stay> {
  const update: Record<string, string> = {};
  if (fields.country !== undefined) update.country = fields.country;
  if (fields.entryDate !== undefined) update.entry_date = fields.entryDate;
  if (fields.exitDate !== undefined) update.exit_date = fields.exitDate;

  const { data, error } = await supabase
    .from("stays")
    .update(update)
    .eq("id", stayId)
    .select();

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error(
      "Update failed — no rows returned. Please ensure the UPDATE RLS policy exists on the stays table."
    );
  }
  return rowToStay(data[0] as StayRow);
}

/**
 * Bulk insert stays (e.g. from CSV import). Returns the created stays.
 */
export async function bulkInsertStays(
  userId: string,
  stays: Omit<Stay, "id">[]
): Promise<Stay[]> {
  if (stays.length === 0) return [];
  const rows = stays.map((s) => ({
    user_id: userId,
    country: s.country,
    entry_date: s.entryDate,
    exit_date: s.exitDate,
  }));

  const { data, error } = await supabase.from("stays").insert(rows).select();
  if (error) throw new Error(error.message);
  return (data as StayRow[]).map(rowToStay);
}

import { supabase } from "@/services/supabase";
import type { Database } from "@/types/database";
import type {
    Continent,
    DestinationType,
    EditorialDestination,
} from "@/types/destination";
import type { PlaceLanguage } from "@/types/place";

type Row = Database["public"]["Tables"]["explore_destinations"]["Row"];

function map(row: Row, language: PlaceLanguage): EditorialDestination {
    const english = language === "en" && !!row.description_en?.trim();
    return {
        id: row.id,
        placeId: row.place_id,
        name: row.name,
        country: row.country,
        countryCode: row.country_code,
        continent: row.continent as Continent,
        types: row.types as DestinationType[],
        description: english ? row.description_en! : row.description_es,
        descriptionLanguage: english ? "en" : "es",
        coverQuery: row.cover_query,
        featured: row.featured,
        sortOrder: row.sort_order,
    };
}

export async function listEditorialDestinations(
    language: PlaceLanguage,
): Promise<EditorialDestination[]> {
    const { data, error } = await supabase
        .from("explore_destinations")
        .select("*")
        .eq("published", true)
        .order("sort_order")
        .order("id");
    if (error) throw error;
    return (data ?? []).map((row) => map(row, language));
}

export async function getEditorialDestination(
    id: string,
    language: PlaceLanguage,
): Promise<EditorialDestination | null> {
    const { data, error } = await supabase
        .from("explore_destinations")
        .select("*")
        .eq("id", id)
        .eq("published", true)
        .maybeSingle();
    if (error) throw error;
    return data ? map(data, language) : null;
}

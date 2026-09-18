import { format } from "date-fns";
import type { Trip } from "@/types/trip";

export function tripStatus(
    start: string,
    end: string,
    today = format(new Date(), "yyyy-MM-dd"),
): Trip["status"] {
    return today < start ? "planned" : today > end ? "completed" : "active";
}

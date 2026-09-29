import { isCity } from "./place-kind";

export function initialPhotoProvider(
    types: string[],
): "unsplash" | "google" {
    if (
        types.includes("establishment") ||
        types.includes("point_of_interest")
    ) {
        return "google";
    }

    return isCity(types) || types.includes("country") ? "unsplash" : "google";
}

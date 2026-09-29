import type { PlacePhoto } from "@/types/place-photo";
import type { PlaceLanguage } from "@/types/place";
import { placeSessionVersion, subscribePlaceSession } from "./place-session";

type Handoff = {
    placeId: string;
    languageCode: PlaceLanguage;
    epoch: number;
    photo: PlacePhoto;
};

let current: Handoff | null = null;
let expiry: ReturnType<typeof setTimeout> | undefined;

export function clearPhotoHandoff(placeId?: string) {
    if (placeId && current?.placeId !== placeId) return;

    current = null;
    clearTimeout(expiry);
    expiry = undefined;
}

export function rememberPhotoForNavigation(
    placeId: string,
    languageCode: PlaceLanguage,
    photo: PlacePhoto | null,
) {
    clearPhotoHandoff();

    if (!photo) return;

    current = {
        placeId,
        languageCode,
        epoch: placeSessionVersion(),
        photo,
    };

    expiry = setTimeout(() => clearPhotoHandoff(), 60_000);
}

export function readPhotoForNavigation(
    placeId: string,
    languageCode: PlaceLanguage,
    size: "card" | "hero",
): PlacePhoto | null {
    if (
        !current ||
        current.placeId !== placeId ||
        current.languageCode !== languageCode ||
        current.epoch !== placeSessionVersion()
    ) {
        return null;
    }

    const photo = current.photo;

    return photo.provider === "unsplash"
        ? {
            ...photo,
            uri: size === "hero" ? photo.heroUri : photo.smallUri,
        }
        : photo;
}

subscribePlaceSession(() => clearPhotoHandoff());

import type { LatLng } from "../types/place.ts";

export type PhotoScope = {
    kind: "city" | "country" | "other";
    name: string;
    center: LatLng | null;
    countryNames: string[];
};

function normalize(value: unknown): string {
    return typeof value === "string"
        ? value
            .normalize("NFD")
            .replace(/\p{M}/gu, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim()
        : "";
}

function object(
    value: unknown,
): Record<string, unknown> | null {
    return value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function distanceMeters(a: LatLng, b: LatLng): number {
    const radians = (value: number) => value * Math.PI / 180;
    const dLat = radians(b.lat - a.lat);
    const dLng = radians(b.lng - a.lng);

    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(radians(a.lat)) *
            Math.cos(radians(b.lat)) *
            Math.sin(dLng / 2) ** 2;

    return 6_371_000 * 2 * Math.asin(
        Math.sqrt(Math.min(1, Math.max(0, h))),
    );
}

export function matchesPhotoGeography(
    value: unknown,
    scope: PhotoScope,
): boolean {
    if (scope.kind === "other") return false;

    const root = object(value);
    const location = object(root?.location);
    const country = normalize(location?.country);

    const countries = scope.countryNames
        .map(normalize)
        .filter(Boolean);

    if (!country || !countries.includes(country)) {
        return false;
    }

    if (scope.kind === "country") return true;

    if (
        !scope.center ||
        !normalize(scope.name) ||
        normalize(location?.city) !== normalize(scope.name)
    ) {
        return false;
    }

    const position = object(location?.position);
    const lat = position?.latitude;
    const lng = position?.longitude;

    if (
        typeof lat !== "number" ||
        !Number.isFinite(lat) ||
        Math.abs(lat) > 90 ||
        typeof lng !== "number" ||
        !Number.isFinite(lng) ||
        Math.abs(lng) > 180
    ) {
        return false;
    }

    return distanceMeters(
        scope.center,
        { lat, lng },
    ) <= 30_000;
}

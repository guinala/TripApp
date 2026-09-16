import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
    const plugins = config.plugins ?? [];
    const maps = plugins.find(
        (plugin) =>
            (typeof plugin === "string" ? plugin : plugin[0]) ===
                "react-native-maps",
    );
    const previousOptions = Array.isArray(maps) ? (maps[1] ?? {}) : {};
    const androidKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ??
        config.android?.config?.googleMaps?.apiKey;
    const iosKey = process.env.GOOGLE_MAPS_IOS_API_KEY;
    return {
        ...config,
        name: config.name ?? "TripMate",
        slug: config.slug ?? "tripmate",
        plugins: [
            ...plugins.filter(
                (plugin) =>
                    (typeof plugin === "string" ? plugin : plugin[0]) !==
                        "react-native-maps",
            ),
            [
                "react-native-maps",
                {
                    ...previousOptions,
                    ...(androidKey
                        ? { androidGoogleMapsApiKey: androidKey }
                        : {}),
                    ...(iosKey ? { iosGoogleMapsApiKey: iosKey } : {}),
                },
            ],
        ],
    };
};

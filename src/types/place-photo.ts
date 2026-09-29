import type { PhotoCredit } from "./explore.ts";

export type PlacePhoto =
  | {
    provider: "unsplash";
    uri: string;
    smallUri: string;
    heroUri: string;
    credits: PhotoCredit[];
    photoId: string;
  }
  | {
    provider: "google";
    uri: string;
    credits: PhotoCredit[];
  };

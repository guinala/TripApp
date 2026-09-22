import type { PhotoCredit } from './explore.ts';

export type PlacePhoto =
  | {
      provider: 'unsplash';
      uri: string;
      credits: PhotoCredit[];
      photoId: string;
    }
  | {
      provider: 'google';
      uri: string;
      credits: PhotoCredit[];
    };

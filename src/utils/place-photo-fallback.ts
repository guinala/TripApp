export type PhotoImageFailureAction =
  | { kind: 'request_google'; load: 1 | 2 }
  | { kind: 'show_placeholder' };

export function photoImageFailureAction(
  provider: 'unsplash' | 'google',
  googleLoads: number,
): PhotoImageFailureAction {
  if (provider === 'unsplash') return { kind: 'request_google', load: 1 };
  if (googleLoads < 2) return { kind: 'request_google', load: 2 };
  return { kind: 'show_placeholder' };
}

export async function resolveInitialPhoto<U, G>(
  loadUnsplash: () => Promise<U | null>,
  loadGoogle: () => Promise<G | null>,
  isCancellation: (error: unknown) => boolean,
): Promise<
  | { provider: 'unsplash'; value: U }
  | { provider: 'google'; value: G | null }
> {
  try {
    const value = await loadUnsplash();
    if (value) return { provider: 'unsplash', value };
  } catch (error) {
    if (isCancellation(error)) throw error;
  }
  return { provider: 'google', value: await loadGoogle() };
}

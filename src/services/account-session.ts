let owner: string | null = null;
let version = 0;
let initialized = false;
const listeners = new Set<() => void>();

export const accountVersion = () => version;

export const accountOwner = () => owner;

export const isCurrentAccount = (started: number) =>
    owner !== null && started === version;

export function assertAccount(started: number) {
    if (!isCurrentAccount(started)) throw new Error("SESSION_CHANGED");
}

export function setAccountOwner(next: string | null) {
    if (initialized && owner === next) return;

    initialized = true;
    owner = next;
    version++;
    listeners.forEach((listener) => listener());
}

export function subscribeAccount(listener: () => void) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

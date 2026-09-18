export function parseAmount(input: string): number | null {
    const text = input.trim();

    if (!text || !/^[0-9.,]+$/.test(text)) return null;

    let normalized: string;

    if (text.includes(",") && text.includes(".")) {
        if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(text)) {
            normalized = text.replaceAll(".", "").replace(",", ".");
        } else if (/^\d{1,3}(,\d{3})+\.\d{1,2}$/.test(text)) {
            normalized = text.replaceAll(",", "");
        } else return null;
    } else {
        if (!/^\d+([.,]\d{1,2})?$/.test(text)) return null;
        normalized = text.replace(",", ".");
    }

    const value = Number(normalized);

    return Number.isFinite(value) && value >= 0 && value <= 1_000_000_000
        ? value
        : null;
}

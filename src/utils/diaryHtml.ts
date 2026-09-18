import { format, parseISO } from "date-fns";
import { enUS, es } from "date-fns/locale";
import type { DiaryDayGroup } from "@/hooks/use-diary-photos";

export type DiaryPdfMeta = {
    tripTitle: string;
    destination: string;
    startDate: string;
    endDate: string;
};

export function escapeHtml(text: string) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function buildDiaryHtml(
    meta: DiaryPdfMeta,
    groups: DiaryDayGroup[],
    images: Map<string, string>,
    language: string,
) {
    const spanish = language.startsWith("es");
    const locale = spanish ? es : enUS;
    const date = (value: string) =>
        format(parseISO(value), "d MMM yyyy", { locale });
    const sections = groups
        .map((group) => {
            const title = group.day
                ? `${spanish ? "Día" : "Day"} ${group.day.dayNumber} · ${
                    date(group.day.date)
                }`
                : spanish
                ? "Sin día asignado"
                : "Unassigned photos";
            return `<section><h2>${escapeHtml(title)}</h2>${
                group.photos
                    .map((photo) => {
                        const data = images.get(photo.id);
                        if (
                            !data ||
                            !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
                                .test(data)
                        ) {
                            throw new Error("PDF_IMAGE_MISSING");
                        }
                        return `<figure><img alt="" src="${data}"><figcaption>${
                            escapeHtml(photo.caption ?? "")
                        }</figcaption></figure>`;
                    })
                    .join("")
            }</section>`;
        })
        .join("");

    return `<!DOCTYPE html><html lang="${
        spanish ? "es" : "en"
    }"><head><meta charset="utf-8"><title>${escapeHtml(meta.tripTitle)}</title>
    <style>@page{margin:24pt}body{font:14px Arial,sans-serif;color:#1b2d4f}h1,h2{font-family:Georgia,serif}section{break-before:page}figure{margin:16px 0;break-inside:avoid}img{max-width:100%;max-height:570px;object-fit:contain}figcaption{color:#53627a;margin-top:8px}.cover{padding:80px 16px}</style></head>
    <body><header class="cover"><p>${
        spanish ? "DIARIO DE VIAJE" : "TRAVEL DIARY"
    }</p><h1>${escapeHtml(meta.tripTitle)}</h1>
    <p>${escapeHtml(meta.destination)}</p><p>${date(meta.startDate)} – ${
        date(meta.endDate)
    }</p></header>${sections}</body></html>`;
}

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DiaryDayGroup } from '@/hooks/use-diary-photos';

export type DiaryPdfMeta = {
  tripTitle: string;
  destination: string;
  startDate: string; // ISO
  endDate: string; // ISO
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function coverPageHtml(meta: DiaryPdfMeta): string {
  const range = `${format(parseISO(meta.startDate), 'd MMM', { locale: es })} - ${format(
    parseISO(meta.endDate),
    'd MMM yyyy',
    { locale: es },
  )}`;

  return `
    <section class="cover">
      <p class="cover-eyebrow">DIARIO DE VIAJE</p>
      <h1 class="cover-title">${escapeHtml(meta.tripTitle)}</h1>
      <p class="cover-meta">${escapeHtml(meta.destination)} · ${range}</p>
    </section>
  `;
}

function dayPageHtml(group: DiaryDayGroup, destination: string): string {
  const heading = group.day
    ? `Día ${group.day.dayNumber} · ${format(parseISO(group.day.date), "d 'de' MMMM", { locale: es })}`
    : 'Fotos sueltas';

  const photosHtml = group.photos
    .filter((p) => p.uri)
    .map((photo) => {
      const caption = photo.caption ? `<p class="caption">${escapeHtml(photo.caption)}</p>` : '';
      return `
        <figure class="photo">
          <img src="${photo.uri}" />
          ${caption}
        </figure>a
      `;
    })
    .join('\n');

  return `
    <section class="day-page">
      <p class="day-eyebrow">${escapeHtml(destination)}</p>
      <h2 class="day-title">${escapeHtml(heading)}</h2>
      <div class="photo-grid">
        ${photosHtml}
      </div>
    </section>
  `;
}

function buildHtml(meta: DiaryPdfMeta, groups: DiaryDayGroup[]): string {
  const pages = [coverPageHtml(meta), ...groups.map((g) => dayPageHtml(g, meta.destination))].join(
    '\n<div class="page-break"></div>\n',
  );

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1b2d4f; }
          .page-break { page-break-after: always; }

          .cover {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 40px;
          }
          .cover-eyebrow {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            color: #e26d4f;
            margin-bottom: 16px;
          }
          .cover-title {
            font-family: Georgia, 'Times New Roman', serif;
            font-style: italic;
            font-size: 48px;
            margin-bottom: 12px;
          }
          .cover-meta { font-size: 15px; color: #6b7a99; }

          .day-page { padding: 32px; }
          .day-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            color: #6b7a99;
            margin-bottom: 4px;
          }
          .day-title {
            font-family: Georgia, 'Times New Roman', serif;
            font-style: italic;
            font-size: 26px;
            margin-bottom: 20px;
          }

          .photo-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .photo { break-inside: avoid; }
          .photo img {
            width: 100%;
            border-radius: 10px;
            display: block;
            object-fit: cover;
          }
          .caption { font-size: 11px; color: #4f5f7e; margin-top: 6px; }
        </style>
      </head>
      <body>
        ${pages}
      </body>
    </html>
  `;
}

export async function exportDiaryToPdf(meta: DiaryPdfMeta, groups: DiaryDayGroup[]): Promise<void> {
  const html = buildHtml(meta, groups);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Compartir no está disponible en este dispositivo');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
  });
}

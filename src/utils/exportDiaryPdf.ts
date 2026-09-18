import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { encode } from "base64-arraybuffer";
import { Platform } from "react-native";
import i18n from "@/i18n";
import { supabase } from "@/services/supabase";
import { accountVersion, assertAccount } from "@/services/account-session";
import type { DiaryDayGroup } from "@/hooks/use-diary-photos";
import { buildDiaryHtml, type DiaryPdfMeta } from "./diaryHtml";
export type { DiaryPdfMeta } from "./diaryHtml";

export async function exportDiaryToPdf(
  meta: DiaryPdfMeta,
  groups: DiaryDayGroup[],
): Promise<void> {
  const started = accountVersion();
  assertAccount(started);
  const language = i18n.language;
  const photos = groups.flatMap((group) => group.photos);

  if (!photos.length || photos.length > 60) {
    throw new Error(i18n.t("fixes.pdfLimit"));
  }

  // Abrir durante el gesto evita el bloqueador de ventanas en navegador.
  const popup = Platform.OS === "web" ? window.open("", "_blank") : null;
  if (Platform.OS === "web" && !popup) {
    throw new Error(i18n.t("fixes.popupBlocked"));
  }

  if (popup) popup.opener = null;

  let file: File | null = null;

  try {
    // Firmas nuevas: no depender de una URL expirada que llevaba una hora en pantalla.
    const { data, error } = await supabase.storage.from("trip-photos")
      .createSignedUrls(
        photos.map((p) => p.uri),
        600,
      );

    assertAccount(started);

    if (error) throw error;

    const images = new Map<string, string>();
    let bytes = 0;

    for (let index = 0; index < photos.length; index++) {
      const signed = data?.[index];
      if (!signed?.signedUrl || signed.error) {
        throw new Error(i18n.t("fixes.pdfImageError"));
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await expoFetch(signed.signedUrl, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(i18n.t("fixes.pdfImageError"));

        const mime = (response.headers.get("content-type") ?? "").split(";")[0];

        if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
          throw new Error(i18n.t("fixes.pdfImageError"));
        }

        const declared = Number(response.headers.get("content-length"));

        if (declared > 8_000_000) throw new Error(i18n.t("fixes.pdfLimit"));

        const buffer = await response.arrayBuffer();
        bytes += buffer.byteLength;

        if (buffer.byteLength > 8_000_000 || bytes > 24_000_000) {
          throw new Error(i18n.t("fixes.pdfLimit"));
        }

        assertAccount(started);
        images.set(photos[index].id, `data:${mime};base64,${encode(buffer)}`);
      } finally {
        clearTimeout(timer);
      }
    }

    const html = buildDiaryHtml(meta, groups, images, language);
    assertAccount(started);

    if (popup) {
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      await Promise.all(
        Array.from(popup.document.images).map((img) => img.decode()),
      );
      assertAccount(started);
      popup.focus();
      popup.print();
      return;
    }

    if (!(await Sharing.isAvailableAsync())) {
      throw new Error(i18n.t("fixes.shareUnavailable"));
    }

    const printed = await Print.printToFileAsync({ html, base64: false });
    file = new File(printed.uri);
    assertAccount(started);
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
    });
  } catch (error) {
    popup?.close();
    throw error;
  } finally {
    if (file?.exists) file.delete();
  }
}

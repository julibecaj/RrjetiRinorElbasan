// Replace nulls with the three approved WhatsApp community invite URLs.
// No placeholder is rendered as a clickable link.
export const whatsappCommunities: readonly { label: string; url: string | null }[] = [
  { label: "Komuniteti 1", url: null },
  { label: "Komuniteti 2", url: null },
  { label: "Komuniteti 3", url: null },
];
export function isWhatsAppInvite(url: string | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "chat.whatsapp.com" && !parsed.username && !parsed.password && parsed.pathname.length > 1;
  } catch { return false; }
}

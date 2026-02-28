/**
 * Calendar Service — Shared ICS generation and Google Calendar URL builder
 *
 * Deno-compatible. Generates .ics files and Google Calendar links
 * for booking/live email attachments.
 */

// --- Encoding helpers ---

/** UTF-8 safe base64 encoding (btoa only supports Latin1) */
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

// --- ICS helpers ---

function formatICSDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export interface ICSEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  url?: string;
}

export function generateICS(event: ICSEvent): string {
  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@euanapratica.com`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EUA Na Pratica//NONSGML v1.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(event.startDate)}`,
    `DTEND:${formatICSDate(event.endDate)}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeICS(event.location)}`);
  if (event.url) lines.push(`URL:${event.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

// --- Google Calendar URL ---

export function getGoogleCalendarUrl(event: {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatICSDate(event.startDate)}/${formatICSDate(event.endDate)}`,
  });
  if (event.description) params.set("details", event.description);
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// --- Booking-specific helper ---

export interface BookingCalendarInput {
  scheduled_start: string;
  scheduled_end: string;
  service_name: string;
  mentor_name: string;
  meeting_link?: string | null;
}

export interface BookingCalendarData {
  icsBase64: string;
  googleCalendarUrl: string;
  calendarSectionHtml: string;
  filename: string;
}

/**
 * Builds all calendar data for a booking email:
 * - ICS file content (base64-encoded)
 * - Google Calendar URL
 * - Pre-rendered HTML section with "Add to Google Calendar" button
 */
export function buildBookingCalendarData(booking: BookingCalendarInput): BookingCalendarData {
  const startDate = new Date(booking.scheduled_start);
  const endDate = new Date(booking.scheduled_end);

  const title = `${booking.service_name} - ${booking.mentor_name}`;
  const description = `Sessão de mentoria com ${booking.mentor_name} via EUA na Prática`;
  const location = booking.meeting_link || undefined;

  const icsContent = generateICS({
    title,
    description,
    startDate,
    endDate,
    location,
    url: booking.meeting_link || undefined,
  });

  const icsBase64 = utf8ToBase64(icsContent);

  const googleCalendarUrl = getGoogleCalendarUrl({
    title,
    description,
    startDate,
    endDate,
    location,
  });

  const calendarSectionHtml = `
    <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #bbf7d0; text-align: center;">
      <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Adicione ao seu calendário</p>
      <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background: #4285f4; color: #ffffff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
        Adicionar ao Google Calendar
      </a>
    </div>`;

  return {
    icsBase64,
    googleCalendarUrl,
    calendarSectionHtml,
    filename: "sessao-mentoria.ics",
  };
}

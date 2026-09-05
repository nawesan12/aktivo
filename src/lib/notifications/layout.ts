/**
 * The one shell every email goes through.
 *
 * There used to be six copies of it, one per template, and they had drifted:
 * five laid out with `<div>` and `max-width`, which Outlook renders with Word
 * and ignores, so the mail spilled to the full width of the window; the review
 * request had picked up an indigo-to-cyan gradient from nowhere; and all six
 * printed the shop's name with `background-clip:text` over
 * `-webkit-text-fill-color:transparent`, which is the worst kind of bug —
 * where it is unsupported the fill still applies and the name comes out
 * invisible.
 *
 * So: tables, inline styles, explicit widths, no clever CSS. Everything here is
 * the boring subset that renders the same in Outlook 2016 and Gmail's app.
 */

/* The panel's own palette, so a mail looks like the product it came from. */
const C = {
  ground: "#f4f4f5",
  card: "#ffffff",
  ink: "#09090b",
  muted: "#52525b",
  faint: "#a1a1aa",
  border: "#e4e4e7",
  borderSubtle: "#eeeef0",
  jade: "#4ADE80",
  jadeInk: "#052e16",
  jadeLabel: "#047857",
  jadeWash: "#f0fdf4",
  star: "#f59e0b",
} as const;

/**
 * No `system-ui`: several clients do not resolve it and fall back to a serif.
 * Named faces first, then the generic.
 */
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A block carries both renderings: nobody can add HTML and forget the text. */
export interface Block {
  html: string;
  text: string;
}

export function paragraph(text: string): Block {
  return {
    html: `<p style="margin:0 0 16px;color:${C.muted};font-size:15px;line-height:1.65;">${escapeHtml(text)}</p>`,
    text,
  };
}

/** The line that carries the message. Bigger, in ink rather than grey. */
export function lead(text: string): Block {
  return {
    html: `<p style="margin:0 0 20px;color:${C.ink};font-size:17px;line-height:1.55;font-weight:500;">${escapeHtml(text)}</p>`,
    text,
  };
}

export function note(text: string): Block {
  return {
    html: `<p style="margin:16px 0 0;color:${C.faint};font-size:13px;line-height:1.6;">${escapeHtml(text)}</p>`,
    text,
  };
}

export interface DetailRow {
  label: string;
  value: string;
  /** The one row the eye should land on — the time of the turno, usually. */
  strong?: boolean;
}

/** The turno's facts, framed. Rows, not a grid: Outlook has no grid. */
export function details(rows: DetailRow[]): Block {
  const cells = rows
    .map((row, i) => {
      const divider = i === 0 ? "none" : `1px solid ${C.borderSubtle}`;
      const valueStyle = row.strong
        ? `color:${C.jadeLabel};font-size:19px;font-weight:700;`
        : `color:${C.ink};font-size:15px;font-weight:600;`;
      return `<tr>
        <td width="34%" style="padding:11px 0;border-top:${divider};color:${C.faint};font-size:13px;text-transform:uppercase;letter-spacing:0.04em;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td align="right" style="padding:11px 0;border-top:${divider};${valueStyle}">${escapeHtml(row.value)}</td>
      </tr>`;
    })
    .join("");

  return {
    html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${C.jadeWash};border:1px solid ${C.border};border-radius:12px;margin:0 0 24px;">
      <tr><td style="padding:6px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${cells}</table>
      </td></tr>
    </table>`,
    text: rows.map((r) => `${r.label}: ${r.value}`).join("\n"),
  };
}

/**
 * A button that survives Outlook, which ignores padding on an anchor: the
 * padding lives on the cell and the anchor is stretched over it.
 */
export function button(href: string, label: string): Block {
  return {
    html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:8px 0 4px;">
      <tr><td align="center" bgcolor="${C.jade}" style="border-radius:10px;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:700;color:${C.jadeInk};text-decoration:none;border-radius:10px;">${escapeHtml(label)}</a>
      </td></tr>
    </table>`,
    text: `${label}: ${href}`,
  };
}

/** For when the button does not survive the client, or the reader is wary. */
export function fallbackLink(href: string): Block {
  return {
    html: `<p style="margin:18px 0 0;color:${C.faint};font-size:12px;line-height:1.6;word-break:break-all;">
      O pegá este enlace en el navegador:<br><span style="color:${C.jadeLabel};">${escapeHtml(href)}</span>
    </p>`,
    text: `O pegá este enlace en el navegador: ${href}`,
  };
}

/**
 * Five stars, each one a link into the review already set to that score.
 *
 * The point is the tap count: somebody who just wants to say "estuvo bien" is
 * one tap away from a finished review instead of a page and a form. The button
 * underneath still exists for whoever wants to write something.
 */
export function stars(reviewUrl: string): Block {
  const sep = reviewUrl.includes("?") ? "&" : "?";
  const cells = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<td style="padding:0 5px;"><a href="${escapeHtml(`${reviewUrl}${sep}estrellas=${n}`)}" style="text-decoration:none;font-size:31px;line-height:1;color:${C.star};">&#9733;</a></td>`
    )
    .join("");

  return {
    html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 22px;">
      <tr><td align="center" style="padding:22px 12px;background-color:${C.jadeWash};border:1px solid ${C.border};border-radius:12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;"><tr>${cells}</tr></table>
        <div style="margin-top:12px;color:${C.faint};font-size:12px;">Tocá una estrella para puntuar</div>
      </td></tr>
    </table>`,
    text: `Puntuá tu visita: ${reviewUrl}`,
  };
}

/** The access code, which is the whole message when it appears. */
export function code(value: string): Block {
  return {
    html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 20px;">
      <tr><td align="center" style="padding:26px 20px;background-color:${C.jadeWash};border:1px solid ${C.border};border-radius:12px;">
        <div style="font-family:${MONO};font-size:34px;font-weight:700;letter-spacing:9px;text-indent:9px;color:${C.ink};">${escapeHtml(value)}</div>
      </td></tr>
    </table>`,
    text: value,
  };
}

export interface EmailLayout {
  /** The line the inbox shows next to the subject. */
  preheader: string;
  /** Small jade label above the heading. */
  eyebrow?: string;
  heading: string;
  blocks: Block[];
  /** Whose name goes on the mail — the shop's, or Jiku's for account mail. */
  senderName: string;
}

export function renderEmail(layout: EmailLayout): { html: string; text: string } {
  const body = layout.blocks.map((b) => b.html).join("\n");

  const eyebrow = layout.eyebrow
    ? `<div style="margin:0 0 8px;color:${C.jadeLabel};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(layout.eyebrow)}</div>`
    : "";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<!-- Declared light: without it a dark-mode client re-colours the text and
     leaves the backgrounds alone, which is how white-on-white happens. -->
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(layout.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.ground};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<!-- Preheader: the inbox preview line. The spacer after it stops the client
     from padding the preview out with whatever text comes next. -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.ground};">
  ${escapeHtml(layout.preheader)}
  &#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:${C.ground};">
  <tr>
    <td align="center" style="padding:32px 16px;font-family:${FONT};">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="border-collapse:collapse;width:100%;max-width:600px;">

        <tr>
          <td align="center" style="padding:0 0 22px;">
            <span style="font-size:19px;font-weight:700;color:${C.ink};letter-spacing:-0.02em;">${escapeHtml(layout.senderName)}</span>
          </td>
        </tr>

        <tr>
          <td style="background-color:${C.card};border:1px solid ${C.border};border-radius:16px;padding:36px 32px;">
            ${eyebrow}
            <h1 style="margin:0 0 18px;color:${C.ink};font-size:25px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;">${escapeHtml(layout.heading)}</h1>
            ${body}
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:22px 12px 0;">
            <p style="margin:0;color:${C.faint};font-size:12px;line-height:1.6;">
              <span style="color:${C.jadeLabel};">&#36600;</span>&nbsp; Agenda online por
              <span style="color:${C.muted};font-weight:600;">jiku</span>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  /*
    Joined on a blank line, not a newline: the text part is what a screen
    reader and a plain-text client actually read out, and the details block
    already carries its own line breaks. Run together, the greeting, the four
    facts and the link arrive as one paragraph.
  */
  const text = [
    layout.senderName,
    layout.heading,
    ...layout.blocks.map((b) => b.text),
    "—\nAgenda online por jiku",
  ].join("\n\n");

  return { html, text };
}

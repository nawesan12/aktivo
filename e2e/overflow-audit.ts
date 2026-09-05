import type { Page } from "@playwright/test";

export interface Overflow {
  selector: string;
  scrollWidth: number;
  clientWidth: number;
}

/**
 * Elements whose content is wider than they are.
 *
 * The page-level check that came before this only saw horizontal scroll on the
 * document. A flex row with no `flex-wrap` inside a card with `overflow:
 * hidden` never moves the document — it just clips, so half the text is cut off
 * the edge and every automated check says the page is fine.
 */
export async function findOverflows(page: Page): Promise<Overflow[]> {
  return page.evaluate(() => {
    const results: { selector: string; scrollWidth: number; clientWidth: number }[] = [];

    function describe(el: Element): string {
      const classes = (el.className && typeof el.className === "string" ? el.className : "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .join(".");
      return `${el.tagName.toLowerCase()}${classes ? "." + classes : ""}`;
    }

    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;

      // A container that scrolls sideways on purpose is not a defect: tables
      // and code blocks are meant to do exactly this.
      if (style.overflowX === "auto" || style.overflowX === "scroll") continue;

      // Nor is `truncate`: clipping one line and showing an ellipsis is the
      // whole point of it, and the content is deliberately wider than the box.
      if (style.textOverflow === "ellipsis") continue;

      // Collapsed elements — screen-reader-only text, a closed dialog, an
      // empty live region — always "overflow" their zero width and say nothing
      // about the layout.
      if (el.clientWidth < 40) continue;

      /*
        A text field is not a layout defect for holding more text than fits.

        Typing past the right edge scrolls the caret into view — that is what
        an input does, on every site — and the box itself stays put. Counting
        it made this check depend on how long the seed's description happens to
        be, so it failed for a shop whose text was wordy and passed for the
        same layout with a shorter one.
      */
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") continue;

      // More than a couple of pixels: sub-pixel rounding on borders is noise.
      if (el.scrollWidth > el.clientWidth + 2) {
        results.push({
          selector: describe(el),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
        });
      }
    }

    return results;
  });
}

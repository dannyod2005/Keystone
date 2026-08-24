import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// #360 — shared focus-trap for every modal/dialog in the app. Without
// this, opening a modal left keyboard focus wherever it already was on
// the page (e.g. a course card), so Tab kept walking through the rest
// of the page behind the modal instead of into it — on a long list
// (hundreds/thousands of cards) that made the modal's own buttons
// (like "Enrol now") practically unreachable by keyboard.
//
// Standard WAI-ARIA dialog pattern: move focus into the dialog when it
// opens, keep Tab/Shift+Tab cycling only within it while open, and
// return focus to whatever triggered it once it closes.
//
// Usage: `const dialogRef = useFocusTrap(isOpen);` then spread
// `ref={dialogRef}` onto the dialog's outer element (the card, not the
// backdrop) — pair with `tabIndex={-1} role="dialog" aria-modal="true"`
// on that same element so it's a valid focus target even if it happens
// to have no focusable children.
//
// `active` should reflect whatever state actually controls whether the
// dialog's DOM node is mounted (e.g. the deferred `visibleX` state
// several modals here use to play a closing animation before
// unmounting) — not a prop that can flip true a render before the node
// exists, or focus has nothing to move into yet.
export function useFocusTrap(active) {
  const containerRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    previouslyFocused.current = document.activeElement;

    const container = containerRef.current;
    if (container) {
      const first = container.querySelector(FOCUSABLE_SELECTOR);
      (first || container).focus({ preventScroll: true });
    }

    function handleKeyDown(e) {
      if (e.key !== "Tab" || !container) return;
      const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused.current && document.contains(previouslyFocused.current)) {
        previouslyFocused.current.focus({ preventScroll: true });
      }
    };
  }, [active]);

  return containerRef;
}

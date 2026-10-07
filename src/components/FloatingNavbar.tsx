import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useScrollSpy } from "../hooks/useScrollSpy";

export interface FloatingNavbarItem {
  href: string;
  label: string;
}

export interface FloatingNavbarProps {
  items: readonly FloatingNavbarItem[];
  brand?: ReactNode;
  action?: ReactNode;
  ariaLabel?: string;
  activeId?: string;
  collapseAfter?: number;
  className?: string;
}

export function FloatingNavbar({
  items,
  brand,
  action,
  ariaLabel = "Main navigation",
  activeId,
  collapseAfter = 80,
  className,
}: FloatingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const linksId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const sectionIds = useMemo(
    () => items.flatMap(({ href }) => href.startsWith("#") && href.length > 1 ? [href.slice(1)] : []),
    [items],
  );
  const observedActiveId = useScrollSpy(sectionIds);
  const currentId = activeId ?? observedActiveId;

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > collapseAfter);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, [collapseAfter]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <header
      className={["amui-navbar", className].filter(Boolean).join(" ")}
      data-collapsed={isScrolled}
      data-open={isOpen}
      data-reduced-motion={reducedMotion}
    >
      <div className="amui-navbar__shell">
        {brand && <div className="amui-navbar__brand">{brand}</div>}
        <button
          className="amui-navbar__toggle"
          type="button"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          aria-controls={linksId}
          ref={toggleRef}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span aria-hidden="true">{isOpen ? "×" : "Menu"}</span>
        </button>
        <nav
          className="amui-navbar__links"
          id={linksId}
          aria-label={ariaLabel}
          data-open={isOpen}
        >
          {items.map((item) => {
            const id = item.href.startsWith("#") ? item.href.slice(1) : "";
            return (
              <a
                className="amui-navbar__link"
                href={item.href}
                key={item.href}
                aria-current={id && id === currentId ? "location" : undefined}
                onClick={() => {
                  setIsOpen(false);
                  if (isScrolled || isOpen) {
                    toggleRef.current?.focus();
                  }
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        {action != null && <div className="amui-navbar__action">{action}</div>}
      </div>
    </header>
  );
}

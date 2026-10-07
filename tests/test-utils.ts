import { vi } from "vitest";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const mobileQuery = "(max-width: 40rem)";

export function installMatchMedia(reducedMotion = false, mobile = true) {
  const matches = new Map<string, boolean>([
    [reducedMotionQuery, reducedMotion],
    [mobileQuery, mobile],
  ]);
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  const mediaLists = new Map<string, MediaQueryList>();

  const getMediaList = (query: string): MediaQueryList => {
    const existing = mediaLists.get(query);
    if (existing) return existing;

    const queryListeners = new Set<EventListenerOrEventListenerObject>();
    listeners.set(query, queryListeners);
    const mediaList = {
      get matches() {
        return matches.get(query) ?? false;
      },
      media: query,
      onchange: null,
      addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "change") queryListeners.add(listener);
      }),
      removeEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "change") queryListeners.delete(listener);
      }),
      addListener: vi.fn((listener: EventListener) => queryListeners.add(listener)),
      removeListener: vi.fn((listener: EventListener) => queryListeners.delete(listener)),
      dispatchEvent: vi.fn(() => true),
    } as unknown as MediaQueryList;

    mediaLists.set(query, mediaList);
    return mediaList;
  };

  const matchMedia = vi.fn((query: string) => getMediaList(query));
  vi.stubGlobal("matchMedia", matchMedia);

  return {
    set(query: string, value: boolean) {
      matches.set(query, value);
      const event = { matches: value, media: query } as MediaQueryListEvent;
      for (const listener of listeners.get(query) ?? []) {
        if (typeof listener === "function") listener(event);
        else listener.handleEvent(event);
      }
    },
    setReducedMotion(value: boolean) {
      this.set(reducedMotionQuery, value);
    },
    getMediaList,
    listenerCount(query: string) {
      return listeners.get(query)?.size ?? 0;
    },
  };
}

interface IntersectionInput {
  target: Element;
  isIntersecting: boolean;
}

export class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];
  readonly observed = new Set<Element>();
  readonly observe = vi.fn((target: Element) => {
    this.observed.add(target);
  });
  readonly unobserve = vi.fn((target: Element) => {
    this.observed.delete(target);
  });
  readonly disconnect = vi.fn(() => {});
  readonly takeRecords = vi.fn((): IntersectionObserverEntry[] => []);

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.root = options.root ?? null;
    this.rootMargin = options.rootMargin ?? "0px";
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold ?? 0];
    MockIntersectionObserver.instances.push(this);
  }

  trigger(inputs: readonly IntersectionInput[]) {
    const entries = inputs.map(({ target, isIntersecting }) => {
      const rect = target.getBoundingClientRect();
      return {
        boundingClientRect: rect,
        intersectionRatio: isIntersecting ? 1 : 0,
        intersectionRect: rect,
        isIntersecting,
        rootBounds: null,
        target,
        time: 0,
      } as IntersectionObserverEntry;
    });
    this.callback(entries, this as unknown as IntersectionObserver);
  }

  static reset() {
    MockIntersectionObserver.instances = [];
  }
}

export function installIntersectionObserver() {
  MockIntersectionObserver.reset();
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

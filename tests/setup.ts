import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

const scrollYDescriptor = Object.getOwnPropertyDescriptor(window, "scrollY");
const innerHeightDescriptor = Object.getOwnPropertyDescriptor(window, "innerHeight");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (scrollYDescriptor) {
    Object.defineProperty(window, "scrollY", scrollYDescriptor);
  } else {
    Reflect.deleteProperty(window, "scrollY");
  }
  if (innerHeightDescriptor) {
    Object.defineProperty(window, "innerHeight", innerHeightDescriptor);
  } else {
    Reflect.deleteProperty(window, "innerHeight");
  }
});

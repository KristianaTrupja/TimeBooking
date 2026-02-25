"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook to detect if the current viewport is mobile (< 768px)
 * @param breakpoint - Optional breakpoint in pixels (default: 768, which is Tailwind's md breakpoint)
 * @returns boolean - true if mobile, false if desktop
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check initial screen size
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Set initial value
    checkIsMobile();

    // Listen for resize events
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, [breakpoint]);

  return isMobile;
};

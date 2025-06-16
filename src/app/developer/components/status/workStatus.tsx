"use client";

import { useCalendar } from "@/app/context/CalendarContext";
import React from "react";

export default function WorkStatus() {
  const { isPending, isSaved } = useCalendar();

  if (isPending) {
    return (
      <div className={`bg-yellow-100 text-yellow-900 px-3 py-1 rounded shadow text-sm font-semibold`}>
        Unsaved changes
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className={`bg-green-500 text-white px-3 py-1 rounded shadow text-sm font-semibold`}>
        Saved
      </div>
    );
  }

  return null;
}

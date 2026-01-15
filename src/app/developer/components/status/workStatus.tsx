"use client";

import { useCalendar } from "@/app/context/CalendarContext";
import React from "react";

export default function WorkStatus() {
  const { isPending, isSaved } = useCalendar();

  if (isPending) {
    return (
      <div className={`bg-yellow-100 text-yellow-900 px-3 py-1 m-2 rounded shadow text-sm font-semibold`}>
        Unsaved changes
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className={`flex justify-center items-center text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200 bg-green-500 text-white m-2 shadow`}>
        Saved
      </div>
    );
  }

  return null;
}

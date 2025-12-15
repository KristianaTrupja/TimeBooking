"use client";

import { Palmtree } from "lucide-react";

export default function DeveloperVacations() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[500px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border border-slate-200">
          <Palmtree size={40} className="text-indigo-600" />
        </div>
        <h3 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Vacations
        </h3>
        <p className="text-slate-500 text-sm">Coming soon...</p>
        <div className="mt-6 flex justify-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
}


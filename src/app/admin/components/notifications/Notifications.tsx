"use client";

import { Bell } from "lucide-react";

export default function Notifications() {
  // Sample static notifications
  const notifications = [
    { id: 1, message: "U shtua një pushim i ri për 05 July.", date: "2025-07-08" },
    { id: 2, message: "Një përdorues i ri u shtua: Arlind Leka.", date: "2025-07-07" },
  ];

  return (
    <div className="bg-white p-6 rounded-md shadow border border-gray-200">
      <h2 className="text-2xl font-bold text-[#244B77] flex items-center gap-2 mb-4">
        <Bell className="w-6 h-6" />
        Njoftimet
      </h2>

      {notifications.length === 0 ? (
        <p className="text-gray-500">Nuk ka njoftime për momentin.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notif) => (
            <li key={notif.id} className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-sm text-gray-800">{notif.message}</p>
              <span className="text-xs text-gray-500">{new Date(notif.date).toLocaleDateString("sq-AL", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

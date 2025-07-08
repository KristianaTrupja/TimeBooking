'use client'

import React from 'react'

export default function Spinner() {
    return (
        <div className="w-full inset-0 h-[100%] z-50 flex items-center justify-center bg-white/60">
          <div className="text-center">
            <img
              src="/loading-gif.gif"
              alt="Loading..."
              className="mx-auto mb-2 w-9 h-9"
            />
            <div className="text-sm text-gray-700">Loading in progress</div>
          </div>
        </div>
      );
}

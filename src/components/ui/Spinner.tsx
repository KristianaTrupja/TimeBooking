'use client'

import React from 'react'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export default function Spinner({ size = 'md', text = 'Loading...', fullScreen = false }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  const containerClass = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm'
    : 'w-full h-full min-h-[200px] flex items-center justify-center';

  return (
    <div className={containerClass} role="status" aria-live="polite" aria-busy="true">
      <div className="flex flex-col items-center gap-4">
        {/* Modern spinner ring */}
        <div className={`${sizeClasses[size]} relative`} aria-hidden="true">
          {/* Outer ring */}
          <div className={`absolute inset-0 rounded-full border-[3px] border-slate-200`}></div>
          {/* Animated gradient ring */}
          <div 
            className={`absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 border-r-indigo-500 animate-spin`}
            style={{ animationDuration: '0.8s' }}
          ></div>
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50"></div>
        </div>
        
        {/* Loading dots */}
        <div className="flex items-center gap-1" aria-hidden="true">
          <div className={`${dotSizeClasses[size]} rounded-full bg-blue-500 animate-bounce`} style={{ animationDelay: '0ms', animationDuration: '0.6s' }}></div>
          <div className={`${dotSizeClasses[size]} rounded-full bg-indigo-500 animate-bounce`} style={{ animationDelay: '150ms', animationDuration: '0.6s' }}></div>
          <div className={`${dotSizeClasses[size]} rounded-full bg-purple-500 animate-bounce`} style={{ animationDelay: '300ms', animationDuration: '0.6s' }}></div>
        </div>

        {/* Text */}
        {text && (
          <p className="text-sm font-medium text-slate-500">{text}</p>
        )}
        <span className="sr-only">{text}</span>
      </div>
    </div>
  );
}


import React from 'react';

export const Logo: React.FC<{ size?: number, className?: string }> = ({ size = 48, className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Oriental Gate (Torii Style) */}
        <path d="M50 120C150 80 362 80 462 120L450 140C350 100 162 100 62 140L50 120Z" fill="#8B0000" />
        <path d="M120 120H392V150H120V120Z" fill="#8B0000" />
        <path d="M140 150H372V170H140V150Z" fill="#5C0C0C" />

        {/* Letter A */}
        <path d="M256 120L100 440H160L256 240L352 440H412L256 120Z" fill="#8B0000" />
        <path d="M190 340H322L256 200L190 340Z" fill="#0A0A0A" />

        {/* Snake Coiling Around */}
        <path
            d="M380 300C450 200 380 120 280 120C180 120 120 200 160 300C200 400 320 400 380 300"
            stroke="#15803d"
            strokeWidth="28"
            strokeLinecap="round"
            fill="none"
        />
        <path
            d="M380 300C450 200 380 120 280 120C180 120 120 200 160 300C200 400 320 400 380 300"
            stroke="#eab308"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="8 12"
        />

        {/* Snake Head */}
        <g transform="translate(380, 300) rotate(-45)">
            <path d="M-20 -10 Q 0 -20 20 -10 L 25 10 Q 0 20 -20 10 Z" fill="#15803d" />
            <circle cx="10" cy="-5" r="3" fill="#eab308" />
            <path d="M25 0 L 40 5 M 25 0 L 40 -5" stroke="#ef4444" strokeWidth="2" />
        </g>
    </svg>
);

export const CalculatorIcon: React.FC<{ size?: number, className?: string }> = ({ size = 28, className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect width="512" height="512" rx="128" fill="#2563EB" />
        {/* Plus */}
        <path d="M120 160H200M160 120V200" stroke="white" strokeWidth="40" strokeLinecap="round" />
        {/* Minus */}
        <path d="M312 160H392" stroke="white" strokeWidth="40" strokeLinecap="round" />
        {/* Multiply */}
        <path d="M130 312L190 372M190 312L130 372" stroke="white" strokeWidth="40" strokeLinecap="round" />
        {/* Equals */}
        <path d="M312 320H392M312 360H392" stroke="white" strokeWidth="40" strokeLinecap="round" />
    </svg>
);

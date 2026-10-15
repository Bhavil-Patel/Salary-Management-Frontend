export default function Logo({ className = 'h-4 w-4', ...props }) {
    return (

        <svg xmlns="http://www.w3.org/2000/svg" className={className} {...props} viewBox="0 0 64 64">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2684FF" />
                    <stop offset="100%" stopColor="#123DB8" />
                </linearGradient>
                <linearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#20D6A0" />
                    <stop offset="100%" stopColor="#079477" />
                </linearGradient>
            </defs>

            <rect width="64" height="64" rx="14" fill="url(#bg)" />

            <path
                d="M17 8h23l9 9v30H17a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z"
                fill="#fff"
            />
            <path d="M40 8v9h9" fill="#BBD8FF" />

            <circle cx="24" cy="22" r="4" fill="#1761D8" />
            <path
                d="M17 34v-2a7 7 0 0 1 14 0v2Z"
                fill="#1761D8"
            />

            <rect x="34" y="22" width="9" height="2.5" rx="1.25" fill="#82B6FF" />
            <rect x="34" y="28" width="10" height="2.5" rx="1.25" fill="#82B6FF" />
            <rect x="18" y="38" width="25" height="2.5" rx="1.25" fill="#82B6FF" />
            <rect x="18" y="43" width="18" height="2.5" rx="1.25" fill="#82B6FF" />

            <circle cx="43" cy="43" r="15" fill="#075EAC" opacity=".3" />
            <circle cx="42" cy="41" r="14" fill="url(#coin)" stroke="#fff" strokeWidth="1.5" />

            <path
                d="M36.5 34h11M36.5 38h11M38 34c6 0 7 7 0 7h-1l8 8"
                fill="none"
                stroke="#fff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>

    );
}

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Space Grotesk"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            animation: {
                slide: 'slideIn 0.3s ease-out',
                'pulse-glow': 'pulse-glow 2s infinite',
            },
            keyframes: {
                slideIn: {
                    'from': { opacity: '0', transform: 'translateY(10px)' },
                    'to': { opacity: '1', transform: 'translateY(0)' },
                },
                'pulse-glow': {
                    '0%, 100%': { opacity: '0.8' },
                    '50%': { opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}

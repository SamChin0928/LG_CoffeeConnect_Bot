import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                lg: {
                    black: '#000000',
                    white: '#ffffff',
                }
            },
            fontFamily: {
                heading: ['"Bricolage Grotesque"', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                'lg-gradient': 'var(--lg-gradient)',
            },
            borderRadius: {
                'pill': '100px',
            }
        },
    },
    plugins: [],
};
export default config;

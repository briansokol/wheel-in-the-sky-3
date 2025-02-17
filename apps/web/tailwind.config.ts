import { heroui } from '@heroui/react';
import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {},
    darkMode: 'class',
    plugins: [
        heroui({
            defaultTheme: 'dark',
            defaultExtendTheme: 'dark',
            themes: {
                'dark-purple': {
                    extend: 'dark',
                    colors: {
                        background: 'rgb(10 10 10)',
                        foreground: '#ffffff',
                        primary: {
                            50: '#3B096C',
                            100: '#520F83',
                            200: '#7318A2',
                            300: '#9823C2',
                            400: '#c031e2',
                            500: '#DD62ED',
                            600: '#F182F6',
                            700: '#FCADF9',
                            800: '#FDD5F9',
                            900: '#FEECFE',
                            DEFAULT: '#DD62ED',
                            foreground: '#ffffff',
                        },
                        focus: '#F182F6',
                    },
                },
            },
        }),
    ],
};
export default config;

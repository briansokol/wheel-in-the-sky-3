// @ts-check
import { heroui } from '@heroui/react';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        '../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            animation: {
                float: 'float 0.8s ease-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%': { transform: 'scale(1)', textShadow: '0 0 0 rgba(0, 0, 0, 0.6)' },
                    '100%': { transform: 'scale(1.4)', textShadow: '7px 7px 10px rgba(0, 0, 0, 0.4)' },
                },
            },
        },
    },
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

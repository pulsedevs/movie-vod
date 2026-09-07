// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    // Scan files in the src directory using the App Router structure
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Add custom theme extensions
      screens: {
        'xs': '380px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },  plugins: [
    // Add Tailwind plugins here if needed
    require('@tailwindcss/line-clamp'),
  ],
  // Reduce CSS size by removing unused variants in production
  future: {
    hoverOnlyWhenSupported: true,
  },
};
export default config;
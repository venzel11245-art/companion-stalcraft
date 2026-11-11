import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0e0a',
        'bg-secondary': '#1a1f1a',
        'accent-orange': '#ff6b00',
        'accent-green': '#00ff41',
        'accent-red': '#ff0040',
      },
    },
  },
  plugins: [],
}
export default config
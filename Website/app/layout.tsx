import type { Metadata } from 'next';
import { ColorSchemeScript } from '@mantine/core';
import './globals.css';
import { Providers } from './providers';
import { COLOR_SCHEME_STORAGE_KEY } from './theme';

export const metadata: Metadata = {
  title: 'Historical Aviation Accidents Safety Analytics',
  description: 'Static historical aviation safety analytics powered in the browser by DuckDB-Wasm and Parquet.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✈️</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" localStorageKey={COLOR_SCHEME_STORAGE_KEY} />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cinematic 3D B?Roll Generator',
  description:
    'Generate ultra?realistic, featureless humanoid stills and b?roll for documentaries.',
  metadataBase: new URL('https://agentic-b3576e10.vercel.app'),
  openGraph: {
    title: 'Cinematic 3D B?Roll Generator',
    description:
      'Generate ultra?realistic, featureless humanoid stills and b?roll for documentaries.',
    url: 'https://agentic-b3576e10.vercel.app',
    siteName: 'Cinematic 3D',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

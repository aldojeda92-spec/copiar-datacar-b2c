import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Inter, Montserrat } from 'next/font/google';

// IMPORTACIÓN DEL INTERCEPTOR PWA
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  weight: ['400', '500', '700'] 
});

const montserrat = Montserrat({ 
  subsets: ['latin'], 
  variable: '--font-montserrat',
  weight: ['300', '900'] 
});

// Estándar estricto de Next.js 14+ para el diseño de la pantalla del dispositivo
export const viewport: Viewport = {
  themeColor: '#0A1F33',
};

// Metadatos de SEO y Registro de la PWA
export const metadata: Metadata = {
  title: 'DATACAR | Inversiones Automotrices',
  description: 'Gestión analítica de inversiones automotrices.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Datacar',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${montserrat.variable} font-inter bg-slate-50 text-data-charcoal`}>
        
        {/* --- INICIO GOOGLE TAG (gtag.js) --- */}
        <Script 
          strategy="afterInteractive" 
          src="https://www.googletagmanager.com/gtag/js?id=AW-18003746499" 
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18003746499');
          `}
        </Script>
        {/* --- FIN GOOGLE TAG --- */}

        {/* INYECTOR DE INSTALACIÓN PWA */}
        <PwaInstallPrompt />

        {children}
      </body>
    </html>
  );
}

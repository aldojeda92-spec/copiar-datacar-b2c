import Script from 'next/script';
import './globals.css';
import { Inter, Montserrat } from 'next/font/google';

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

export const metadata = {
  title: 'DATACAR | Inversiones Automotrices',
  description: 'Gestión analítica de inversiones automotrices.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
   
      <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18003746499"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-18003746499');
</script>
  
      <body className={`${inter.variable} ${montserrat.variable} font-inter bg-slate-50 text-data-charcoal`}>
        {children}
      </body>
    </html>
  );
}

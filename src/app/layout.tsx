import type { Metadata } from 'next';
import { Geist, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { RecallProvider } from '@/providers/recall-provider';
import { Shell } from '@/components/shared/shell';
const sans = Geist({ subsets: ['latin'], variable: '--font-sans' });
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});
export const metadata: Metadata = {
  title: 'SilentRecall',
  description: 'Private product recall eligibility on Midnight.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${sans.variable} ${display.variable}`}>
        <RecallProvider>
          <Shell>{children}</Shell>
        </RecallProvider>
      </body>
    </html>
  );
}

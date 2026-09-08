import type { Metadata } from 'next';
import './globals.css';
import { RecallProvider } from '@/providers/recall-provider';
import { Shell } from '@/components/shared/shell';
export const metadata: Metadata = {
  title: 'SilentRecall',
  description: 'Private product recall eligibility on Midnight.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RecallProvider>
          <Shell>{children}</Shell>
        </RecallProvider>
      </body>
    </html>
  );
}

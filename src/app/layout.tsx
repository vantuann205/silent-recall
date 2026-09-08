import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'SilentRecall', description: 'Private product recall eligibility on Midnight.' };
export default function Layout({children}: {children: React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }

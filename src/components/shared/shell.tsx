'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ScanLine,
  Wallet,
  Unplug,
  TriangleAlert,
  Globe,
  LockKeyhole,
  FlaskConical,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecall } from '@/providers/recall-provider';
import { demoAllowed } from '@/lib/config/config';
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const r = useRecall();
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="header">
        <div className="header-inner">
          <Link className="brand" href="/">
            <ScanLine size={29} />
            SilentRecall
          </Link>
          <nav className="nav" aria-label="Main navigation">
            {[
              ['/', 'Overview'],
              ['/manufacturer', 'Manufacturer'],
              ['/customer', 'Customer'],
              ['/privacy', 'Privacy'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                aria-current={
                  (href === '/' ? path === href : path.startsWith(href))
                    ? 'page'
                    : undefined
                }
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="wallet">
            {r.gateway?.mode === 'demo' ? (
              <span className="badge">
                <FlaskConical size={13} />
                Local simulation
              </span>
            ) : null}
            <Button
              onClick={() =>
                void (r.status === 'connected' ? r.disconnect() : r.connect())
              }
              disabled={r.status === 'connecting'}
            >
              {r.status === 'connected' ? <Unplug /> : <Wallet />}
              {r.status === 'connected'
                ? 'Disconnect'
                : r.status === 'connecting'
                  ? 'Connecting...'
                  : 'Connect wallet'}
            </Button>
          </div>
        </div>
      </header>
      {r.error ? (
        <div className="wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="notice error" role="alert">
            <TriangleAlert />
            <span>{r.error}</span>
            <Button
              variant="outline"
              onClick={() => void r.refresh()}
              aria-label="Retry connection"
            >
              <RefreshCw />
            </Button>
          </div>
        </div>
      ) : null}
      <main id="main">{children}</main>
      <footer className="footer">
        <span>SilentRecall / Private product safety / Wave 1</span>
        <div className="actions">
          <Link href="/docs">How it works</Link>
          <Link href="https://github.com/vantuann205/silent-recall">
            GitHub
          </Link>
          {demoAllowed() && r.gateway?.mode !== 'demo' ? (
            <button onClick={() => void r.startDemo()}>Start local demo</button>
          ) : null}
        </div>
      </footer>
    </>
  );
}
export function PrivacyBoundary() {
  return (
    <div className="boundary">
      <div>
        <h3>
          <Globe size={19} />
          Public on Midnight
        </h3>
        <p>
          Hiding commitments, recall conditions and aggregate verification
          counts.
        </p>
      </div>
      <div>
        <h3>
          <LockKeyhole size={19} />
          Private on your device
        </h3>
        <p>
          Your serial number, product secret and salt. Local JSON files are
          unencrypted backups.
        </p>
      </div>
    </div>
  );
}

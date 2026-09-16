import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Fingerprint,
  Factory,
  ScanLine,
  FileKey2,
  ShieldCheck,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { ProductVisual } from '@/components/visual/product-visual';
import { HomeMotion } from '@/components/visual/home-motion';

export default function Home() {
  return (
    <HomeMotion>
      <section className="hero" aria-labelledby="hero-title">
        <ProductVisual />
        <div className="hero-content">
          <div className="eyebrow">
            <span className="status-dot" />
            Private product safety / Midnight
          </div>
          <h1 id="hero-title">
            SilentRecall
            <span className="brand-period" aria-hidden="true">
              .
            </span>
          </h1>
          <p className="hero-statement">
            Your safety.
            <br />
            <span>Your privacy.</span>
            <br />
            No compromise.
          </p>
          <p className="hero-description">
            A product recall should reveal a match.
            <br />
            Not your identity. Not your serial number.
          </p>
          <div className="actions">
            <Link className={buttonVariants()} href="/customer">
              <Fingerprint />
              Check a recall
              <ArrowUpRight />
            </Link>
            <Link className="hero-secondary" href="/manufacturer">
              Manufacturer workspace
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-footnote">
            <ScanLine size={15} />
            <span>Zero-knowledge verification on Midnight</span>
          </div>
        </div>
        <div className="object-caption" aria-hidden="true">
          <span>SR / 001</span>
          <span>Private product passport</span>
          <span>Illustrative model</span>
        </div>
      </section>
      <section className="protocol-strip" aria-label="Privacy boundaries">
        <div>
          <Fingerprint />
          <span>Private credentials</span>
        </div>
        <span className="strip-line" />
        <div>
          <ScanLine />
          <span>Public commitments</span>
        </div>
        <span className="strip-line" />
        <div>
          <ShieldCheck />
          <span>Verified eligibility</span>
        </div>
      </section>
      <section className="wrap entry-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              The right information. Nothing more.
            </span>
            <h2>Two sides. One safer product.</h2>
          </div>
          <Link className="text-link" href="/privacy">
            Explore the privacy model
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="entry-grid">
          <Link href="/customer" className="entry-link">
            <div className="entry-top">
              <span className="entry-number">01 / Product owners</span>
              <ArrowUpRight />
            </div>
            <Fingerprint
              className="entry-symbol"
              size={40}
              strokeWidth={1.25}
            />
            <h3>
              Check your product.
              <br />
              Keep your details.
            </h3>
            <p>
              Import your private credential and verify eligibility for a
              published recall.
            </p>
            <span className="entry-action">
              Customer workspace
              <ArrowRight size={17} />
            </span>
          </Link>
          <Link href="/manufacturer" className="entry-link">
            <div className="entry-top">
              <span className="entry-number">02 / Manufacturers</span>
              <ArrowUpRight />
            </div>
            <Factory className="entry-symbol" size={40} strokeWidth={1.25} />
            <h3>
              Protect your customers.
              <br />
              Not their data.
            </h3>
            <p>
              Issue credentials, register product commitments and publish safety
              recalls.
            </p>
            <span className="entry-action">
              Manufacturer workspace
              <ArrowRight size={17} />
            </span>
          </Link>
        </div>
      </section>
      <section className="privacy-band">
        <div className="wrap privacy-content">
          <FileKey2 size={38} strokeWidth={1.25} />
          <div>
            <span className="eyebrow">Private by construction</span>
            <h2>
              The proof is public.
              <br />
              The personal details are not.
            </h2>
          </div>
          <div>
            <p>
              Midnight verifies a registered product commitment against a
              recall&apos;s conditions. Serial numbers, secrets and salts are
              not published on-chain.
            </p>
            <Link className="text-link" href="/docs">
              Inside the protocol
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </HomeMotion>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, LockKeyhole, Factory } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { PrivacyBoundary } from '@/components/shared/shell';
export default function Home() {
  return (
    <>
      <section className="hero">
        <Image
          src="/product-safety.png"
          alt="SilentRecall tamper-evident product packaging beside a stainless steel kettle"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-content">
          <h1>SilentRecall</h1>
          <p>Product safety should never cost your privacy.</p>
          <p className="muted">
            Prove your product belongs to a recalled batch. Keep its serial
            number and your personal details to yourself.
          </p>
          <div className="actions">
            <Link className={buttonVariants()} href="/customer">
              <LockKeyhole />
              Check a recall
              <ArrowRight />
            </Link>
            <Link
              className={buttonVariants({ variant: 'outline' })}
              href="/manufacturer"
            >
              <Factory />
              Manufacturer workspace
            </Link>
          </div>
        </div>
      </section>
      <section className="band">
        <div className="wrap">
          <div className="section-head">
            <h2>Safety without oversharing.</h2>
            <Link href="/privacy" className="actions">
              Explore the privacy model
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="steps">
            <article>
              <h3>01 / A private product credential</h3>
              <p>
                The manufacturer creates a credential and registers a hiding
                commitment on Midnight.
              </p>
            </article>
            <article>
              <h3>02 / A public safety notice</h3>
              <p>
                A recall defines the affected model, batch and eligibility
                dates. Everyone can inspect its conditions.
              </p>
            </article>
            <article>
              <h3>03 / A private eligibility proof</h3>
              <p>
                The contract checks your private credential opening. Your serial
                number, secret and salt stay private.
              </p>
            </article>
          </div>
        </div>
      </section>
      <div className="wrap">
        <h2>A focused first step.</h2>
        <p className="muted" style={{ marginTop: 12 }}>
          Wave 1 covers private recall eligibility. Payments, claims and
          vouchers are future work.
        </p>
        <PrivacyBoundary />
      </div>
    </>
  );
}

import Link from "next/link"
import type { Metadata } from "next"

import { SiteFooter } from "@/components/site-footer"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { ArrowUpRightIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Bookie Docs",
  description:
    "Set up Bookie locally - clone, install, migrate the SQLite database, and import your prop firm data.",
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.04 11.04 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.67.41.35.78 1.05.78 2.12 0 1.54-.01 2.77-.01 3.15 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
      {children}
    </code>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs leading-relaxed">
      {children}
    </pre>
  )
}

const SECTIONS = [
  { id: "clone-and-install", title: "Clone & install" },
  { id: "sqlite", title: "SQLite" },
  { id: "migrate", title: "Create the database" },
  { id: "run", title: "Run Bookie" },
  { id: "import", title: "Import your data" },
  { id: "track", title: "Track everything" },
]

const FEATURED = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description:
      "Spend vs payouts over time, cost per funded account, recovery ratio, and which firm is the better deal.",
  },
  {
    title: "Accounts",
    href: "/accounts",
    description:
      "Every challenge you buy, with its real cost - list price, discounts, refund terms, resets, and payouts.",
  },
  {
    title: "Tax",
    href: "/tax",
    description:
      "Deductible expenses by category, bracket estimates for your state, and a CSV ready for your CPA.",
  },
  {
    title: "Receipt",
    href: "/receipt",
    description:
      "A printable receipt-style summary of your year - totals per firm, tax estimate, and net profit.",
  },
]

export default function DocsPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          <Link href="/" className="text-sm font-bold">
            bookie.
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/docs"
              className="px-2 text-sm font-medium text-foreground"
            >
              Docs
            </Link>
            <a
              href="https://github.com/maxxfuu"
              target="_blank"
              rel="noreferrer"
              className="px-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <GitHubIcon className="size-4.5" />
              <span className="sr-only">GitHub</span>
            </a>
            <ThemeToggle />
            <Button size="sm" render={<Link href="/dashboard" />}>
              View Demo
              <ArrowUpRightIcon data-icon="inline-end" />
            </Button>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-6 py-10 sm:px-8">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-24 flex flex-col gap-1 text-sm">
            <span className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground">
              Bookie Docs
            </span>
            <span className="mt-4 px-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Get started
            </span>
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 max-w-2xl flex-1">
          <p className="text-sm text-muted-foreground">
            <Link href="/docs" className="underline underline-offset-4">
              Bookie Docs
            </Link>
          </p>

          <div className="mt-4 border-y py-8">
            <h1 className="text-4xl font-bold tracking-tight">Bookie Docs</h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Bookie is a local-first cost tracker for prop firm traders -
              every eval fee, reset, refund, and payout in one ledger, stored
              in a SQLite database on your own machine.
            </p>
          </div>

          <section className="border-b py-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Get Started
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Six steps from zero to tracking:{" "}
              <span className="font-medium text-foreground">
                clone, install, migrate, run, import, track.
              </span>{" "}
              Everything runs on your machine - no account, no cloud, no
              telemetry.
            </p>
          </section>

          <section id="clone-and-install" className="scroll-mt-24 border-b py-8">
            <h2 className="text-xl font-semibold tracking-tight">
              1. Clone the repo &amp; install dependencies
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Bookie uses <Code>bun</Code> as its runtime and package manager.
              If you don&apos;t have it yet, install it first, then clone the
              repository and pull in the dependencies:
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <CodeBlock>{`# install bun (skip if you already have it)
curl -fsSL https://bun.sh/install | bash

# clone and install
git clone https://github.com/maxxfuu/bookie.git
cd bookie
bun install`}</CodeBlock>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              <Code>bun install</Code> reads the lockfile (
              <Code>bun.lock</Code>) so you get the exact dependency versions
              the project was built against.
            </p>
          </section>

          <section id="sqlite" className="scroll-mt-24 border-b py-8">
            <h2 className="text-xl font-semibold tracking-tight">
              2. Ensure SQLite is available
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Bookie stores your data in a local SQLite database via{" "}
              <Code>better-sqlite3</Code>, which bundles its own SQLite build -
              so in most cases there is nothing to do. If your platform needs a
              system SQLite (or you just want the <Code>sqlite3</Code> CLI to
              poke at your data), install it with Homebrew:
            </p>
            <div className="mt-4">
              <CodeBlock>{`# check what you have
sqlite3 --version

# install if missing (macOS)
brew install sqlite`}</CodeBlock>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              On Linux, use your distribution&apos;s package manager instead
              (e.g. <Code>apt install sqlite3</Code>). Windows users get the
              bundled build automatically.
            </p>
          </section>

          <section id="migrate" className="scroll-mt-24 border-b py-8">
            <h2 className="text-xl font-semibold tracking-tight">
              3. Create the local database
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Run the migration script once to create the database file and
              its tables:
            </p>
            <div className="mt-4">
              <CodeBlock>{`bun run db:migrate`}</CodeBlock>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              This creates the SQLite file locally in the project and applies
              the schema - accounts, transactions, expenses, and notes.
              Migrations are idempotent: re-running the command after an
              update applies only what&apos;s new and never touches your
              existing rows. Back up your data by copying that one file.
            </p>
          </section>

          <section id="run" className="scroll-mt-24 border-b py-8">
            <h2 className="text-xl font-semibold tracking-tight">
              4. Run Bookie
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Start the dev server, or build and serve a production bundle:
            </p>
            <div className="mt-4">
              <CodeBlock>{`# development - hot reload
bun run dev

# production
bun run build
bun start`}</CodeBlock>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Then open{" "}
              <a
                href="http://localhost:3000"
                className="font-medium text-foreground underline underline-offset-4"
              >
                localhost:3000
              </a>{" "}
              in your browser. That&apos;s the whole deployment - Bookie is
              meant to run on your machine, next to your data.
            </p>
          </section>

          <section id="import" className="scroll-mt-24 border-b py-8">
            <h2 className="text-xl font-semibold tracking-tight">
              5. Add an account &amp; import your firm&apos;s data
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Head to <span className="font-medium text-foreground">Accounts → Add account</span>.
              Three ways in:
            </p>
            <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">
                  Fill out manually
                </span>{" "}
                - pick a firm and plan; pricing, rules, and refund terms
                autofill from the firm&apos;s published catalog.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Import file
                </span>{" "}
                - drop a CSV or JSON export with one row per account.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Paste orders
                </span>{" "}
                - copy your order history table (and optionally your payout
                history) straight from the firm&apos;s dashboard. Purchases
                become accounts, &quot;Reset&quot; rows attach as reset
                events, and payout rows attach to the account with the
                matching ID.
              </li>
            </ul>
          </section>

          <section id="track" className="scroll-mt-24 py-8">
            <h2 className="text-xl font-semibold tracking-tight">
              6. Track spend, resets, and payouts
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The dashboard recomputes on every event you log: gross fees vs
              payouts over time, cost per funded account, recovery ratio, and
              the exact moment you break even. Log resets, phase changes,
              payouts, and refunds from any account&apos;s row - each becomes
              a transaction in the ledger.
            </p>
          </section>

          <section className="border-t py-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Featured Documentation
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {FEATURED.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex flex-col gap-2 rounded-lg border p-5 transition-colors hover:bg-muted/50"
                >
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
        <SiteFooter />
      </div>
    </div>
  )
}

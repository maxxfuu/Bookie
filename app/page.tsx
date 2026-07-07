import Image from "next/image"
import Link from "next/link"

import { FadeIn } from "@/components/fade-in"
import { InstallCommand } from "@/components/install-command"
import { SiteFooter } from "@/components/site-footer"
import { TerminalDemo } from "@/components/terminal-demo"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { CircuitBoard } from "@/components/ui/circuit-board"
import {
  ArrowUpRightIcon,
  Database,
  Globe,
  Server,
  Shield,
} from "lucide-react"

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

const SETUP_STEPS = [
  <>
    Clone the repo and install deps with <Code>bun install</Code>
  </>,
  <>
    Ensure SQLite is available (<Code>brew install sqlite</Code> if needed -
    bundled with better-sqlite3, so usually already there)
  </>,
  <>
    Run <Code>bun run db:migrate</Code> to create the local database file
  </>,
  <>
    Start it with <Code>bun run dev</Code> (or <Code>bun start</Code>), open
    localhost
  </>,
  <>Add an account, then import your firm&apos;s transaction data</>,
  <>Use Bookie to track your spend, resets, and payouts</>,
]

const FAQ = [
  {
    question: "Where does my data live?",
    answer:
      "On your machine, full stop. Bookie runs locally against a local SQLite database file - there's no cloud account, no sync, and nothing leaves your computer. Back it up by copying one file.",
  },
  {
    question: "Is Bookie free?",
    answer:
      "Yes - fully free and open source. Clone the repo, run it locally, and modify it however you like. If it saves you money on your next eval, star the repo.",
  },
  {
    question: "Which prop firms are supported?",
    answer:
      "Any firm works with manual entry or CSV/JSON import. Firms in the built-in catalog additionally get plan autofill - pricing, drawdown rules, and refund terms - plus paste-import of order and payout history straight from the firm's dashboard.",
  },
  {
    question: "How do I get my order history in?",
    answer:
      "Copy the order table from your firm's dashboard and paste it into Add account → Paste orders. Purchases become accounts, reset rows attach as reset events, and pasted payout rows attach to the matching account automatically.",
  },
  {
    question: "Does Bookie file my taxes?",
    answer:
      "No - it estimates. The Tax tab tracks deductible expenses by category and applies your state's brackets to give you a planning number, then exports a CSV your CPA can work from. Always confirm with a professional.",
  },
]

const lineup = [
  {
    title: "Dashboard",
    description:
      "Spend vs payouts over time, cost per funded account, recovery ratio, and which firm is the better deal.",
  },
  {
    title: "Accounts",
    description:
      "Every challenge you buy, with its real cost - list price, discounts, refund terms, resets, and payouts.",
  },
  {
    title: "Tax",
    description:
      "Deductible expenses by category, bracket estimates for your state, and a CSV ready for your CPA.",
  },
  {
    title: "Notes",
    description:
      "Trading notes and journal entries that live right next to your numbers - context for every decision.",
  },
]

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-bold">
            bookie.
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/docs"
              className="px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
          </nav>
        </header>
        <main className="flex flex-1 flex-col gap-12 pt-10 sm:pt-14">
          <div className="flex flex-col gap-6">
            <h1 className="fade-up text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Track your cost between{" "}
              <span className="text-muted-foreground">
                each trading firm
              </span>
            </h1>
            <p
              className="fade-up max-w-xl text-sm leading-relaxed text-muted-foreground"
              style={{ animationDelay: "75ms" }}
            >
              Every eval fee, reset, refund, and payout in one ledger - cost per
              funded account, recovery ratio, and the exact moment you break
              even.{" "}
              <span className="font-medium text-foreground">Local-first.</span>{" "}
              Your data never leaves the browser.
            </p>
            <div
              className="fade-up flex items-center gap-2 pt-2"
              style={{ animationDelay: "150ms" }}
            >
              <Button size="sm" render={<Link href="/dashboard" />}>
                View Demo
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                render={
                  <a
                    href="https://github.com/maxxfuu"
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <GitHubIcon className="size-3.5" data-icon="inline-start" />
                Fork on Github
              </Button>
            </div>
          </div>
          <div
            className="fade-up my-10 overflow-hidden rounded-xl border shadow-sm lg:-mx-14 xl:-mx-24 2xl:-mx-32 [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
            style={{ animationDelay: "250ms" }}
          >
            <Image
              src="/dashboard-light.png"
              alt="Bookie dashboard"
              width={2000}
              height={1204}
              priority
              className="w-full dark:hidden"
            />
            <Image
              src="/dashboard-dark.png"
              alt="Bookie dashboard"
              width={2000}
              height={1199}
              priority
              className="hidden w-full dark:block"
            />
          </div>
          <section className="flex flex-col gap-4 pt-4 pb-20">
            <FadeIn>
              <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                The lineup
              </h2>
            </FadeIn>
            <FadeIn
              delay={0.1}
              className="grid overflow-hidden rounded-lg border max-sm:divide-y sm:grid-cols-4 sm:divide-x"
            >
              {lineup.map((item) => (
                <div key={item.title} className="flex flex-col gap-2 p-4">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </FadeIn>
            <h2 className="fade-up text-3xl font-semibold tracking-tight text-balance sm:text-4xl mt-16 mb-8 mx-auto" style={{ animationDelay: "300ms" }}>
              Local, Secure, Open Source
            </h2>
            <FadeIn
              delay={0.2}
              className="grid items-center gap-8 py-8 xl:-mx-24 xl:grid-cols-[1fr_auto] 2xl:-mx-32"
            >
              <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
                <InstallCommand />
                <TerminalDemo />
              </div>
              <div className="mx-auto w-full max-w-[500px] [--beam:rgba(52,211,153,0.9)] dark:[--beam:rgba(34,197,94,0.9)]">
                <CircuitBoard
                  nodes={[
                    {
                      id: "start",
                      x: 80,
                      y: 150,
                      label: "Browser",
                      icon: <Globe className="size-4" />,
                    },
                    {
                      id: "process",
                      x: 250,
                      y: 80,
                      label: "Server",
                      icon: <Server className="h-4 w-4" />,
                    },
                    {
                      id: "validate",
                      x: 250,
                      y: 220,
                      label: "Validate",
                      icon: <Shield className="h-4 w-4" />,
                    },
                    {
                      id: "end",
                      x: 420,
                      y: 150,
                      label: "Database",
                      icon: <Database className="h-4 w-4" />,
                    },
                  ]}
                  connections={[
                    { from: "start", to: "process", animated: true },
                    { from: "start", to: "validate", animated: true },
                    { from: "process", to: "end", animated: true },
                    { from: "validate", to: "end", animated: true },
                  ]}
                  width={500}
                  height={300}
                  pulseColor="var(--beam)"
                />
                <ol className="mt-6 max-w-[500px] list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {SETUP_STEPS.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </FadeIn>
          </section>
          <section className="flex flex-col gap-4 pb-20">
            <FadeIn>
              <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Frequently asked questions
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Accordion className="w-full">
                {FAQ.map((item) => (
                  <AccordionItem key={item.question} value={item.question}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeIn>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}

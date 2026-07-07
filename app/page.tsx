import Link from "next/link"

import { ImagePlaceholder } from "@/components/image-placeholder"
import { TerminalDemo } from "@/components/terminal-demo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { ArrowUpRightIcon } from "lucide-react"

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

const lineup = [
  {
    title: "Accounts",
    description:
      "Every challenge you buy, with its real cost — list price, discount code, refund terms, recurring fees.",
  },
  {
    title: "Events",
    description:
      "Resets, phase changes, payouts, and refunds logged per account. Each one moves the numbers.",
  },
  {
    title: "Dashboard",
    description:
      "Spend vs payouts over time, cost per funded account, recovery ratio, and which firm is the better deal.",
  },
]

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-5">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-bold">
            bookie.
          </Link>
          <nav className="flex items-center gap-2">
            <a
              href="https://github.com"
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
        <main className="flex flex-1 flex-col gap-8 pt-6">
          <div className="flex flex-col gap-5">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Prop-firm costs that are{" "}
              <span className="text-muted-foreground">
                refreshingly boring.
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every eval fee, reset, refund, and payout in one ledger — cost per
              funded account, recovery ratio, and the exact moment you break
              even.{" "}
              <span className="font-medium text-foreground">Local-first.</span>{" "}
              Your data never leaves the browser.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" render={<Link href="/dashboard" />}>
                View Demo
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                render={
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                Fork on Github
              </Button>
            </div>
          </div>
          <ImagePlaceholder />
          <section className="flex flex-col gap-4 pb-10">
            <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              The lineup
            </h2>
            <div className="grid overflow-hidden rounded-lg border max-sm:divide-y sm:grid-cols-3 sm:divide-x">
              {lineup.map((item) => (
                <div key={item.title} className="flex flex-col gap-2 p-4">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="py-8">
              <TerminalDemo />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

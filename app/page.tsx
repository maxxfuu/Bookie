import Image from "next/image"
import Link from "next/link"

import { InstallCommand } from "@/components/install-command"
import { TerminalDemo } from "@/components/terminal-demo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { ArrowUpRightIcon, GlobeIcon } from "lucide-react"

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

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/maxxfuu",
    icon: <GitHubIcon className="size-4" />,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/maxxfuu",
    icon: <LinkedInIcon className="size-4" />,
  },
  {
    label: "maxxfuu.com",
    href: "https://maxxfuu.com",
    icon: <GlobeIcon className="size-4" />,
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
      "Every challenge you buy, with its real cost — list price, discounts, refund terms, resets, and payouts.",
  },
  {
    title: "Tax",
    description:
      "Deductible expenses by category, bracket estimates for your state, and a CSV ready for your CPA.",
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
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Track your cost between{" "}
              <span className="text-muted-foreground">
                each trading firm
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every eval fee, reset, refund, and payout in one ledger — cost per
              funded account, recovery ratio, and the exact moment you break
              even.{" "}
              <span className="font-medium text-foreground">Local-first.</span>{" "}
              Your data never leaves the browser.
            </p>
            <div className="flex items-center gap-2 pt-2">
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
          <div className="my-10 overflow-hidden rounded-xl border shadow-sm lg:-mx-14 xl:-mx-24 2xl:-mx-32 [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]">
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
          <section className="flex flex-col gap-5 pt-4 pb-20">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                The lineup
              </h2>
              <div className="mx-auto hidden w-full max-w-lg md:block">
                <InstallCommand />
              </div>
            </div>
            <div className="grid items-start gap-8 md:grid-cols-2">
              <div className="flex flex-col divide-y overflow-hidden rounded-lg border">
                {lineup.map((item) => (
                  <div key={item.title} className="flex flex-col gap-2 p-5">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
                <div className="md:hidden">
                  <InstallCommand />
                </div>
                <TerminalDemo />
              </div>
            </div>
          </section>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t py-6 text-sm text-muted-foreground">
          <span>
            bookie. — built by{" "}
            <a
              href="https://maxxfuu.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              maxxfuu
            </a>
          </span>
          <nav className="flex items-center gap-4">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                {social.icon}
                {social.label}
              </a>
            ))}
          </nav>
        </footer>
      </div>
    </div>
  )
}

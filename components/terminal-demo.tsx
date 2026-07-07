import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal"

export function TerminalDemo() {
  return (
    <Terminal className="mx-auto">
      <TypingAnimation>&gt; bookie import orders.csv</TypingAnimation>

      <AnimatedSpan className="text-green-500">
        ✔ Parsed 17 orders from Lucid Trading.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Matched plan: LucidFlex 50K.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Created 8 accounts.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Attached 9 resets as events.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Categorized fees for Schedule C.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Accrued recurring data fees.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Synced payouts to the dashboard.
      </AnimatedSpan>

      <AnimatedSpan className="">✔ Recomputed every chart.</AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Recovery ratio: 231.0%.
      </AnimatedSpan>

      <AnimatedSpan className="text-blue-500">
        <span>ℹ Net profit this year:</span>
        <span className="pl-2">+ $1,191 · past breakeven</span>
      </AnimatedSpan>

      <TypingAnimation className="text-muted-foreground">
        Success! Your ledger is up to date.
      </TypingAnimation>

      <TypingAnimation className="text-muted-foreground">
        Open the dashboard to see the damage.
      </TypingAnimation>
    </Terminal>
  )
}

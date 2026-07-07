import { Badge } from "@/components/ui/badge"
import type { Phase } from "@/lib/types"
import { CircleCheckIcon, CircleXIcon, LoaderIcon } from "lucide-react"

const phaseLabels: Record<Phase, string> = {
  phase1: "Evaluation",
  phase2: "Evaluation",
  funded: "Funded",
  breached: "Breached",
}

export function PhaseBadge({ phase }: { phase: Phase }) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {phase === "funded" ? (
        <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
      ) : phase === "breached" ? (
        <CircleXIcon className="fill-red-500 dark:fill-red-400" />
      ) : (
        <LoaderIcon />
      )}
      {phaseLabels[phase]}
    </Badge>
  )
}

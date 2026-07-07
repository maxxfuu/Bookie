"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { CheckIcon, CopyIcon } from "lucide-react"

const COMMAND = "bunx --bun create bookie@latest"

/** Click-to-copy install command, shadcn-docs style. */
export function InstallCommand() {
  const [copied, setCopied] = React.useState(false)

  function copy() {
    void navigator.clipboard.writeText(COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copy}
      className="w-full justify-between font-mono text-xs"
    >
      <span className="truncate">
        <span className="text-muted-foreground">&gt;</span> {COMMAND}
      </span>
      {copied ? (
        <CheckIcon
          data-icon="inline-end"
          className="text-green-500 dark:text-green-400"
        />
      ) : (
        <CopyIcon data-icon="inline-end" className="text-muted-foreground" />
      )}
      <span className="sr-only">Copy install command</span>
    </Button>
  )
}

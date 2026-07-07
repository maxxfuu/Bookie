"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAccounts } from "@/lib/store"
import { localISODate } from "@/lib/utils"
import { NotebookPenIcon, Trash2Icon } from "lucide-react"

function todayISO() {
  return localISODate()
}

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function Page() {
  const { hydrated, notes, addNote, removeNote } = useAccounts()
  const [date, setDate] = React.useState(todayISO())
  const [content, setContent] = React.useState("")

  const sorted = React.useMemo(
    () => [...notes].sort((a, b) => b.date.localeCompare(a.date)),
    [notes]
  )

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (content.trim() === "") return
    addNote(date, content.trim())
    setContent("")
    toast.success("Note saved.")
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="note-date">Date</FieldLabel>
          <Input
            id="note-date"
            type="date"
            className="w-40"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="note-content">
            How did today&apos;s trading go?
          </FieldLabel>
          <Textarea
            id="note-content"
            rows={4}
            placeholder="What worked, what didn't, what to do differently…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Field>
        <Button
          type="submit"
          className="w-fit"
          disabled={content.trim() === ""}
        >
          Save note
        </Button>
      </form>
      {sorted.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <NotebookPenIcon />
              </EmptyMedia>
              <EmptyTitle>No notes yet</EmptyTitle>
              <EmptyDescription>
                Write your first reflection above.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map((note) => (
            <Card key={note.id} className="@container/card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  {formatDate(note.date)}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    onClick={() => {
                      removeNote(note.id)
                      toast.success("Note removed.")
                    }}
                  >
                    <Trash2Icon />
                    <span className="sr-only">
                      Delete note from {formatDate(note.date)}
                    </span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">
                {note.content}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

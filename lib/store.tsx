"use client"

import * as React from "react"

import { currentPhase } from "@/lib/selectors"
import type {
  Account,
  AccountInput,
  Expense,
  ExpenseInput,
  Note,
  FeeType,
  LogEventInput,
  TaxCategory,
  Transaction,
  RefundStatus,
} from "@/lib/types"

// v2: firm list changed to the 9 supported futures firms.
const STORAGE_KEY = "bookie.store.v2"

type StoreState = {
  accounts: Account[]
  transactions: Transaction[]
  expenses: Expense[]
  notes: Note[]
}

type Snapshot = StoreState & {
  /** False on the server and during hydration, before localStorage is read. */
  hydrated: boolean
}

const EMPTY_SNAPSHOT: Snapshot = {
  accounts: [],
  transactions: [],
  expenses: [],
  notes: [],
  hydrated: false,
}

/** Tax overlay defaults: money spent on the firm is a deductible business fee. */
function taxDefaultsFor(feeType: FeeType): {
  deductible: boolean
  taxCategory: TaxCategory | null
} {
  switch (feeType) {
    case "eval":
    case "reset":
    case "activation":
    case "addon":
      return { deductible: true, taxCategory: "fees_commissions" }
    case "recurring":
      return { deductible: true, taxCategory: "software_data" }
    default:
      return { deductible: false, taxCategory: null }
  }
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addMonths(isoDate: string, months: number) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + months)
  return toISODate(date)
}

function makeTransaction(
  account: Account,
  fields: Partial<Transaction> & Pick<Transaction, "id" | "date" | "feeType">
): Transaction {
  return {
    firm: account.firm,
    accountId: account.id,
    listPrice: 0,
    discount: 0,
    amountPaid: 0,
    phaseReached: "phase1",
    refundable: false,
    refundStatus: "none",
    refundAmount: 0,
    payout: 0,
    ...taxDefaultsFor(fields.feeType),
    ...fields,
  }
}

/** The transactions an account starts life with: its eval fee + any add-ons. */
function initialTransactions(account: Account): Transaction[] {
  const initialPhase = account.programType === "instant" ? "funded" : "phase1"
  const rows: Transaction[] = [
    makeTransaction(account, {
      id: `${account.id}-eval`,
      date: account.startDate,
      feeType: "eval",
      listPrice: account.listPrice,
      discount: account.discount,
      amountPaid: account.amountPaid,
      phaseReached: initialPhase,
      refundable: account.refundable,
    }),
  ]
  account.addons.forEach((addon, index) => {
    rows.push(
      makeTransaction(account, {
        id: `${account.id}-addon-${index}`,
        date: account.startDate,
        feeType: "addon",
        listPrice: addon.cost,
        amountPaid: addon.cost,
        phaseReached: initialPhase,
      })
    )
  })
  return rows
}

/**
 * Recurring fees accrue: materialize one "recurring" row per elapsed month
 * since purchase, stopping when the account breaches. Deterministic ids keep
 * this idempotent across reloads.
 */
function accrueRecurring(state: StoreState, today: string): Transaction[] {
  const existing = new Set(state.transactions.map((t) => t.id))
  const accrued: Transaction[] = []
  for (const account of state.accounts) {
    if (account.recurringCadence !== "monthly" || account.recurringFee <= 0) {
      continue
    }
    const breachDate = state.transactions
      .filter(
        (t) => t.accountId === account.id && t.phaseReached === "breached"
      )
      .map((t) => t.date)
      .sort()[0]
    for (let n = 1; ; n++) {
      const date = addMonths(account.startDate, n)
      if (date > today) break
      if (breachDate && date > breachDate) break
      const id = `${account.id}-recurring-${date.slice(0, 7)}`
      if (existing.has(id)) continue
      accrued.push(
        makeTransaction(account, {
          id,
          date,
          feeType: "recurring",
          listPrice: account.recurringFee,
          amountPaid: account.recurringFee,
          phaseReached: currentPhase(account.id, state.transactions),
        })
      )
    }
  }
  return accrued
}

function loadPersistedState(): StoreState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_SNAPSHOT
    const parsed = JSON.parse(raw) as Partial<StoreState>
    if (
      !Array.isArray(parsed.accounts) ||
      !Array.isArray(parsed.transactions)
    ) {
      return EMPTY_SNAPSHOT
    }
    return {
      accounts: parsed.accounts,
      // Rows persisted before the tax overlay get defaults from their fee type.
      transactions: parsed.transactions.map((t) =>
        t.deductible === undefined
          ? { ...t, ...taxDefaultsFor(t.feeType) }
          : t
      ),
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    }
  } catch {
    return EMPTY_SNAPSHOT
  }
}

/** Builds the transaction a logged event turns into (plus account patches). */
function applyEvent(
  state: StoreState,
  account: Account,
  event: LogEventInput,
  id: string
): StoreState {
  const phase = currentPhase(account.id, state.transactions)
  let accounts = state.accounts
  let transactions = state.transactions
  let row: Transaction
  switch (event.type) {
    case "reset":
      row = makeTransaction(account, {
        id,
        date: event.date,
        feeType: "reset",
        listPrice: event.cost,
        amountPaid: event.cost,
        phaseReached: phase === "breached" ? "phase1" : phase,
      })
      break
    case "phase-change":
      row = makeTransaction(account, {
        id,
        date: event.date,
        feeType:
          event.phase === "funded" && (event.activationFee ?? 0) > 0
            ? "activation"
            : "phase-change",
        listPrice: event.activationFee ?? 0,
        amountPaid: event.activationFee ?? 0,
        phaseReached: event.phase,
        breachReason:
          event.phase === "breached" ? event.breachReason : undefined,
      })
      break
    case "payout":
      row = makeTransaction(account, {
        id,
        date: event.date,
        feeType: "payout",
        phaseReached: phase,
        payout: event.amount,
        profitSplitPct: event.profitSplitPct,
      })
      break
    case "refund": {
      row = makeTransaction(account, {
        id,
        date: event.date,
        feeType: "refund",
        phaseReached: phase,
        refundable: true,
        refundStatus: "received",
        refundAmount: event.amount,
      })
      // Mirror the received status onto the eval row for display.
      transactions = transactions.map((t) =>
        t.accountId === account.id && t.feeType === "eval"
          ? {
              ...t,
              refundStatus: "received" as RefundStatus,
              refundAmount: event.amount,
            }
          : t
      )
      break
    }
    case "addon":
      row = makeTransaction(account, {
        id,
        date: event.date,
        feeType: "addon",
        listPrice: event.cost,
        amountPaid: event.cost,
        phaseReached: phase,
      })
      accounts = accounts.map((a) =>
        a.id === account.id
          ? {
              ...a,
              addons: [...a.addons, { name: event.name, cost: event.cost }],
            }
          : a
      )
      break
  }
  return {
    accounts,
    transactions: [...transactions, row],
    expenses: state.expenses,
    notes: state.notes,
  }
}

/**
 * Module-singleton store consumed via useSyncExternalStore: localStorage is
 * the persistence layer, this snapshot is the source of truth after load.
 */
class AccountsStore {
  private snapshot: Snapshot = EMPTY_SNAPSHOT
  private listeners = new Set<() => void>()
  private loaded = false

  private emit() {
    for (const listener of this.listeners) listener()
  }

  private persist() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          accounts: this.snapshot.accounts,
          transactions: this.snapshot.transactions,
          expenses: this.snapshot.expenses,
          notes: this.snapshot.notes,
        })
      )
    } catch {
      // Persistence is best-effort; the in-memory snapshot still works.
    }
  }

  private setState(updater: (prev: StoreState) => StoreState) {
    const next = updater(this.snapshot)
    this.snapshot = { ...next, hydrated: this.snapshot.hydrated }
    this.persist()
    this.emit()
  }

  private ensureLoaded() {
    if (this.loaded || typeof window === "undefined") return
    this.loaded = true
    const state = loadPersistedState()
    const accrued = accrueRecurring(state, toISODate(new Date()))
    this.snapshot = {
      accounts: state.accounts,
      transactions:
        accrued.length > 0
          ? [...state.transactions, ...accrued]
          : state.transactions,
      expenses: state.expenses,
      notes: state.notes,
      hydrated: true,
    }
    this.persist()
  }

  subscribe = (listener: () => void) => {
    this.ensureLoaded()
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = () => this.snapshot

  getServerSnapshot = () => EMPTY_SNAPSHOT

  addAccount = (input: AccountInput): Account => {
    const account: Account = { ...input, id: crypto.randomUUID() }
    this.setState((prev) => {
      const withAccount = {
        ...prev,
        accounts: [...prev.accounts, account],
        transactions: [...prev.transactions, ...initialTransactions(account)],
      }
      const accrued = accrueRecurring(withAccount, toISODate(new Date()))
      return accrued.length > 0
        ? {
            ...withAccount,
            transactions: [...withAccount.transactions, ...accrued],
          }
        : withAccount
    })
    return account
  }

  removeAccount = (accountId: string) => {
    this.setState((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== accountId),
      transactions: prev.transactions.filter((t) => t.accountId !== accountId),
    }))
  }

  logEvent = (accountId: string, event: LogEventInput) => {
    this.setState((prev) => {
      const account = prev.accounts.find((a) => a.id === accountId)
      if (!account) return prev
      return applyEvent(prev, account, event, crypto.randomUUID())
    })
  }

  addExpense = (input: ExpenseInput): Expense => {
    const expense: Expense = { ...input, id: crypto.randomUUID() }
    this.setState((prev) => ({
      ...prev,
      expenses: [...prev.expenses, expense],
    }))
    return expense
  }

  removeExpense = (expenseId: string) => {
    this.setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expenseId),
    }))
  }

  addNote = (date: string, content: string): Note => {
    const note: Note = { id: crypto.randomUUID(), date, content }
    this.setState((prev) => ({ ...prev, notes: [...prev.notes, note] }))
    return note
  }

  removeNote = (noteId: string) => {
    this.setState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId),
    }))
  }
}

const store = new AccountsStore()

export function useAccounts() {
  const snapshot = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  )
  return {
    ...snapshot,
    addAccount: store.addAccount,
    removeAccount: store.removeAccount,
    logEvent: store.logEvent,
    addExpense: store.addExpense,
    removeExpense: store.removeExpense,
    addNote: store.addNote,
    removeNote: store.removeNote,
  }
}

"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { MessageSquare, MessagesSquare, User } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useDebounce } from "@/hooks/use-debounce"
import { type SearchResult } from "@/types/search"

export function CommandSearch() {
  const params = useParams()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const searchMessages = useCallback(async () => {
    if (!debouncedQuery) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(
          debouncedQuery
        )}&workspaceId=${params.workspaceId}`
      )
      const data = await response.json()
      if (response.ok) {
        setResults(data.results)
      } else {
        console.error("Search failed:", data.error)
        setResults([])
      }
    } catch (error) {
      console.error("Search error:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [debouncedQuery, params.workspaceId])

  useEffect(() => {
    searchMessages()
  }, [debouncedQuery, searchMessages])

  const getMessageIcon = (type: SearchResult["message_type"]) => {
    switch (type) {
      case "channel_message":
        return <MessageSquare />
      case "thread_message":
        return <MessagesSquare />
      case "direct_message":
        return <User />
    }
  }

  const getMessageLabel = (result: SearchResult) => {
    switch (result.message_type) {
      case "channel_message":
        return `#${result.channel_name} by ${result.sender_name}`
      case "thread_message":
        return `Thread in #${result.channel_name} by ${result.sender_name}`
      case "direct_message":
        return `DM between ${result.sender_name} and ${result.receiver_name}`
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search all messages..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading ? (
          <CommandEmpty>Searching...</CommandEmpty>
        ) : results.length === 0 && query ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <CommandGroup heading="Messages">
            {results.map((result) => (
              <CommandItem
                key={result.id}
                value={result.id}
                onSelect={() => {
                  // TODO: Handle navigation to message
                  setOpen(false)
                }}
              >
                {getMessageIcon(result.message_type)}
                <div className="flex flex-col gap-1">
                  <div className="text-sm">{result.content}</div>
                  <div className="text-xs text-muted-foreground">
                    {getMessageLabel(result)}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

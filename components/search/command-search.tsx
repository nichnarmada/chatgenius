"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { DialogTitle } from "@/components/ui/dialog"

interface CommandSearchProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const params = useParams()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange?.(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [onOpenChange, open])

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
        return <MessageSquare className="mr-2 h-4 w-4" />
      case "thread_message":
        return <MessagesSquare className="mr-2 h-4 w-4" />
      case "direct_message":
        return <User className="mr-2 h-4 w-4" />
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

  const handleSelect = (result: SearchResult) => {
    onOpenChange?.(false)

    switch (result.message_type) {
      case "channel_message":
        router.push(
          `/workspaces/${params.workspaceId}/channels/${result.channel_id}#message-${result.id}`
        )
        break
      case "thread_message":
        router.push(
          `/workspaces/${params.workspaceId}/channels/${result.channel_id}?thread=${result.parent_message_id}#message-${result.id}`
        )
        break
      case "direct_message":
        const otherUserId =
          result.sender_id === params.userId
            ? result.receiver_id
            : result.sender_id
        router.push(
          `/workspaces/${params.workspaceId}/dm/${otherUserId}#message-${result.id}`
        )
        break
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Search messages</DialogTitle>
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
                value={result.content}
                onSelect={() => handleSelect(result)}
                className="flex items-center gap-2"
              >
                {getMessageIcon(result.message_type)}
                <div className="flex flex-col gap-1">
                  <div className="line-clamp-1 text-sm">{result.content}</div>
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

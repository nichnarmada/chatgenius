"use client"

import { useState } from "react"
import { Search as SearchIcon } from "lucide-react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { FilePreview } from "./file-upload"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

interface SearchProps {
  workspaceId: string
}

interface SearchResult {
  document: {
    id: string
    content?: string
    file_name?: string
    file_url?: string
    file_type?: string
    file_size?: number
    created_at: string
  }
}

export function Search({ workspaceId }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [type, setType] = useState<"messages" | "files">("messages")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return

    try {
      setIsSearching(true)
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&workspaceId=${workspaceId}&type=${type}`
      )

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      setResults(data.hits || [])
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <SearchIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search messages and files..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch()
                }
              }}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              Search
            </Button>
          </div>

          <Tabs
            value={type}
            onValueChange={(v) => setType(v as "messages" | "files")}
          >
            <TabsList>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            <TabsContent value="messages" className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.document.id}
                  className="p-3 rounded-md border hover:bg-muted/50"
                >
                  <p className="text-sm">{result.document.content}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(result.document.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="files" className="space-y-2">
              {results.map(
                (result) =>
                  result.document.file_name && (
                    <FilePreview
                      key={result.document.id}
                      file={{
                        file_name: result.document.file_name,
                        file_url: result.document.file_url!,
                        file_type: result.document.file_type!,
                        file_size: result.document.file_size!,
                      }}
                    />
                  )
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

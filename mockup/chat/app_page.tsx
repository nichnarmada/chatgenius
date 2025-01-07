import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hash, Send } from 'lucide-react'

export default function ChatPage() {
  return (
    <>
      {/* Channel Header */}
      <div className="bg-white border-b p-4 flex items-center">
        <Hash className="mr-2 h-5 w-5" />
        <h2 className="font-semibold text-lg">general</h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-grow p-4">
        {[
          { user: 'Alice', message: 'Hey everyone! How\'s it going?' },
          { user: 'Bob', message: 'Pretty good! Working on the new feature.' },
          { user: 'Charlie', message: 'Just finished my part. Ready for review!' },
        ].map((msg, index) => (
          <div key={index} className="mb-4">
            <div className="font-semibold">{msg.user}</div>
            <div>{msg.message}</div>
          </div>
        ))}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <form className="flex items-center">
          <Input 
            placeholder="Message #general" 
            className="flex-grow mr-2"
          />
          <Button type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  )
}


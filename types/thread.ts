import { Profile } from "./profile"
import { BaseMessage } from "./message"

export interface ThreadMessage extends BaseMessage {
  parent_message_id: string
  profile: Profile
}

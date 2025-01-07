### **System Architecture for ChatGenius**

---

### **1. API Routes with HTTP Methods and Auth Requirements**

#### **User**

1. `GET /api/users/:id` - Retrieve user details by ID (auth required).
2. `GET /api/users/presence` - Retrieve the presence/status of all workspace members (auth required).
3. `PATCH /api/users/status` - Update user presence/status (auth required).

#### **Workspace**

4. `POST /api/workspaces` - Create a new workspace (auth required).
5. `GET /api/workspaces/:id` - Retrieve workspace details by ID (auth required).
6. `GET /api/workspaces` - List all workspaces a user belongs to (auth required).

#### **Channel**

7. `POST /api/channels` - Create a new channel in a workspace (auth required).
8. `GET /api/channels/:id` - Retrieve details of a channel by ID (auth required).
9. `GET /api/channels` - List all channels in a workspace (auth required).

#### **DirectMessage**

10. `POST /api/dms` - Start a new DM with a user (auth required).
11. `GET /api/dms/:id` - Retrieve DM details and messages by ID (auth required).

#### **Message**

12. `POST /api/messages` - Send a message in a channel or DM (auth required).
13. `GET /api/messages?channel_id=x` - List messages for a specific channel (auth required).
14. `GET /api/messages?dm_id=x` - List messages for a specific DM (auth required).

#### **File** (Phase 2)

15. `POST /api/files` - Upload a file to a channel or DM (auth required).
16. `GET /api/files/:id` - Retrieve file metadata by ID (auth required).

#### **Search** (Phase 2)

17. `GET /api/search?query=x` - Search messages or files within a workspace (auth required).

#### **Thread** (Phase 3)

18. `POST /api/threads` - Create a new thread linked to a message (auth required).
19. `GET /api/threads/:id` - Retrieve thread messages by thread ID (auth required).

#### **Reaction** (Phase 3)

20. `POST /api/reactions` - Add an emoji reaction to a message (auth required).
21. `DELETE /api/reactions/:id` - Remove a reaction by ID (auth required).

---

### **2. Page Structure and Components**

#### **Pages**

1. `/` - Landing page with login/signup handled by Supabase auth.
2. `/workspaces` - Dashboard displaying workspaces the user is part of.
3. `/workspaces/:workspaceId` - Workspace home showing available channels and DMs.
4. `/workspaces/:workspaceId/channels/:channelId` - Channel view with real-time messages and file uploads.
5. `/workspaces/:workspaceId/dms/:dmId` - DM view with real-time messages.
6. `/search` - Search results page for messages and files (Phase 2).
7. `/settings` - User account settings and workspace admin management.

#### **Components**

1. **Header** : Contains workspace switcher, user profile dropdown, and search bar.
2. **Sidebar** : Displays channels, DMs, and user presence/status.
3. **ChatWindow** : Shows messages, threads, file uploads, and reactions.
4. **MessageInput** : For composing and sending messages.
5. **FileUpload** : For uploading files (Phase 2).
6. **ThreadView** : Displays thread messages (Phase 3).
7. **ReactionPicker** : For selecting emoji reactions (Phase 3).

---

### **3. Key Middleware Functions**

#### **Authentication Middleware**

1. Verify user session with Supabase auth on each API request to restrict access to authenticated users.

#### **Authorization Middleware**

2. Check workspace membership for workspace-related actions (e.g., creating channels, sending messages).
3. Validate channel or DM access for user-specific actions (e.g., viewing messages or uploading files).

#### **Validation Middleware**

4. Validate payloads for required fields (e.g., message content, file metadata) before processing.
5. Ensure unique constraints (e.g., channel names within a workspace).

#### **Real-Time Updates Middleware**

6. Sync user presence/status updates with Supabase real-time subscriptions.
7. Notify channel or DM participants of new messages or threads using Supabase.

#### **Search Index Middleware (Phase 2)**

8. Index messages and file metadata in Typesense after successful creation.

---

This architecture is scalable and modular, aligning with your phased roadmap. Let me know if you'd like diagrams or further elaboration on specific areas!

### **Data Models and Technical Requirements for ChatGenius App**

---

### **Phase 1: Core Features**

#### **Data Models**

1. **User**
   - Fields: `id (UUID)`, `name`, `email`, `profile_picture_url`, `status (online/away/offline)`, `created_at`, `updated_at`.
   - Relationships: Linked to `Workspace` and `Messages`.
2. **Workspace**
   - Fields: `id (UUID)`, `name`, `created_by_user_id`, `created_at`, `updated_at`.
   - Relationships: Has many `Channels` and `Users`.
3. **Channel**
   - Fields: `id (UUID)`, `workspace_id`, `name`, `description`, `is_private (boolean)`, `created_at`, `updated_at`.
   - Relationships: Belongs to `Workspace` and has many `Messages`.
4. **DirectMessage (DM)**
   - Fields: `id (UUID)`, `sender_id`, `receiver_id`, `created_at`.
   - Relationships: Links two `Users` and has many `Messages`.
5. **Message**
   - Fields: `id (UUID)`, `channel_id`, `dm_id`, `user_id`, `content`, `created_at`, `updated_at`.
   - Relationships: Belongs to a `Channel` or `DirectMessage` and a `User`.

---

#### **Core Functionality Requirements**

1. Store user data in the **User** model using Clerk for authentication.
2. Allow workspace creation, storing details in the **Workspace** model and linking to the creator’s `user_id`.
3. Enable users to create/join channels, storing details in the **Channel** model.
4. Allow real-time messaging via **Supabase** real-time features, storing messages in the **Message** model linked to a `Channel` or `DirectMessage`.
5. Implement user presence/status updates using a `status` field in the **User** model, synced via Supabase.

---

#### **Authorization Requirements (Clerk Integration)**

1. Authenticate users with Clerk to ensure only registered users access ChatGenius.
2. Restrict workspace creation to authenticated users by validating their Clerk `user_id`.
3. Allow only workspace members to access associated channels and messages.
4. Ensure private channels require specific user permissions to join or view messages.

---

### **Phase 2: File Sharing & Search**

#### **Data Models**

1. **File**
   - Fields: `id (UUID)`, `uploaded_by_user_id`, `workspace_id`, `channel_id`, `dm_id`, `file_url`, `file_type`, `file_size`, `created_at`.
   - Relationships: Belongs to a `User` and either a `Channel` or `DirectMessage`.
2. **SearchIndex**
   - Fields: `id (UUID)`, `model_type (message/file)`, `model_id`, `content`, `created_at`.
   - Relationships: Links to `Message` or `File`.

---

#### **Core Functionality Requirements**

1. Allow users to upload files to channels or DMs, storing file metadata in the **File** model and the actual files in Supabase Storage.
2. Implement search functionality using **Typesense** , indexing messages and file metadata stored in the **SearchIndex** model.

---

#### **Authorization Requirements (Clerk Integration)**

1. Restrict file uploads to authenticated users and ensure permissions align with channel or DM access rules.
2. Allow search only within channels or DMs the user is authorized to access.

---

### **Phase 3: Thread Support & Emoji Reactions**

#### **Data Models**

1. **Thread**
   - Fields: `id (UUID)`, `parent_message_id`, `channel_id`, `created_by_user_id`, `created_at`, `updated_at`.
   - Relationships: Belongs to a `Channel` and has many `Messages`.
2. **Reaction**
   - Fields: `id (UUID)`, `message_id`, `user_id`, `emoji`, `created_at`.
   - Relationships: Belongs to a `Message` and a `User`.

---

#### **Core Functionality Requirements**

1. Enable threaded conversations by linking messages to a parent thread using the **Thread** model.
2. Allow users to add emoji reactions to messages, storing them in the **Reaction** model.

---

#### **Authorization Requirements (Clerk Integration)**

1. Ensure only users with access to a channel or DM can view or participate in threads.
2. Allow emoji reactions only from users who can view the parent message.

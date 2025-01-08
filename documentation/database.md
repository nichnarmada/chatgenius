# Database Schema Documentation

## Overview

This document outlines the database schema for our chat/messaging system implemented in Supabase. The system consists of workspaces, channels, messages, and user profiles, with support for workspace invitations and direct messaging.

## Tables

### Workspaces

The root organization unit that contains channels and members.

**Schema:**

- `id` (uuid, PK): Unique identifier
- `name` (text): Workspace name
- `image_url` (text, nullable): Workspace avatar/image
- `created_by_user_id` (uuid, FK): Reference to creator's user ID
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

**Relationships:**

- `created_by_user_id` references `auth.users.id`

### Workspace Members

Junction table managing workspace membership and roles.

**Schema:**

- `workspace_id` (uuid, FK): Reference to workspace
- `user_id` (uuid, FK): Reference to user
- `role` (workspace_role): Member's role in the workspace
- `created_at` (timestamptz): When membership was created

**Relationships:**

- `workspace_id` references `workspaces.id`
- `user_id` references `auth.users.id`

### Channels

Communication channels within workspaces.

**Schema:**

- `id` (uuid, PK): Unique identifier
- `name` (text): Channel name
- `description` (text, nullable): Channel description
- `workspace_id` (uuid, FK): Parent workspace
- `created_by_user_id` (uuid, FK): Reference to creator
- `created_at` (timestamptz): Creation timestamp
- `updated_at` (timestamptz): Last update timestamp

**Relationships:**

- `workspace_id` references `workspaces.id`
- `created_by_user_id` references `auth.users.id`

### Messages

Messages sent in channels.

**Schema:**

- `id` (uuid, PK): Unique identifier
- `content` (text): Message content
- `user_id` (uuid, FK): Message sender
- `channel_id` (uuid, FK): Parent channel
- `created_at` (timestamptz): When message was sent
- `updated_at` (timestamptz): Last edit timestamp

**Relationships:**

- `user_id` references `auth.users.id`
- `channel_id` references `channels.id`

### Direct Messages

Private messages between users.

**Schema:**

- `id` (uuid, PK): Unique identifier
- `content` (text): Message content
- `workspace_id` (uuid, FK): Associated workspace
- `sender_id` (uuid, FK): Message sender
- `receiver_id` (uuid, FK): Message recipient
- `created_at` (timestamptz): When message was sent

**Relationships:**

- `workspace_id` references `workspaces.id`
- `sender_id` and `receiver_id` reference `auth.users.id`

### Workspace Invites

Manages invitations to join workspaces.

**Schema:**

- `id` (uuid, PK): Unique identifier
- `workspace_id` (uuid, FK): Target workspace
- `email` (text): Invitee's email
- `token` (uuid): Unique invitation token
- `role` (workspace_role): Offered role
- `invited_by` (uuid, FK): Reference to inviter
- `created_at` (timestamptz): When invite was sent
- `accepted_at` (timestamptz, nullable): When invite was accepted

**Relationships:**

- `workspace_id` references `workspaces.id`
- `invited_by` references `auth.users.id`

### Profiles

User profile information.

**Schema:**

- `id` (uuid, PK): Unique identifier
- `email` (text): User's email
- `display_name` (text, nullable): User's display name
- `avatar_url` (text, nullable): Profile picture URL
- `created_at` (timestamptz): Profile creation timestamp
- `updated_at` (timestamptz): Last update timestamp

**Relationships:**

- `id` references `auth.users.id`

## Row Level Security (RLS) Policies

Each table has specific RLS policies implemented to ensure proper access control. All policies are applied to the `authenticated` role unless otherwise specified.

### Workspaces

- SELECT: Users can view all workspaces
- INSERT: Users can create workspaces
- UPDATE: Owners can update workspace details
- DELETE: Owners can delete workspaces

### Workspace Members

- SELECT: Users can view workspace members
- INSERT: Users can join workspaces
- UPDATE: Owners can update member roles
- DELETE: Members can leave workspaces

### Channels

- SELECT: Users can view channels in their workspaces
- INSERT: Workspace owners can create channels
- UPDATE: Workspace owners can update channels
- DELETE: Workspace owners can delete channels

### Messages

- SELECT: Users can view messages in their channels
- INSERT: Users can insert messages in their channels
- UPDATE: Users can update their own messages
- DELETE: Users can delete their own messages

### Direct Messages

Applied to `public` role:

- SELECT: Users can view their direct messages
- INSERT: Users can send direct messages

### Profiles

- SELECT: Profiles are viewable by all authenticated users
- INSERT: Users can insert their own profile
- UPDATE: Users can update their own profile

### Workspace Invites

- SELECT: Users can view invites
- INSERT: Members can create invites
- DELETE: Members can delete invites

1. **Workspaces:**

   - Users can read workspaces they are members of
   - Only workspace admins can update workspace settings
   - Only authenticated users can create workspaces

2. **Channels:**

   - Users can read channels in workspaces they belong to
   - Only workspace admins can create/delete channels
   - Channel updates restricted to admins and moderators

3. **Messages:**

   - Users can read messages in channels they have access to
   - Users can only edit/delete their own messages
   - Messages inherit workspace/channel access control

4. **Direct Messages:**

   - Only sender and receiver can read their direct messages
   - Messages can only be sent to workspace members
   - Users can only delete their own sent messages

5. **Workspace Invites:**
   - Only workspace admins can create invites
   - Users can only see invites sent to their email
   - Invites are automatically deleted once accepted

## Enums

### workspace_role

- `owner`
- `member`

## Indexes

Consider adding indexes for:

- `workspace_members(workspace_id, user_id)`
- `messages(channel_id, created_at)`
- `direct_messages(workspace_id, sender_id, receiver_id)`
- `workspace_invites(email, workspace_id)`

## Notes for Collaborators

1. Always use UUID for primary keys and foreign keys
2. Implement soft deletes where appropriate using `deleted_at` timestamp
3. Ensure all timestamps use timestamptz for timezone awareness
4. Follow the established naming convention for consistency
5. Test RLS policies thoroughly when making schema changes

## Future Considerations

1. Message reactions/emoji support
2. Message threading
3. Channel categories/organization
4. User presence system
5. Message read receipts

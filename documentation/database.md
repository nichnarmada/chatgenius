# Database Schema Documentation

## Overview

This document outlines the database schema for our chat/messaging system implemented in Supabase. The system consists of workspaces, channels, messages, and user profiles, with support for workspace invitations and direct messaging.

## Tables

### Workspaces

- `id` (uuid, PK)
- `name` (text)
- `image_url` (text, nullable)
- `created_by_user_id` (uuid, FK → auth.users.id)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Workspace Members

- `workspace_id` (uuid, FK → workspaces.id)
- `user_id` (uuid, FK → auth.users.id)
- `role` (workspace_role): 'owner' | 'member'
- `created_at` (timestamptz)

### Channels

- `id` (uuid, PK)
- `name` (text)
- `description` (text, nullable)
- `workspace_id` (uuid, FK → workspaces.id)
- `created_by_user_id` (uuid, FK → auth.users.id)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Messages

- `id` (uuid, PK)
- `content` (text)
- `user_id` (uuid, FK → auth.users.id)
- `channel_id` (uuid, FK → channels.id)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `content_search` (tsvector)

### Reactions

- `id` (uuid, PK)
- `message_id` (uuid, FK → messages.id)
- `dm_message_id` (uuid, FK → direct_messages.id)
- `user_id` (uuid, FK → auth.users.id)
- `emoji` (text)
- `created_at` (timestamptz)

### Direct Messages

- `id` (uuid, PK)
- `content` (text)
- `workspace_id` (uuid, FK → workspaces.id)
- `sender_id` (uuid, FK → auth.users.id)
- `receiver_id` (uuid, FK → auth.users.id)
- `created_at` (timestamptz)

### Profiles

- `id` (uuid, PK, FK → auth.users.id)
- `email` (text)
- `display_name` (text, nullable)
- `avatar_url` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### Workspace Invites

- `id` (uuid, PK)
- `workspace_id` (uuid, FK → workspaces.id)
- `email` (text)
- `token` (uuid)
- `role` (workspace_role)
- `invited_by` (uuid, FK → auth.users.id)
- `created_at` (timestamptz)
- `accepted_at` (timestamptz, nullable)

## Row Level Security (RLS) Policies

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

## Notes

- All timestamps use timestamptz for timezone awareness
- Primary and foreign keys use UUIDs
- Workspace roles are limited to 'owner' and 'member'
- Message content is indexed using tsvector for full-text search
- Reactions can be attached to both regular messages and direct messages

## Future Considerations

1. Message reactions/emoji support
2. Message threading
3. Channel categories/organization
4. User presence system
5. Message read receipts

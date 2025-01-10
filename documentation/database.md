# Database Schema Documentation

## Overview

This document outlines the database schema for our chat/messaging system implemented in Supabase. The system consists of workspaces, channels, messages, and user profiles, with support for workspace invitations and direct messaging.

## Authentication vs Profile System

### Supabase Auth (auth.users)

The `auth.users` table is managed by Supabase Authentication and serves as the source of truth for user authentication. This table handles user credentials and core identity.

**Schema** (key fields):

- `id` (uuid, PK): Primary identifier for the user
- `email` (text): User's email address
- `phone` (text, nullable): User's phone number
- `confirmed_at` (timestamptz, nullable): When the user confirmed their email
- `email_confirmed_at` (timestamptz, nullable): When the email was confirmed
- `last_sign_in_at` (timestamptz, nullable): Last sign in timestamp
- `raw_app_meta_data` (jsonb): Application-specific metadata
- `raw_user_meta_data` (jsonb): User-specific metadata
- `created_at` (timestamptz): Account creation timestamp
- `updated_at` (timestamptz): Last update timestamp
- `deleted_at` (timestamptz, nullable): Account deletion timestamp
- `is_sso_user` (boolean): Whether the user authenticated through SSO

### Profile System (profiles)

The `profiles` table extends the auth.users table with application-specific user data. While auth.users handles authentication, profiles manages user-facing information and customization.

The relationship is:

- One-to-one relationship with auth.users
- profiles.id references auth.users.id
- Created upon user registration
- Handles display information and user preferences

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
- `thread_count` (int)

### Thread Messages

- `id` (uuid, PK)
- `content` (text)
- `user_id` (uuid, FK → auth.users.id)
- `parent_message_id` (uuid, FK → messages.id)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `content_search` (tsvector)

### Reactions

- `id` (uuid, PK)
- `message_id` (uuid, FK → messages.id)
- `dm_message_id` (uuid, FK → direct_messages.id)
- `thread_message_id` (uuid, FK → thread_messages.id)
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

### User Sessions

- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users.id)
- `last_seen_at` (timestamptz)

### User Status

- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users.id)
- `status` (user_status_type)
- `custom_status` (text)
- `updated_at` (timestamptz)

### Profiles

- `id` (uuid, PK, FK → auth.users.id)
- `email` (text)
- `display_name` (text, nullable)
- `avatar_url` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `is_profile_setup` (boolean)

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

### Workspaces (authenticated role)

- SELECT: Users can view all workspaces
- INSERT: Users can create workspaces
- UPDATE: Owners can update workspace details
- DELETE: Owners can delete workspaces

### Workspace Members (authenticated role)

- SELECT: Users can view workspace members
- INSERT: Users can join workspaces
- UPDATE: Owners can update member roles
- DELETE: Members can leave workspaces

### Channels (authenticated role)

- SELECT: Users can view channels in their workspaces
- INSERT: Workspace owners can create channels
- UPDATE: Workspace owners can update channels
- DELETE: Workspace owners can delete channels

### Messages (authenticated role)

- SELECT: Users can view messages in their channels
- INSERT: Users can insert messages in their channels
- UPDATE: Users can update their own messages
- DELETE: Users can delete their own messages

### Thread Messages (public role)

- SELECT: Users can view thread messages in their channels
- INSERT: Users can reply in threads in their channels
- UPDATE: Users can update their own thread messages
- DELETE: Users can delete their own thread messages

### Direct Messages (public role)

- SELECT: Users can view their direct messages
- INSERT: Users can send direct messages

### User Sessions (authenticated role)

- SELECT: Users can view their own sessions
- INSERT: Users can insert their own sessions
- UPDATE: Users can update their own sessions
- DELETE: Users can delete their own sessions

### User Status

- ALL (public role): Service role can manage all statuses
- ALL (authenticated role): Users can manage their own status
- SELECT (authenticated role): Users can view all statuses

### Profiles

- ALL (public role): Service role can manage all profiles
- ALL (authenticated role): Users can manage their own profile
- SELECT (authenticated role): Users can view all profiles

### Workspace Invites (authenticated role)

- SELECT: Users can view invites
- INSERT: Members can create invites
- DELETE: Members can delete invites

### Reactions

- SELECT (authenticated role): Users can see reactions on messages they can see
- INSERT (authenticated role): Users can add reactions to messages they can see
- DELETE (authenticated role): Users can delete their own reactions
- ALL (public role): Users can react to thread messages in their channels

## Enums

### workspace_role

- `owner`
- `member`

### user_status_type

- `online`
- `offline`
- `away`
- `busy`

## Indexes

Consider adding indexes for:

- `workspace_members(workspace_id, user_id)`
- `messages(channel_id, created_at)`
- `thread_messages(parent_message_id, created_at)`
- `direct_messages(workspace_id, sender_id, receiver_id)`
- `workspace_invites(email, workspace_id)`

## Database Design Notes

### Authentication and Profiles

- Supabase handles user authentication through the `auth.users` table
- Application user data is separated into the `profiles` table
- Profile setup status is tracked via `is_profile_setup` boolean
- Service role has full management capabilities for profiles
- This separation provides:
  - Clean distinction between auth concerns and application data
  - Flexibility to extend user profiles without modifying auth
  - Easier management of user-facing data
  - Better security through separation of concerns

### Technical Notes

- All timestamps use timestamptz for timezone awareness
- Primary and foreign keys use UUIDs
- Workspace roles are limited to 'owner' and 'member'
- Messages and thread messages use tsvector for full-text search
- Messages track thread count for UI purposes
- User sessions track last seen time for presence features
- User status supports both predefined types and custom status messages
- Reactions can be attached to regular messages, direct messages, and thread messages
- Service role provides administrative capabilities for profiles and user statuses

## Future Considerations

1. ~~Message reactions/emoji support~~
2. ~~Message threading~~
3. Channel categories/organization
4. ~~User presence system~~
5. Message read receipts

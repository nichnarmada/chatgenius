# Tech Stack

#### **Frontend Framework**

- **Next.js**: To build a performant, server-rendered chat application with built-in API routes for backend interaction.

#### **Styling**

- **Tailwind CSS**: For utility-first styling, ensuring rapid and consistent UI development.
- **shadcn/ui**: For accessible, pre-built UI components that work seamlessly with Tailwind.

---

#### **State Management**

- **React Context API**: Lightweight and sufficient for managing authentication, presence, and workspace state.
- **Zustand** : A simple, scalable library for more complex state needs like managing message data, user presence, or chat status.
- **React Query (TanStack Query)**: For efficient fetching, caching, and synchronization of real-time chat data and API interactions.

---

#### **Backend & Authentication**

- **Supabase**: Utilized for:
  - **Database**: Store structured data like users, messages, channels, and workspaces.
  - **Authentication**: Built-in auth with support for email/password, social logins, and magic links.
  - **Real-Time Messaging**: Use Supabase's real-time capabilities for WebSocket-based messaging and presence updates.
  - **Storage**: Handle any file-sharing needs in later phases.

---

#### **Search**

- **Typesense**: A lightweight, open-source search engine to enable fast message and file searches in Phase 2.

---

#### **File Storage**

- **Cloudinary**: For handling file storage and media optimization, enabling previews and responsive file management.

---

#### **DevOps and Deployment**

- **Vercel**: For deploying the Next.js app with seamless serverless function support, automatic scaling, and a smooth integration experience.

---

### **Integration Plan by Phase**

#### Phase 1: Core Features

1. **Authentication**: Use Supabase Auth for user authentication and data storage.
2. **Real-Time Messaging**: Use Supabase's real-time features to manage messaging and user presence.
3. **Channel/DM Organization**: Use Supabase to create and manage workspace, channel, and DM relationships.
4. **User Presence & Status**: Leverage Supabase real-time subscriptions for presence tracking.

#### Phase 2: Thread Support & Emoji Reactions

1. **Thread Support**: Add thread functionality using React Context API to manage nested message structures in Supabase.
2. **Emoji Reactions**: Store emoji reactions in Supabase with a simple schema extension.

#### Phase 3: File Sharing & Search

1. **File Sharing**: Integrate Supabase storage for file uploads or Cloudinary for media optimization.
2. **Search**: Implement Typesense for searching messages, files, and channels.

---

### **Why This Stack?**

1. **Supabase** provides a complete backend solution with authentication, real-time messaging, presence, and database needs while scaling efficiently.
2. **Next.js**, paired with **Vercel**, ensures fast, scalable deployments with modern SSR capabilities.
3. **Tailwind CSS** and **shadcn/ui** enable rapid and visually consistent UI development.
4. **Typesense** and **Cloudinary** are lightweight, scalable solutions for search and file storage without unnecessary complexity.

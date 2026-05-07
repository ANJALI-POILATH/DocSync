# DocuSync

A document generation platform for creating professional **BRD** (Business Requirements Document) and **SRS** (Software Requirements Specification) documents with a structured editor and PDF export.

## Features

- **Authentication** — Signup, login, logout, and forgot password via Supabase Auth
- **Project Management** — Create, view, and delete BRD/SRS projects, all scoped to the logged-in user
- **Document Builder** — Recursive section editor with rich text (Quill), tables, image uploads, and drag-and-drop reordering
- **Cover Page Settings** — Client name, cover title, prepared/approved by, version history, and custom background/header images
- **Preview & Export** — Full document preview with table of contents and PDF export via browser print
- **Undo/Redo** — Up to 50 levels of undo powered by Zundo

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand + Zundo (temporal) |
| Backend / DB | Supabase (Auth + PostgreSQL) |
| Rich Text | React Quill |
| Drag & Drop | @dnd-kit |
| Animations | Framer Motion |
| Charts | Recharts |
| PDF Export | Browser native print |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone <repo-url>
cd docusync
npm install
```

### 2. Configure environment

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up the database

Run the following SQL in your Supabase dashboard under **SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  scope text,
  "documentType" text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now(),
  requirements jsonb DEFAULT '[]'::jsonb,
  sections jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own projects"   ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
```

### 4. Disable email confirmation (for local dev)

In Supabase dashboard → **Authentication → Settings** → uncheck **Enable email confirmations**.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
src/
├── components/
│   ├── ui/          # Button, Card, Input
│   ├── Layout.jsx
│   └── Sidebar.jsx
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── CreateProject.jsx
│   ├── Requirements.jsx  # Document builder
│   └── Preview.jsx       # Preview + PDF export
├── store/
│   ├── useAuthStore.js   # Supabase auth
│   └── useProjectStore.js # Projects CRUD + sections
└── lib/
    └── supabase.js
```

## Exporting to PDF

1. Open a project and click **Preview Render**
2. Click **Export PDF**
3. In the print dialog, set destination to **Save as PDF**
4. Click Save — the file downloads with the project name and date as the filename

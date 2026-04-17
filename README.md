# Forma — Creative Workflow OS

A project and version management tool built specifically for freelance branding designers and small creative agencies.

## What it does

Forma helps designers manage the full arc of a branding project:

- **Clients → Projects → Deliverables → Versions** — a clear hierarchy that mirrors how designers actually work
- **Version tracking** — every iteration of every deliverable is logged with notes, assets, and status
- **Client feedback** — threaded comments per version, with resolve/reply, so nothing gets lost in email
- **Kanban board** — deliverables move through Pending → In Progress → In Review → Approved
- **Time tracking** — log hours per project and deliverable; see weekly summaries
- **Asset gallery** — thumbnail previews on cards, full gallery in version view

## Getting started

```bash
# Install dependencies
npm install

# Set up the database
npm run db:push

# Seed with demo data (creates a demo user + 3 clients + sample projects)
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with:
- **Email:** `alex@forma.studio`
- **Password:** `demo1234`

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (custom dark design system) |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js (credentials) |
| Hosting | Vercel-ready |

## Architecture

```
Clients
  └── Projects (status: Discovery → In Progress → Review → Delivered)
        └── Deliverables (type: Logo, Brand Identity, Social Kit…)
              └── Versions (v1, v2, v3…)
                    ├── Assets (images, files)
                    └── Feedback (threaded comments, resolvable)

TimeEntries (linked to project + optional deliverable)
```

## Screens

| Screen | Path |
|---|---|
| Dashboard | `/dashboard` |
| Client list | `/clients` |
| Client detail | `/clients/[id]` |
| Project (kanban) | `/projects/[id]` |
| Deliverable (versions + feedback) | `/deliverables/[id]` |
| Time log | `/time` |

## Migrating to PostgreSQL

Change `DATABASE_URL` in `.env` to your Postgres connection string and update `prisma/schema.prisma` provider from `sqlite` to `postgresql`.

## What's in V1 vs what's not

**In V1:**
- Full client/project/deliverable hierarchy
- Version history with asset gallery
- Threaded feedback per version
- Time logging
- Kanban board view
- Dark, designer-friendly UI

**Deliberately excluded from V1:**
- File uploads (uses image URLs; direct upload via API planned for V2)
- Real-time collaboration
- Client portal (share link so client can comment without login)
- Figma embed/sync
- Invoicing
- Email notifications
- Mobile app

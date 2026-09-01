# Western Industries — Stock Statement Register System

A production-ready, Vercel-deployable web application to digitalize physical stock statements and registers for **WESTERN INDUSTRIES**.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Neon PostgreSQL**, **Vercel Blob Storage**, **@react-pdf/renderer**, and **SheetJS (xlsx)**.

---

## 🌟 Architectural Rules & Features

1. **NO LOGIN / NO AUTHENTICATION**
   - Immediate access upon opening the website URL: Dashboard -> New Entry / Records / Reports.
   - Designed for trusted-user enterprise environments with basic accidental-deletion safety modals.

2. **SECURITY & SERVER-SIDE ISOLATION**
   - `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` remain strictly on the server-side inside API routes.
   - Zero exposure of secrets via `NEXT_PUBLIC_*`.

3. **NEON POSTGRESQL (Source of Truth)**
   - Normalized relational tables (`statements` and `statement_items`).
   - Server-generated sequential IDs per month/year (e.g. `WI-2026-09-0001`).
   - On-demand querying for dynamic monthly/yearly stock metrics and Excel report generation.

4. **VERCEL BLOB STORAGE (Persistent PDF Storage)**
   - Generated PDFs are stored in Vercel Blob at organized paths: `western-industries/{YEAR}/{MONTH}/{STATEMENT_NUMBER}.pdf`.
   - Blob URLs are saved in the `pdf_url` column of Neon PostgreSQL.
   - Deleting a statement automatically purges its associated PDF from Vercel Blob.

5. **DIGITAL PRINTABLE REGISTER PDF**
   - Built using `@react-pdf/renderer` (100% Vercel Serverless compatible without Chromium).
   - Replica layout of original Western Industries register with `S.No`, `DA No.`, `Date`, `Part No.`, `Opening Stock`, `Closing Stock`, multi-page handling, page numbers, and timestamps.

6. **MONTHLY & YEARLY EXCEL (.xlsx) REPORTS**
   - Dynamic `.xlsx` binary spreadsheet generation via SheetJS (`xlsx`).
   - **Monthly Workbook**: `Summary` sheet + detailed `Entries` sheet.
   - **Yearly Workbook**: `Monthly Summary` sheet + `All Statements` + `All Entries` sheet.

---

## 🛠️ Architecture Overview

```
                      VERCEL
                        │
                  Next.js App Router
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
  Neon PostgreSQL                 Vercel Blob
(Database Truth)              (Persistent PDFs)
  - statements                   - western-industries/
  - statement_items                  2026/09/WI-2026-09-0001.pdf
```

---

## 🚀 Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your Neon PostgreSQL connection string and Vercel Blob Read/Write token:
```env
DATABASE_URL="postgresql://user:pass@ep-cool-name.neon.tech/neondb?sslmode=require"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

### 3. Database Migration & Seed
Initialize Neon PostgreSQL schema:
```bash
npx prisma db push
```

Seed initial demo data (Vendor Code 32210 - Western Industries):
```bash
npx prisma db seed
```

### 4. Run Local Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🌐 Vercel Deployment Guide

1. Push code repository to GitHub.
2. Import project into Vercel dashboard.
3. Attach a **Vercel Blob** store to the project (automatically sets `BLOB_READ_WRITE_TOKEN`).
4. Set Environment Variable `DATABASE_URL` pointing to your **Neon PostgreSQL** database.
5. Deploy.

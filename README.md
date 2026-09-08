<div align="center">

# 🧾 CRM & RFQ Automation System

**Lead → RFQ Email → Extraction → Product Matching → Inventory Check → Quote → Human Review**

*A full-stack, human-in-the-loop RFQ automation pipeline*

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-default-07405E?logo=sqlite&logoColor=white)
![Postgres](https://img.shields.io/badge/PostgreSQL-ready-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/status-technical%20assignment-blue)

</div>

---

## 📌 Overview

This is a simplified, end-to-end implementation of a sales-ops automation pipeline that turns an inbound RFQ (request for quote) email into a reviewable, client-ready quote — with a human checkpoint before anything goes out the door.

```
┌──────┐    ┌───────────┐    ┌────────────┐    ┌──────────────────┐    ┌────────────────┐    ┌───────────────────┐
│ Lead │ →  │ RFQ Email │ →  │ Extraction │ →  │ Product Matching │ →  │ Inventory Check │ →  │ Quote → Review/HITL │
└──────┘    └───────────┘    └────────────┘    └──────────────────┘    └────────────────┘    └───────────────────┘
```

Built as a **React (Vite)** frontend + **Node.js / Express** backend + **SQLite** (zero-setup, file-based — trivially switchable to **PostgreSQL**).

---

## 📖 Table of Contents

1. [Project Structure](#-1-project-structure)
2. [Setup & Run](#-2-setup--run-local-demo)
3. [Live Demo Script](#-3-live-demo-script-rfq-pipeline-end-to-end)
4. [Database Design](#-4-database-design)
5. [API Reference](#-5-api-reference-summary)
6. [Design Notes & Approach](#-6-design-notes--approach)
7. [Known Simplifications](#-7-known-simplifications-given-assignment-scope)

---

## 📁 1. Project Structure

```
crm-rfq-system/
├── backend/                          # Node.js + Express API
│   ├── src/
│   │   ├── config/database.js        # Sequelize connection (sqlite by default, postgres-ready)
│   │   ├── models/                   # Sequelize models + associations
│   │   ├── middleware/auth.js        # JWT auth + role-based access control
│   │   ├── services/
│   │   │   ├── extractionService.js  # RFQ classification + line-item extraction (rule-based)
│   │   │   ├── matchingService.js    # Product matching (CAS / name / fuzzy token match) + stock check
│   │   │   └── quoteService.js       # Draft quote generation from matched line items
│   │   ├── controllers/              # Route handlers per module
│   │   ├── routes/                   # Express routers per module
│   │   ├── seed.js                   # Demo data (users, customers, products, inventory, leads)
│   │   ├── app.js                    # Express app (middleware + route mounting)
│   │   └── server.js                 # Entry point (DB sync + listen)
│   ├── .env.example
│   └── package.json
└── frontend/                         # React (Vite) SPA
    └── src/
        ├── api.js                    # Axios instance with JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/               # Navbar, ProtectedRoute, StatusBadge
        └── pages/                    # Login, Dashboard, Customers, Leads, Products,
                                       # RFQs (inbox + simulate intake), RFQDetail, Quotes, QuoteDetail
```

---

## ⚙️ 2. Setup & Run (local demo)

> Requires **Node.js 18+** (tested on Node 22).

### Backend

```bash
cd backend
npm install
cp .env.example .env      # defaults work out of the box (SQLite)
npm run seed               # creates demo users, customers, products, inventory, leads
npm start                  # starts API on http://localhost:5000
```

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173, proxies /api to :5000
```

Open **http://localhost:5173** and log in with one of the seeded demo accounts (password for all accounts: `Password@123`):

| Role | Email | Can do |
|:--|:--|:--|
| 🛡️ **Admin** | `admin@demo.com` | Everything, including deleting products |
| 💼 **Sales** | `sales@demo.com` | Create/manage leads, customers, products, RFQs, quotes |
| ✅ **Reviewer** | `reviewer@demo.com` | Everything Sales can, **plus** approve/reject quotes (HITL) |

> **Note:** Only `admin` / `reviewer` roles can approve or reject a quote — this mirrors the human-in-the-loop checkpoint from the sprint note. `sales` receives a `403` if it attempts this.

### Using PostgreSQL instead of SQLite

The whole app runs on SQLite by default so it can be graded with zero external setup. To point it at PostgreSQL instead:

1. Create a database, e.g. `createdb crm_rfq`.
2. In `backend/.env`, set:
   ```env
   DB_DIALECT=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=crm_rfq
   DB_USER=postgres
   DB_PASSWORD=postgres
   ```
3. Install the Postgres driver (not bundled by default to keep the SQLite path light):
   ```bash
   npm install pg pg-hstore
   ```
4. Re-seed and start:
   ```bash
   npm run seed && npm start
   ```
   Sequelize/migrations code is dialect-agnostic — no other changes needed.

---

## 🎬 3. Live Demo Script (RFQ pipeline end-to-end)

1. **Log in as Sales Rep.**
2. Go to **Products & Inventory** — add a new product or adjust stock on an existing one (e.g. drop *"Potassium Sorbate"* stock to trigger the low-stock flag).
3. Go to **RFQ Inbox → "Simulate Incoming Email / Manual RFQ."** Click one of the **quick-fill sample emails** (or paste your own free-text RFQ email), then **Run Extraction & Matching**.
   - The system classifies whether the text is an RFQ (with a confidence score), splits it into line items, and matches each against the product catalog by CAS number, name, or fuzzy text.
4. On the **RFQ detail page**: review extracted items, correct any mismatched product from the dropdown if needed, click **Run Inventory Check** to see live stock availability per line, then **Generate Quote**.
5. Go to the generated **Quote** (or navigate via the Quotes tab). Log in as **Reviewer** (or switch role) to **Approve & Send to Client** or **Reject**, optionally editing quantity/price first.
6. Back on the RFQ, status now reflects `approved` — the HITL loop is closed.

---

## 🗄️ 4. Database Design

| Table | Key Fields | Relationships |
|:--|:--|:--|
| `users` | name, email *(unique)*, password_hash, role *(admin/sales/reviewer)* | 1—N `leads` (assigned_to), `rfqs` (created_by), `quotes` (reviewed_by) |
| `customers` | name, company, email *(unique)*, phone, territory | 1—N `leads`, `rfqs`, `quotes` |
| `leads` | customer_id (FK), source *(event/meeting/campaign/inbound_\*/website_form/outbound_cold)*, status, category, assigned_to (FK) | N—1 `customers`, N—1 `users` |
| `products` | name, cas_number *(unique)*, category, unit, unit_price, aliases | 1—1 `inventory`, 1—N `rfq_items`, `quote_items` |
| `inventory` | product_id (FK, unique), quantity_available, reorder_level, warehouse_location | 1—1 `products` |
| `rfqs` | customer_id (FK), lead_id (FK, optional), source_channel, sender_email, subject, raw_body, status, is_rfq, confidence_score, created_by (FK) | 1—N `rfq_items`; 1—1 `quotes` |
| `rfq_items` | rfq_id (FK), raw_text, matched_product_id (FK, optional), match_confidence, requested_quantity, unit, is_trading_item | N—1 `rfqs`, N—1 `products` |
| `quotes` | rfq_id (FK, unique), customer_id (FK), status *(draft/pending_approval/approved/rejected/sent)*, total_amount, reviewed_by (FK), reviewed_at, review_notes | 1—1 `rfqs`; 1—N `quote_items` |
| `quote_items` | quote_id (FK), product_id (FK), quantity, unit_price, available_stock_at_quote, in_stock, line_total | N—1 `quotes`, N—1 `products` |

**Validation highlights:**
- Unique constraints on emails and CAS numbers
- Enum-constrained `status` / `role` / `source` fields
- Non-negative price validation at the API layer (`express-validator`)
- A DB transaction wraps product + inventory row creation so the two never drift out of sync

---

## 🔌 5. API Reference (summary)

All routes **except** `/api/auth/login` and `/api/auth/register` require:
```
Authorization: Bearer <token>
```

| Method | Route | Notes |
|:--|:--|:--|
| `POST` | `/api/auth/register`, `/api/auth/login` | Returns `{ token, user }` |
| `GET` | `/api/auth/me` | Current user |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/customers[/:id]` | CRUD |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/leads[/:id]` | CRUD, filter by `?status=` / `?source=` |
| `GET`/`POST`/`PUT`/`DELETE` | `/api/products[/:id]` | CRUD (admin/sales for write); creates linked inventory row |
| `GET` | `/api/products/inventory/all` | All inventory rows with product |
| `PUT` | `/api/products/:productId/inventory` | Adjust stock/reorder level/location |
| `GET` | `/api/rfqs[/:id]` | List/detail (with items, customer, matched products) |
| `POST` | `/api/rfqs/simulate-intake` | 🎯 **Core demo endpoint** — body `{ subject, sender_email, body, customer_id?, source_channel? }`; runs classification + extraction + matching |
| `PUT` | `/api/rfqs/:id/items/:itemId` | Manually correct a line item's matched product / qty |
| `GET` | `/api/rfqs/:id/inventory-preview` | Live stock check per matched item |
| `POST` | `/api/rfqs/:id/generate-quote` | Builds a draft `Quote` + `QuoteItem`s |
| `GET` | `/api/quotes[/:id]` | List/detail |
| `PUT` | `/api/quotes/:id/items/:itemId` | Edit qty/price pre-approval |
| `POST` | `/api/quotes/:id/approve` | 🔒 **admin/reviewer only** — HITL checkpoint, marks quote `sent` |
| `POST` | `/api/quotes/:id/reject` | 🔒 **admin/reviewer only** |

---

## 🧠 6. Design Notes & Approach

**Extraction is rule-based, not an LLM call**
This keeps it deterministic, fast, free to run, and transparent to explain/debug live (`backend/src/services/extractionService.js`). It classifies RFQ-vs-not using a keyword + quantity-pattern heuristic with a confidence score, then splits the body into candidate line items using regex for quantity+unit patterns (`500 kg`, `2 MT`, …) and CAS numbers (`\d{2,7}-\d{2}-\d`). This mirrors the sprint note's "manual-oversight training window" concept — every extraction ships with a confidence score the UI surfaces, and low-confidence/unmatched items are always editable by a human before a quote is generated.

> 💡 In a production build, this single function would be the natural place to swap in an LLM-based extraction call (e.g. Claude with structured output) without touching any other layer — the `RFQItem` shape stays the same.

**Product matching** (`matchingService.js`) prioritizes:
1. Exact **CAS number** match *(unambiguous identifier)*
2. Exact **name/alias** match
3. **Token-overlap fuzzy** match

Each tier carries an explicit confidence score and threshold, so a reviewer always sees *why* something matched (or didn't).

**HITL is enforced at the API layer, not just the UI** — only `admin`/`reviewer` roles can hit the approve/reject endpoints (`403` otherwise), matching the sprint note's requirement that nothing goes to a client without a human check.

**Inventory is a separate table** (not a column on `Product`) so it can carry its own metadata (reorder level, warehouse) and be extended later (e.g. per-warehouse rows) without touching the product schema.

**SQLite for the demo, Postgres-ready** — Sequelize abstracts the dialect difference entirely; switching is a config change, not a code change.

---

## ⚠️ 7. Known Simplifications (given assignment scope)

- The **trading-item (vendor-sourced)** sub-flow from the sprint note is modeled with an `is_trading_item` flag on `RFQItem`, but the outbound-vendor-RFQ loop itself is out of scope here, consistent with the sprint note's Phase 2d exclusion.
- **Linking an RFQ to a customer after creation** isn't exposed in the UI yet (only at intake time / via auto-detect-by-sender-email) — this is noted directly on the RFQ detail page when it's missing.
- **No automated tests** included given the timeline; all endpoints were manually verified end-to-end (see demo script above), including RBAC and validation failure paths.

---

<div align="center">

*Built as a technical assignment demonstrating a full RFQ automation pipeline with a human-in-the-loop review checkpoint.*

</div>

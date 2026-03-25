# Testing NetFlow Manager

## Prerequisites
- Node.js 18+
- npm

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client and push schema to SQLite:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   **Important**: The `prisma db push` step is required before the app will work. Without it, all API calls will fail with `PrismaClientKnownRequestError: The table main.hosts does not exist`. This is easy to miss on a fresh checkout.

3. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:3000`.

## Key Pages
- `/` - Dashboard (stats cards, charts, recent hosts)
- `/hosts` - Host list with search/filter
- `/hosts/new` - Create new host form
- `/hosts/[id]` - Host detail page (info, status, flow records, collection controls)
- `/hosts/[id]/edit` - Edit host form
- `/flows` - Flow records with filtering by host, source/destination IP, protocol

## Testing Workflow

### Host CRUD
1. Verify empty Dashboard shows 0 in all stat cards and "Nenhum host cadastrado"
2. Create a host via `/hosts/new` with required fields: Nome, Endereco IP, Fabricante, Tipo, Protocolo de Flow
3. Verify redirect to `/hosts` and host card appears with correct data
4. Click "Detalhes" to view host detail page - verify all fields, status badges
5. Click "Editar" to edit - verify form is pre-populated, make changes, verify update persists
6. Return to Dashboard - verify stats updated (Total de Hosts, Hosts Ativos)
7. Test duplicate IP: try creating host with same IP, expect error "Ja existe um host com este endereco IP"

### Flows Page
1. Navigate to `/flows`
2. Verify "0 registros encontrados" with empty state
3. Verify host filter dropdown contains created hosts
4. Verify protocol filter has TCP, UDP, ICMP, GRE, ESP options

### Flow Collection (requires nfcapd/nfdump)
- The "Iniciar Coleta" / "Parar Coleta" buttons on host detail pages control nfcapd processes
- This requires `nfcapd` and `nfdump` to be installed on the system
- Without these tools, collection will fail but the UI buttons still render correctly
- The nfcapd data directory defaults to `/tmp/nfcapd-data` (configurable via `NFCAPD_DATA_DIR` env var)

## Known Issues
- Prisma v5 is used (not v7) because v7 requires adapter packages for SQLite
- The `nfdump` CSV parsing uses hardcoded column indices which might break across nfdump versions
- In-memory collector state (activeCollectors Map) is lost on server restart
- No authentication - all endpoints are publicly accessible

## Tech Stack
- Next.js 16 (App Router) + TypeScript
- Prisma v5 + SQLite
- Tailwind CSS (dark theme)
- Recharts for data visualization

## Devin Secrets Needed
No secrets are required for local testing.

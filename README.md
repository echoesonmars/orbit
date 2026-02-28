# 🚀 OrbitAI: The Cognitive OS for the NewSpace Economy

**Live Demo**: [https://orbit-ai-theta.vercel.app/en](https://orbit-ai-theta.vercel.app/en)  
**Test Credentials**: `admin@gmail.com` / `12345678`

OrbitAI is a high-performance, modular decision-intelligence platform designed to bridge the gap between orbital mechanics and business ROI. It provides a verticalized suite of 10 intelligence modules for mission planning, telemetry forensics, and orbital sustainability.

---

## 🏗 Solution Architecture

OrbitAI utilizes a **Distributed Microservices Architecture** designed for high-concurrency aerospace simulations.

| Layer | Role | Description |
|-------|------|-------------|
| **Command Center (Frontend)** | `apps/orbit-front` | Next.js (App Router) client with real-time orbital visualizations (Canvas API), performance-heavy charts, and a glassmorphism design system. Serves the dashboard and all 10 intelligence modules. |
| **Intelligence Gateway (Middleware)** | `services/gateway` | Node.js/Express service acting as a secure orchestrator. Handles Zod-based contract validation and Supabase Auth (JWT) verification for both web and mobile-ready endpoints. Proxies requests to ML-API and returns unified responses. |
| **Compute Engine (ML-API)** | `services/ml-api` | High-performance Python core handling heavy mathematical modeling, unsupervised ML inference, GIS processing, and PDF report generation. No direct public access; all traffic goes through the Gateway. |
| **Persistence Layer** | Supabase | PostgreSQL + PostGIS (geospatial queries), Row Level Security (RLS), Supabase Auth, and S3-compatible storage for mission dossiers and uploads. |

---

## 📂 Repository Structure

The project is a **monorepo**. Key directories:

```
orbit/
├── apps/orbit-front/     # Next.js frontend (dashboard, map, all modules)
├── services/
│   ├── gateway/          # Express API gateway (auth, validation, proxy to ML-API)
│   └── ml-api/           # FastAPI Python service (ML, GIS, reports)
├── infra/
│   └── db/               # SQL migrations for Supabase (PostGIS, profiles, missions, predictions)
├── file_structure.md    # Detailed folder and file description
└── details.md            # Technical architecture and specification
```

For a full breakdown of folders and files, see [file_structure.md](file_structure.md) and [details.md](details.md).

---

## 💻 Technology Stack (Audited Versions)

### Frontend (`apps/orbit-front`)

| Category | Technologies |
|----------|--------------|
| **Core** | Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5.x |
| **State & Forms** | Zustand 5.0.11, React Hook Form 7.71.2, Zod 4.3.6, @hookform/resolvers 5.2.2 |
| **Geospatial** | Leaflet 1.9.4, React-Leaflet 5.0.0, React-Leaflet-Draw 0.21.0 |
| **Charts & Motion** | Recharts 2.15.4, Framer Motion 12.34.3, Embla Carousel 8.6.0 |
| **UI & Theming** | Tailwind CSS 3.4.19, Shadcn UI, Lucide React 0.575.0, Next-Themes 0.4.6 |
| **i18n** | Next-Intl 4.8.3 |
| **Backend** | @supabase/supabase-js 2.97.0, @supabase/ssr 0.8.0 |

### API Gateway (`services/gateway`)

- **Runtime**: Node.js, Express 5.2.1, TypeScript 5.9.3  
- **Validation**: Zod 4.3.6 for request/response contracts  
- **HTTP & Uploads**: Axios 1.13.5, Multer 1.4.5-lts.1 (CSV), Form-Data 4.0.0  
- **Security**: CORS 2.8.6, Supabase JWT verification via @supabase/supabase-js  

### ML-API (`services/ml-api`)

- **Web**: FastAPI 0.115.0, Uvicorn 0.30.0  
- **AI**: OpenAI 1.50.0 (GPT-4o-mini for Mission Designer and Report summaries), Pydantic 2.9.0  
- **ML & Analytics**: Scikit-Learn 1.4.0 (e.g. Isolation Forest), NumPy 1.26.0, Pandas 2.2.0  
- **GIS & STAC**: Pystac-Client 0.8.0 (Earth Search v1 — AWS Element84)  
- **Reports**: Matplotlib 3.8.0, ReportLab 4.0.0 (PDF generation)  
- **Utils**: Python-Multipart 0.0.18, Supabase 2.0.0  

---

## 🧠 The 10 Intelligence Modules

| # | Module | Description |
|---|--------|-------------|
| 1 | **Value Predictor** | Multi-factor pricing engine. Integrates **NASA EONET** (Crisis Zones) and **NASA DONKI** (Solar Weather) to calculate real-time asset value and confidence. |
| 2 | **Failure Forensics** | **Unsupervised ML** using Isolation Forest (contamination ≈ 0.03). Analyzes telemetry CSV to detect sensor drift and anomalies 48–72h before secondary subsystem failure. |
| 3 | **Scenario Simulator** | High-fidelity **Monte Carlo** engine (e.g. 10,000 runs). Models P10–P90 ROI percentiles against launch risk and degradation. |
| 4 | **ESG Assessor** | Deterministic **Life Cycle Assessment (LCA)**. Scores CO₂, Black Carbon, and Alumina footprints across 6 propellant types; checks **UN IADC 25-yr deorbit** compliance. |
| 5 | **Orbit Optimizer** | Physics engine: **Hohmann Transfer**, **Simple Plane Change**, **Tsiolkovsky Equation** for delta-V and fuel-mass optimization. Optional 3D orbit visualization. |
| 6 | **Orbit Scorer** | **MCDA (Multi-Criteria Decision Analysis)**. Evaluates 8 business profiles (IoT, Telecom, SAR, etc.) against Coverage, Revisit, Latency, Resolution, and Radiation. |
| 7 | **Data Hub** | STAC API orchestrator. Cloud-cover filtering, deterministic pricing per scene, auto-upsert to `satellite_scenes` in Supabase. |
| 8 | **Report Generator** | Dossier engine. Combines **GPT-4 Executive Summaries**, Factor Waterfall charts, and Mapbox static imagery into analytical PDFs. |
| 9 | **Mission Designer** | AI Architect: NLP-to-Mission-Spec translation, optimal orbit and sensor type (SAR vs Optical) from business goals. |
| 10 | **Launch Delay Predictor** | Probability engine using **Rocket Reliability** success rates, **Spaceport** constraints, and **Open-Meteo** weather scrub risks. Data from Launch Library 2 API. |

---

## 🛠 Setup & Launch Instructions

### Prerequisites

- **Node.js** `v20+` (for frontend and gateway)  
- **Python** `3.11+` (for ML-API)  
- **Docker** (optional, for running infra or full stack via Docker Compose)  

### 1. Environment configuration

Use `.env.example` at the repository root (or in each app) as a template. Copy to `.env` and fill in values.

**Required variables**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend admin, storage, server-side DB access) |
| `OPENAI_API_KEY` | Used by Mission Designer and Report Generator summaries |
| `NASA_API_KEY` | For EONET and DONKI ([api.nasa.gov](https://api.nasa.gov)) |
| `MAPBOX_TOKEN` | Static map images in PDF reports |
| `ML_API_URL` | ML-API base URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_GATEWAY_URL` | Gateway base URL (e.g. `http://localhost:3001`) |

**Optional / module-specific**

| Variable | Description |
|----------|-------------|
| `OPEN_METEO_*` | Launch Delay Predictor can use Open-Meteo for weather; defaults or env may be used |
| `PORT` (Gateway) | Gateway listen port (default: `3001`) |

### 2. Database (Supabase)

- Create a Supabase project and enable **PostGIS**.
- Run migrations from `infra/db/` (e.g. `00_init_schema.sql`) to create `profiles`, `missions`, `predictions`, and RLS policies. This ensures the dashboard and Value Predictor can read/write missions and predictions.

### 3. Start services (order matters)

**Step 1 — ML-API (Python)**

```bash
cd services/ml-api
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Step 2 — Gateway (Node.js)**

```bash
cd services/gateway
npm install
npm run dev
```

Default port: **3001**. Ensure `NEXT_PUBLIC_GATEWAY_URL` in the frontend points to this URL.

**Step 3 — Frontend (Next.js)**

```bash
cd apps/orbit-front
npm install
npm run dev
```

Default port: **3000**. Open [http://localhost:3000](http://localhost:3000) and sign in with the test credentials above.

### 4. Development scripts summary

| Service | Command | Purpose |
|---------|---------|---------|
| Frontend | `npm run dev` | Next.js dev server |
| Frontend | `npm run build` | Production build |
| Gateway | `npm run dev` | Nodemon + ts-node |
| Gateway | `npm run build` | Compile TypeScript to `dist/` |
| ML-API | `uvicorn app.main:app --host 0.0.0.0 --port 8000` | FastAPI server |

---

## 📈 Demonstration Workflow

1. **Sign in** at the app with `admin@gmail.com` / `12345678`.  
2. **Dashboard (Map)**  
   - Draw a bounding box on the map.  
   - Use the context panel to open **Value Predictor**, **Mission Designer**, **Data Hub**, or **Reports**.  
3. **Value Predictor**  
   - Enter or use map coordinates, run analysis, then generate a PDF report (Executive Summary + waterfall + map).  
4. **Scenario Simulator**  
   - Set financials, risk, revenue, and run a Monte Carlo simulation to see P10–P90 ROI and fan charts.  
5. **Failure Forensics**  
   - Upload a telemetry CSV, set sensitivity, run analysis to see anomaly detection and charts.  
6. **ESG Assessor**  
   - Select propellant and parameters to get CO₂ and deorbit compliance.  
7. **Orbit Optimizer / Orbit Scorer**  
   - Define orbits and business goal to compare scores and radar charts.  
8. **Launch Delay**  
   - Browse upcoming launches and run delay probability (weather, reliability).  
9. **Mission Designer**  
   - Describe the mission in natural language to get orbit and sensor recommendations.  
10. **Data Hub**  
    - Search STAC catalog, filter by cloud cover, view scenes and pricing.  
11. **Reports**  
    - List and download generated PDF reports.  

---

## 📚 Documentation

- **[file_structure.md](file_structure.md)** — Monorepo folder and file layout.  
- **[details.md](details.md)** — Technical architecture, module responsibilities, and stack details.  

---

## 🔧 Troubleshooting

- **Gateway returns 502 / ML-API unreachable**  
  Ensure ML-API is running on the port set in `ML_API_URL` (default 8000). Gateway proxies `/api/v1/*` to ML-API.  

- **Frontend cannot reach API**  
  Check `NEXT_PUBLIC_GATEWAY_URL` (e.g. `http://localhost:3001`). CORS is configured on the Gateway for the frontend origin.  

- **Supabase RLS / "permission denied"**  
  Run `infra/db/00_init_schema.sql` and ensure the user is authenticated; RLS policies restrict data to `auth.uid()`.  

- **Report PDF / Mapbox images fail**  
  Ensure `MAPBOX_TOKEN` is set in the environment used by ML-API (or the service that generates reports).  

- **Launch Delay / Value Predictor data empty**  
  External APIs (Launch Library 2, NASA EONET/DONKI, Open-Meteo) must be reachable from ML-API; check network and API keys.  

---

© 2026 OrbitAI Intelligence. "Securing the Future of Earth's Orbit."

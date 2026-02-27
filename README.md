# 🚀 OrbitAI: The Cognitive OS for the NewSpace Economy

OrbitAI is a high-performance, modular decision-intelligence platform designed to bridge the gap between orbital mechanics and business ROI. It provides a verticalized suite of 10 intelligence modules for mission planning, telemetry forensics, and orbital sustainability.

---

## 🏗 Solution Architecture
OrbitAI utilizes a **Distributed Microservices Architecture** designed for high-concurrency aerospace simulations.

- **Command Center (Frontend)**: Next.js (App Router) client featuring real-time orbital visualizations (Canvas API), performance-heavy charts, and a glassmorphism design system.
- **Intelligence Gateway (Middleware)**: Node.js/Express service acting as a secure orchestrator. Handles Zod-based contract validation and Supabase Auth (JWT) verification for both web and mobile-ready endpoints.
- **Compute engine (ML-API)**: High-performance Python core handling heavy mathematical modeling, unsupervised ML inference, and GIS processing.
- **Persistence Layer**: PostgreSQL + PostGIS (via Supabase) with Row Level Security (RLS) and S3-compatible storage for mission dossiers.

---

## 💻 Exhaustive Technology Stack (Audited Versions)

### Frontend (`apps/orbit-front`)
- **Core Framework**: `Next.js 16.1.6` (App Router), `React 19.2.3`
- **Logic & State**: `TypeScript 5.x`, `Zustand 5.0.11`
- **Valdiation & Forms**: `Zod 4.3.6`, `React Hook Form 7.71.2`, `@hookform/resolvers 5.2.2`
- **Geospatial UI**: `Leaflet 1.9.4`, `React-Leaflet 5.0.0`, `React-Leaflet-Draw 0.21.0`
- **Data Visualization**: `Recharts 2.15.4`, `Framer Motion 12.34.3`, `Embla Carousel 8.6.0`
- **Aesthetics**: `Tailwind CSS 3.4.19`, `Shadcn UI`, `Lucide React 0.575.0`, `Next-Themes 0.4.6`
- **Localization**: `Next-Intl 4.8.3`
- **Backend Integration**: `@supabase/supabase-js 2.97.0`, `@supabase/ssr 0.8.0`

### API Gateway (`services/gateway`)
- **Server**: `Express 5.2.1` (Node.js)
- **Language**: `TypeScript 5.9.3`
- **Contract Validation**: `Zod 4.3.6`
- **Data Streaming**: `Axios 1.13.5`, `Multer 1.4.5-lts.1` (Binary CSV handling), `Form-Data 4.0.0`
- **Security**: `Cors 2.8.6`, `@supabase/supabase-js 2.97.0`

### ML-API (`services/ml-api`)
- **Web Layer**: `FastAPI 0.115.0`, `Uvicorn 0.30.0`
- **AI Core**: `OpenAI 1.50.0` (GPT-4o-mini), `Pydantic 2.9.0`
- **ML / Analytics**: `Scikit-Learn 1.4.0` (Isolation Forest), `NumPy 1.26.0`, `Pandas 2.2.0`
- **GIS & STAC**: `Pystac-Client 0.8.0` (Earth Search v1 - AWS Element84)
- **Reporting & Visuals**: `Matplotlib 3.8.0`, `ReportLab 4.0.0` (High-fidelity PDF generation)
- **Utility**: `Python-Multipart 0.0.18`, `Supabase 2.0.0`

---

## 🧠 The 10 Intelligence Modules

1.  **Value Predictor**: Multi-factor pricing engine. Integrates **NASA EONET** (Crisis Zones) and **NASA DONKI** (Solar Weather storm levels) to calculate real-time asset value.
2.  **Failure Forensics**: **Unsupervised ML** using `Isolation Forest` (contamination=0.03). Analyzes telemetry sensor drift to detect failures 48-72h before secondary subsystem death.
3.  **Scenario Simulator**: High-fidelity **Monte Carlo** engine executing 10,000 parallel lifecycles. Models P10-P90 ROI percentiles against launch risk and degradation.
4.  **ESG Assessor**: Deterministic **Life Cycle Assessment (LCA)**. Scores CO2, Black Carbon, and Alumina footprints across 6 propellant types and checks **UN IADC 25-yr deorbit** status.
5.  **Orbit Optimizer**: Physics engine implementing **Hohmann Transfer**, **Simple Plane Change**, and the **Tsiolkovsky Equation** for optimal delta-V and fuel-mass analysis.
6.  **Orbit Scorer**: **MCDA (Multi-Criteria Decision Analysis)**. Evaluates 8 business profiles (IoT, Telecom, SAR) against 5 key metrics: Coverage, Revisit, Latency, Resolution, and Radiation.
7.  **Data Hub**: Managed Search orchestrator for the **STAC API**. Features cloud-cover filtering, deterministic pricing per scene, and auto-upserting to `satellite_scenes` in Supabase.
8.  **Report Generator**: Dossier engine. Combines **GPT-4 Executive Summaries** with custom Factor Waterfall charts and Mapbox static imagery into analytical PDFs.
9.  **Mission Designer**: AI Architect providing NLP-to-Mission-Spec translation, choosing optimal orbits and sensor types (SAR vs Optical) based on business goals.
10. **Launch Delay Predictor**: Probability engine reflecting **Rocket Reliability** success rates, **Spaceport Historical** constraints, and real-time **Open-Meteo** weather scrub risks.

---

## 🛠 Setup & Launch Instructions

### Prerequisites
- Node.js `v20+` | Python `3.11+` | Docker

### 1. Environment Config
Templates are provided in `.env.example`. Required configurations for:
- `apps/orbit-front/.env.local`
- `services/gateway/.env`
- `services/ml-api/.env`

### 2. Service-Specific Initialization
**Phase 1: ML-API**
```bash
cd services/ml-api
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Phase 2: Gateway**
```bash
cd services/gateway
npm install
npm run dev
```

**Phase 3: Frontend**
```bash
cd apps/orbit-front
npm install
npm run dev
```

---

## 📈 Demonstration Workflow
1. **Interactive ROI**: Use the Scenario Simulator to visualize risk-adjusted financial curves.
2. **Anomaly Detection**: Upload telemetry CSVs to trigger ML cluster analysis.
3. **Orbital Sustainability**: Grade a mission's ESG status in real-time.

---
© 2026 OrbitAI Intelligence. "Securing the Future of Earth's Orbit."

# Aero-Procure: UK Day-Ahead Wind Forecasting & Thermal Procurement Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An institutional-grade decision platform engineered specifically for **UK energy utility power purchasing desks** operating in the Great Britain Day-Ahead wholesale power market (EPEX SPOT / Nord Pool GB). 

The platform addresses two operational challenges:
1. **Decision-Time Forecast Clarity**: Determining the exact latest national wind generation forecast available before the Day-Ahead auction gate closure (11:00 UTC on Day D-1) without lookahead bias.
2. **Quantitative Error Evaluation & Risk-Adjusted Buffer Sizing**: Statistically evaluating wind forecast errors across January 2026 and calculating the empirical thermal generation reserve cushion needed to prevent catastrophic imbalance cashout penalties.

---

## 🔗 Live Application Links

- **Frontend Deployment (Vercel)**: [https://aero-procure-uk.vercel.app](https://aero-procure-uk.vercel.app) *(or your deployed Vercel URL)*
- **Backend API & Swagger Docs (Heroku/Render)**: [https://aero-procure-backend.herokuapp.com/docs](https://aero-procure-backend.herokuapp.com/docs)
- **Demo Video Walkthrough (Unlisted YouTube)**: *[Insert your Unlisted YouTube Video Link Here]*

---

## 📑 Table of Contents

- [Business & Domain Context](#business--domain-context)
- [Key Features](#key-features)
- [Directory & File Structure](#directory--file-structure)
- [Quantitative Methodology](#quantitative-methodology)
- [How to Run Locally](#how-to-run-locally)
- [Running with Docker](#running-with-docker)
- [Deployment Guide](#deployment-guide)
- [Automated Testing Suite](#automated-testing-suite)
- [AI Tools Attribution](#ai-tools-attribution)

---

## ⚡ Business & Domain Context

In the UK electricity wholesale market:
- Bids for the Day-Ahead Market (e.g. EPEX SPOT Day-Ahead Auction) must be submitted by **11:00 GMT/UTC on Day D-1** for delivery across all 48 half-hour settlement periods of Day D.
- Utilities must purchase enough energy to meet consumer demand. While renewable wind energy has zero fuel cost, it is intermittent and weather-dependent.
- If wind generation underperforms compared to the forecast, the utility is left short in real-time and must settle the deficit via the **System Buy Price (SBP)**, which regularly spikes during cold winter peak hours.
- If wind generation is over-forecasted, the utility over-contracts expensive thermal power and dumps surplus power at low System Sell Prices (SSP).
- **Scope Limit**: As specified, this platform utilizes only national-level actuals (`FUELHH` where `fuelType == "WIND"`) and forecasts (`WINDFOR`) from Elexon BMRS for decisions made in **January 2026**.

---

## 🚀 Key Features

1. **D-1 Gate Closure Freezing Engine**:
   - Reconstructs the exact forecast curve known to traders prior to Day-Ahead gate closure (configurable: 07:00, 09:30, 11:00 UTC auction cut-off, 12:00, 15:30, 18:30 UTC).
   - Completely eliminates lookahead bias.
2. **Comprehensive Statistical Error Suite**:
   - Computes MAE, RMSE, WAPE (Weighted Absolute Percentage Error), MAPE, Mean Bias Error (MBE), and signed error quantiles (P10, P25, P50, P75, P90, P95).
3. **Interactive Thermal Procurement & Buffer Sizing Optimizer**:
   - Allows traders to specify their utility's baseline consumer demand (MW) and target risk tolerance (80% - 99%).
   - Calculates baseline thermal procurement and dynamically sizes the thermal reserve cushion based on empirical January 2026 wind shortfall quantiles.
   - Retrospectively validates how many imbalance shortfall events were averted.
4. **Settlement Period Diurnal Risk Analysis (SP 1 to 48)**:
   - Aggregates diurnal wind ramping across all 31 days of January 2026.
   - Flags high-risk financial windows: Morning Ramp (07:00 - 09:00 UTC) and Evening Peak (17:00 - 19:30 UTC).
5. **Forecast Horizon Convergence Inspector**:
   - Click any half-hour period on the chart to trace how the forecast for that specific delivery target evolved over time from 48h out down to real-time.
6. **Embedded Executive Pitch & Technical Review Modals**:
   - Turnkey 5-slide client presentation (Part 1) and 5-slide technical architecture review (Part 2) directly built into the application.

---

## 📂 Directory & File Structure

```text
.
├── backend/                                # Python FastAPI Backend Service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                         # FastAPI app instance, CORS, lifespan data loader, health check
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py                  # Pydantic V2 models for requests, responses, metrics
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── forecast.py                 # /api/forecast: day-ahead curves, available dates, evolution
│   │   │   ├── accuracy.py                 # /api/accuracy: metrics, diurnal profiles, monthly overview
│   │   │   ├── procurement.py              # /api/procurement: thermal recommendation & buffer sizing
│   │   │   └── sync.py                     # /api/sync: Elexon cache provenance & background re-sync
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── elexon_client.py            # HTTP client for Elexon BMRS FUELHH & WINDFOR streams
│   │       ├── data_processor.py           # Alignment & D-1 Gate-closure cutoff rule implementation
│   │       ├── metrics_engine.py           # Vectorized NumPy/Pandas statistical metrics & diurnal aggregator
│   │       └── procurement_service.py      # Thermal procurement & empirical quantile buffer calculator
│   ├── data/                               # Pre-cached Elexon BMRS January 2026 datasets
│   │   ├── fuelhh_wind_jan2026.json        # 1,585 settlement period wind actuals
│   │   └── windfor_jan2026.json            # 19,856 wind forecast records across multi-day horizons
│   ├── tests/
│   │   └── test_backend.py                 # Pytest test suite (9 test cases covering API, metrics, math)
│   ├── Dockerfile                          # Container definition for backend
│   ├── Procfile                            # Heroku dyno declaration
│   ├── requirements.txt                    # Python dependencies
│   └── runtime.txt                         # Heroku Python runtime version
├── frontend/                               # React 18 + Vite Frontend SPA
│   ├── src/
│   │   ├── App.jsx                         # Main container wiring state, tabs, and modals
│   │   ├── main.jsx                        # React root entry point
│   │   ├── index.css                       # Vanilla CSS institutional dark design system
│   │   ├── components/
│   │   │   ├── Navbar.jsx                  # Header with brand, live indicators, modal triggers
│   │   │   ├── DateGateSelector.jsx        # Delivery date picker, D-1 gate cutoff dropdown, scenario presets
│   │   │   ├── SummaryCards.jsx            # 6 KPI cards (Actual, Forecast, MAE, Bias, Max Deficit, Cushion)
│   │   │   ├── ForecastChart.jsx           # Recharts half-hourly generation curve & error differential bars
│   │   │   ├── ProcurementCalculator.jsx   # Interactive thermal power & risk buffer optimizer
│   │   │   ├── DiurnalChart.jsx            # 48 settlement periods diurnal risk & ramp profile
│   │   │   ├── MonthlyOverviewView.jsx     # Full 31-day January 2026 calendar & daily breakdown table
│   │   │   ├── ForecastEvolutionModal.jsx  # Multi-horizon forecast convergence popover
│   │   │   ├── ClientPitchModal.jsx        # Part 1 Client Presentation Pitch (5 interactive slides)
│   │   │   └── TechLeadModal.jsx           # Part 2 Tech Lead Architecture Walkthrough (5 review sections)
│   │   └── services/
│   │       └── api.js                      # Fetch client communicating with backend
│   ├── index.html                          # HTML5 template with Google Fonts (Plus Jakarta Sans, Inter, JetBrains Mono)
│   ├── package.json                        # Node dependencies and scripts
│   ├── vite.config.js                      # Vite build configuration with /api reverse proxy
│   ├── vercel.json                         # Vercel SPA routing and proxy config
│   ├── nginx.conf                          # Nginx reverse proxy configuration for Docker
│   └── Dockerfile                          # Multi-stage Dockerfile (Node build -> Nginx alpine)
├── docker-compose.yml                      # Unified container orchestration (backend:8000, frontend:3000)
├── VIDEO_DEMO_SCRIPT.md                    # 10-Minute Turnkey Presentation Script for Video Recording
└── README.md                               # Project documentation
```

---

## 📐 Quantitative Methodology

### 1. D-1 Gate Closure Cutoff Rule
For a delivery day $D$ and user-selected gate closure time $T_{gate}$ (default 11:00 UTC):
$$T_{cutoff} = (D - 1\text{ day}) \text{ at } T_{gate}$$

For each half-hour settlement period $t \in [1..48]$ on day $D$:
$$\text{DayAheadForecast}(t) = \text{Latest WINDFOR forecast with } publishTime \le T_{cutoff}$$

### 2. Statistical Metrics
$$\text{Error}_i = \text{Forecast}_i - \text{Actual}_i$$
- **MAE (Mean Absolute Error)**: $\frac{1}{N} \sum_{i=1}^N |\text{Error}_i|$
- **RMSE (Root Mean Square Error)**: $\sqrt{\frac{1}{N} \sum_{i=1}^N \text{Error}_i^2}$
- **WAPE (Weighted Absolute Percentage Error)**: $\frac{\sum_{i=1}^N |\text{Error}_i|}{\sum_{i=1}^N \text{Actual}_i} \times 100\%$
- **MBE (Mean Bias Error)**: $\frac{1}{N} \sum_{i=1}^N (\text{Forecast}_i - \text{Actual}_i)$
  - $\text{MBE} > 0$: Systematic overforecasting (risk of energy shortfall in real time).
  - $\text{MBE} < 0$: Systematic underforecasting (risk of energy surplus).
- **Quantile Risk Buffer**:
  $$\text{ReserveBuffer}(t) = Q_{\alpha}(\text{Historical Wind Shortfalls}) \times \text{VolatilityScale}(t)$$
  where $\alpha \in [0.80, 0.99]$ represents the trading desk's chosen risk confidence level.

---

## 💻 How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start Backend
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs on [http://127.0.0.1:8000](http://127.0.0.1:8000). Interactive Swagger documentation is at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on [http://127.0.0.1:5173](http://127.0.0.1:5173).*

---

## 🐳 Running with Docker

To boot the entire application (both backend and frontend) with a single command:

```bash
docker-compose up --build
```

- Frontend is accessible at: `http://localhost:3000`
- Backend API is accessible at: `http://localhost:8000`
- API documentation at: `http://localhost:8000/docs`

---

## ☁️ Deployment Guide

### Deploying Frontend to Vercel
1. Push repository to GitHub.
2. In Vercel, click **Add New Project** and select this repo.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-api-url.com` (leave blank if deploying API proxy).
6. Click **Deploy**. Vercel will automatically read `frontend/vercel.json`.

### Deploying Backend to Heroku
1. Install Heroku CLI and login: `heroku login`.
2. Create app: `heroku create aero-procure-backend`.
3. Set buildpack: `heroku buildpacks:set heroku/python`.
4. Deploy backend:
   ```bash
   git subtree push --prefix backend heroku main
   ```
5. Verify health check: `https://aero-procure-backend.herokuapp.com/health`.

*(The backend can equally be deployed on Render, Railway, or Fly.io with the provided Dockerfile.)*

---

## 🧪 Automated Testing Suite

Comprehensive unit and integration tests are located in `backend/tests/test_backend.py`.

Run the test suite:
```bash
cd backend
python -m pytest tests/test_backend.py -v
```

**Test Coverage**:
- `test_api_root`: Root route and metadata response.
- `test_api_health`: System health and dataset readiness.
- `test_available_dates`: January 2026 delivery date presence.
- `test_day_ahead_forecast_endpoint`: 48 settlement periods validation and metric existence.
- `test_accuracy_metrics_calculation`: Mathematical verification of MAE, MBE, RMSE, and bias rate equations against synthetic vectors.
- `test_diurnal_profile_endpoint`: SP 1 to 48 diurnal aggregation.
- `test_monthly_overview_endpoint`: 31-day January overview integrity.
- `test_procurement_plan_endpoint`: Verification of thermal base and reserve cushion calculation.
- `test_sync_status_endpoint`: Elexon cache provenance validation.

---

## 🤖 AI Tools Attribution

As encouraged by the assignment specification, modern AI tools were leveraged to build this solution:
- **Antigravity AI (Google DeepMind)**: Assisted with exploring Elexon BMRS endpoint parameters, scaffolding FastAPI routers and Pydantic schemas, writing the Recharts visualization components, styling the institutional dark design system, generating the Pytest test suite, and formatting the video presentation script.
- **Human Engineering & Domain Verification**: All domain constraints (EPEX SPOT 11:00 UTC auction cut-off, settlement period indexing, prevention of lookahead bias, empirical quantile hedging formulas, and Elexon dataset alignment) were rigorously analyzed, tested, and validated.

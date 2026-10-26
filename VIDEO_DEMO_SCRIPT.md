# WindIQ Video Demo Presentation Script (10 Minutes Max)

This document provides a **complete, timed, word-for-word presentation script** for recording your **unlisted YouTube video submission**. Follow the exact on-screen cues and speaking lines below.

---

## ⏱️ Video Breakdown Summary
- **Total Duration**: 10:00 minutes maximum.
- **Part 1 (0:00 - 5:00)**: **Client Pitch & Portal Demonstration** (Target: Energy Utility Trading Desk / Power Purchasing Lead).
- **Part 2 (5:00 - 10:00)**: **Technical Architecture & Codebase Review** (Target: Internal Technical Lead & Engineering Reviewer).

---

## 🎬 PART 1: CLIENT PITCH & PORTAL DEMO (0:00 - 5:00)
**Role**: Product Developer presenting the pilot output to the UK Utility Power Purchasing Team.  
**Goal**: Impress them with domain expertise, financial ROI, and the platform's decision power.

### [0:00 - 1:00] Executive Introduction & Market Context
- **Screen**: Start on the live WindIQ production deployment (`https://wind-iq.vercel.app/`) or local (`http://localhost:5173/`). Have the hero banner with animated wind streamlines, KPI cards, and decision cutoff pill in view.
- **Speaker**:
  > *"Hello team. Today, I am proud to present the culmination of our pilot project: **WindIQ**, an institutional decision-support and forecast analytics platform engineered specifically for your Day-Ahead wholesale power purchasing desk in Great Britain's wholesale electricity market.*
  >
  > *In the UK market, your procurement desk faces a daily deadline: Day-Ahead auction order books on EPEX SPOT and Nord Pool close promptly at **11:00 UTC on Day D-1** across all 48 half-hour settlement periods of Day D.*
  >
  > *Your fundamental challenge is balancing consumer electricity demand against volatile, weather-dependent wind generation. If you overpredict wind generation, you under-procure thermal baseload, leaving your utility physically short in real-time and cashed out at the volatile System Buy Price. If you underpredict wind generation, you over-hedge expensive thermal peaking generation, spilling surplus power at discounted System Sell Prices.*
  >
  > *WindIQ was engineered specifically to solve this challenge using 100% verified Elexon BMRS datasets across all 1,488 settlement periods of January 2026 without lookahead bias."*

### [1:00 - 2:15] Page 1 (Overview) & Core Innovation: Decision-Time D-1 Cutoff Engine
- **Screen**: Move mouse across the Overview dashboard. Show the **Executive KPI cards** (live animated counters for MAE, RMSE, Signed Bias, and Data Coverage %). Then point to the **National Wind Generation Profile** and **Diurnal Settlement Profile**.
- **Speaker**:
  > *"Most weather portals show whatever forecast was published most recently. But for a day-ahead procurement team, that introduces a fatal lookahead bias. What you need to know is: **what was the latest forecast published before our trading auction gate closed on Day D-1?**
  >
  > In WindIQ, we directly ingest Elexon BMRS WINDFOR and FUELHH streams. We built a deterministic D-1 Gate Closure Freezing Engine. When we select January 2026 with an 11:00 UTC gate closure, our system filters strictly to forecasts published at or before 11:00 UTC on Day D-1.
  >
  > Here on the Overview dashboard:
  > - You see your national wind generation profile comparing actual outturns against frozen Day-Ahead forecasts across all 31 days.
  > - Below, the Diurnal Settlement Profile aggregates all 48 settlement periods, immediately highlighting the morning ramp (SP 14-18, 07:00-09:00 UTC) and evening peak (SP 34-38, 17:00-19:30 UTC).
  > - And our Daily Error Trend chart overlays daily MAE bars with signed forecast bias across the entire month."*

### [2:15 - 3:30] Page 2: Forecast Explorer & Multi-Vintage Comparison
- **Screen**: Click on the **Forecast Explorer** tab in the sidebar. Select different preset scenarios (e.g., *Storm Isha Jan 24* or *Calm Wind Jan 15*). Toggle the **Multi-Vintage Comparison** overlay, and scroll down to the **Half-Hourly Records Table**.
- **Speaker**:
  > *"Next, let's explore **Forecast Explorer**—the daily operational command center for your traders.
  >
  > You can inspect any delivery date in January 2026 or click our presets like Storm Isha on January 24th or Calm Wind on January 15th. 
  >
  > Notice the **Multi-Vintage Comparison** feature: by toggling publication runs, your team can visualize how forecasts converged over time—comparing D-2 initial models, D-1 morning runs, the 11:00 UTC auction gate run, and intraday revisions against the actual outturn curve.
  >
  > Below the chart, our Half-Hourly Records table details all 48 settlement periods with live search, sorting by error magnitude, risk classification badges (Severe Error, Overforecast, Underforecast), and a one-click CSV export for your quantitative models."*

### [3:30 - 4:30] Page 3: Quantitative Accuracy Analysis & 31×48 Heatmap
- **Screen**: Click on the **Accuracy Analysis** tab. Show the vectorized error metric suite, the Forecast vs Actual scatter plot with the 45° parity line, the Error Distribution Histogram, and the 1,488-cell Heatmap matrix. Hover over individual heatmap cells.
- **Speaker**:
  > *"To trade prudently, you must evaluate forecast accuracy quantitatively.
  >
  > On our Accuracy Analysis dashboard:
  > - We provide a comprehensive error suite: MAE, RMSE, Signed Mean Bias (MBE), WAPE, and MAPE with a 100 MW physical generation floor.
  > - Our **Forecast vs Actual Scatter Plot** plots every observation against the 45-degree parity line, instantly revealing directional dispersion and clustering.
  > - The **Error Distribution Histogram** maps the skewness of errors around zero.
  > - And this is our interactive **31 Days × 48 Settlement Periods Heatmap Matrix**—1,488 cells displaying error magnitude and timing across the entire month. Hovering over any cell reveals the exact SP, date, actual MW, forecast MW, and signed error, with a direct link to explore that day."*

### [4:30 - 5:00] Commercial Impact & In-App Pitch Presentation
- **Screen**: Click the **Client Pitch Deck (Part 1)** button in the sidebar. Click through the presentation slides.
- **Speaker**:
  > *"In summary, deploying WindIQ for your utility delivers:
  > 1. Complete protection against lookahead bias with mathematically frozen D-1 gate cutoff curves.
  > 2. Quantified risk margins that prevent expensive System Buy Price imbalance penalties during cold snaps and wind dropouts.
  > 3. Full data auditability backed by official Elexon BMRS timestamps.
  >
  > We've even embedded our full 5-slide Executive Client Pitch directly inside the application for your committee review.
  >
  > This concludes our client demonstration. Next, I will transition to Part 2 to walk through the technical architecture, domain logic, and codebase with our technical lead."*

---

## ⚙️ PART 2: TECH LEAD WALKTHROUGH & ARCHITECTURE REVIEW (5:00 - 10:00)
**Role**: Lead Developer conducting a technical review and knowledge transfer for an internal Tech Lead.  
**Goal**: Demonstrate architectural cleanliness, robust domain modeling, test coverage, and development best practices.

### [5:00 - 6:00] High-Level System Architecture & Technology Stack
- **Screen**: Click the **Tech Lead Review (Part 2)** button in the navbar. Display Topic 1 (Component Topology). Open VS Code / IDE in split view showing the backend and frontend folders.
- **Speaker**:
  > *"Welcome to the technical review. As requested, the application is built using a decoupled modern stack: **React 18 + Vite** for the frontend SPA and **Python 3.12 + FastAPI** for the analytical backend, containerized via **Docker**.*
  >
  > *Our architecture follows clean separation of concerns:*
  > *- In `backend/app/services`, we have isolated service layers: `ElexonClient` for data acquisition, `DataProcessor` for timeline alignment and gate cutoffs, `MetricsEngine` for statistical calculations, and `ProcurementService` for risk optimization.*
  > *- All request and response payloads are strictly typed using **Pydantic V2 schemas** in `backend/app/models/schemas.py`.*
  > *- The API is fully documented via automatic OpenAPI Swagger generation at `/docs`.*
  > *- On the frontend, we used React with a custom Tailwind CSS institutional dark trading design system and Recharts for responsive, hardware-accelerated SVG plotting."*

### [6:00 - 7:00] Domain Logic: Preventing Lookahead Bias via D-1 Cutoff Rules
- **Screen**: Show `backend/app/services/data_processor.py` in the IDE. Highlight lines 80-110 where the cutoff filtering occurs.
- **Speaker**:
  > *"Let's look at the critical domain challenge: **preventing lookahead bias**.*
  >
  > *In `DataProcessor.get_day_ahead_data()`, given a delivery date $D$ and a gate closure time $T_{gate}$, we compute $T_{cutoff} = (D - 1\text{ day}) \text{ at } T_{gate}$.*
  >
  > *For each of the 48 settlement periods, Elexon's WINDFOR dataset contains multiple forecasts generated across different runs. We filter the forecast array strictly to records where `publishTime <= cutoff_dt` and take the latest published record.*
  >
  > *This guarantees that the forecast presented to the model was genuinely available to the trader at bid submission time. We also capture and expose the `dayAheadPublishTime` in the response so every data point is fully auditable."*

### [7:00 - 8:00] Mathematical & Statistical Engine Implementation
- **Screen**: Show `backend/app/services/metrics_engine.py` in the IDE. Show formulas for MAE, RMSE, Signed Bias, WAPE, and MAPE.
- **Speaker**:
  > *"Next, looking at `MetricsEngine`: all calculations are fully vectorized using NumPy and Pandas for microsecond execution times:*
  > *- We calculate signed error as $\text{Forecast} - \text{Actual}$. Positive errors indicate wind overforecasting—meaning physical shortfall risk on the day.*
  > *- We compute MAE, RMSE, WAPE (Weighted Absolute Percentage Error), Mean Bias Error (MBE), and MAPE with a 100 MW physical generation floor.*
  > *- We generate the 1,488-cell Heatmap matrix across all 31 days and 48 half-hours, alongside a 45-degree scatter plot and error distribution histogram.*
  >
  > *Every calculation is strictly lookahead-free and covers 100% of the January 2026 Elexon settlement periods."*

### [8:00 - 9:00] Codebase Tour, Automated Testing & Docker Setup
- **Screen**: Open terminal in `backend/` and run `pytest -o pythonpath=. tests`. Show all 21 passing tests. Then show `docker-compose.yml`.
- **Speaker**:
  > *"Let's examine our automated test suite in `backend/tests/`.*
  >
  > *As you can see, running `pytest` executes 21 comprehensive unit, integration, and cutoff-enforcement tests:*
  > *- We test the health check and Elexon dataset loading.*
  > *- We validate mathematical correctness for MAE, RMSE, MBE, and Pearson correlation.*
  > *- We test zero lookahead bias enforcement, ensuring no forecasts published after gate closure are ever served.*
  > *- We test end-to-end endpoint serialization for Overview, Forecast Explorer, Accuracy Analysis, and Vintages.*
  >
  > *For deployment, the application is live in production on Vercel at `https://wind-iq.vercel.app/` with seamless serverless ASGI FastAPI endpoints and SPA routing. We also provided a root `docker-compose.yml` that boots both the Python backend and multi-stage Nginx frontend in isolated containers with a single command: `docker-compose up --build`."*

### [9:00 - 10:00] Development Practices, Data Provenance & AI Attribution
- **Screen**: Show `README.md` and the **Tech Lead Review** modal Topic 5.
- **Speaker**:
  > *"Finally, let's address development practices, data provenance, and AI tools:*
  > *- **Data Provenance**: In `backend/data`, we have bundled the complete, verified January 2026 Elexon datasets (1,585 actual settlement periods and 19,856 forecast records), ensuring zero cold-start delay while still supporting background live re-sync from Elexon BMRS.*
  > *- **AI Tools Attribution**: As permitted by the assignment, we utilized AI coding assistance to accelerate boilerplate creation for FastAPI routers, Pydantic schemas, and frontend UI design components.*
  > *- All domain-specific logic—including GB settlement period mapping, D-1 gate closure timing, zero lookahead enforcement, WAPE calculations, and heatmap matrices—was carefully verified and validated against UK market rules.*
  >
  > *The code is clean, modular, thoroughly documented, and ready for production handover. Thank you for your review, and I look forward to your questions."*

---

## 💡 Practical Recording Tips for the Candidate
1. **Resolution**: Record at 1080p (1920x1080) at 60fps or 30fps using OBS Studio or Chrome Screen Recorder.
2. **Audio**: Use a headset mic or clear desktop mic in a quiet room.
3. **Pacing**: Speak at a steady, confident pace. You have plenty of time (5 minutes per part).
4. **YouTube Settings**: Upload to YouTube as **Unlisted** (anyone with the link can view; not public or private). Title it: `WindIQ: UK Day-Ahead Wind Forecast Analytics Platform`.

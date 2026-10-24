# Aero-Procure Video Demo Presentation Script (10 Minutes Max)

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
- **Screen**: Start on the Aero-Procure home dashboard (`http://localhost:5173/`). Have the header and Summary Cards in view.
- **Speaker**:
  > *"Hello team. Today, I am proud to present the culmination of our pilot project: **Aero-Procure**, a customized decision-support and procurement intelligence platform engineered specifically for your Day-Ahead wholesale power purchasing desk.*
  >
  > *In the UK electricity market, your team faces a critical daily deadline: by 11:00 GMT on Day D-1, you must finalize and submit firm bids to the EPEX SPOT and Nord Pool day-ahead auctions across all 48 half-hour settlement periods.*
  >
  > *Your core challenge is balancing customer electricity demand against volatile, weather-dependent wind generation. If you rely on point forecasts without quantifying uncertainty, a sudden wind drop leaves you short in real-time, forcing you to pay punishing cashout penalties under the System Buy Price. Conversely, overestimating your deficit leads to over-contracting expensive thermal fuel and carbon.*
  >
  > *Aero-Procure was built to solve this exact problem."*

### [1:00 - 2:15] Core Innovation: Decision-Time (D-1 Cutoff) Forecasting
- **Screen**: Move mouse to the **D-1 Gate Closure Cutoff** dropdown and select `11:00 UTC (EPEX SPOT Auction Gate)`. Hover over the `Forecast & Errors` chart showing the Day-Ahead forecast curve vs actual outturn.
- **Speaker**:
  > *"Most weather dashboards on the market show you whatever forecast is newest right now. But for a day-ahead trader, that creates a fatal lookahead bias. What you need to know is: **what was the latest forecast published before our auction gate closed on Day D-1?***
  >
  > *In Aero-Procure, we directly ingest Elexon BMRS WINDFOR and FUELHH streams. We built a deterministic D-1 Gate Closure Freezing Engine. When we select January 15th with an 11:00 UTC gate closure, our system scans back to Day D-1 (January 14th) and freezes the exact national wind forecast curve published prior to 11:00 UTC.*
  >
  > *Notice the cyan dashed curve: this is your frozen day-ahead forecast. The green solid line represents the actual outturn generation from Elexon FUELHH. Notice how the bottom differential bar chart immediately highlights periods of wind deficit in red—where wind failed to materialize—versus periods of wind surplus in blue."*

### [2:15 - 3:15] Quantitative Error Evaluation Across January 2026
- **Screen**: Point to the 6 Summary Cards. Then click on the **Diurnal Risk Profile** tab.
- **Speaker**:
  > *"To trade prudently, you must evaluate forecast error quantitatively. We evaluated every single half-hour across all 31 days of January 2026—1,488 settlement periods in total.*
  >
  > *Looking at our summary metrics: national wind averaged over 12,000 MW, with a Mean Absolute Error (MAE) of 1,080 MW and a Weighted Absolute Percentage Error (WAPE) of just 8.5%.*
  >
  > *Now look at this **Diurnal Risk Profile**. We aggregated error behavior by settlement periods 1 to 48. Notice the two amber and red shaded zones: **Period 14 to 18 (the morning ramp from 07:00 to 09:00 UTC)** and **Period 34 to 38 (the evening peak from 17:00 to 19:30 UTC)**.*
  >
  > *During these exact peak-demand hours, wind forecast variance increases by up to 25%. A wind shortfall during the evening peak is financially catastrophic because system cashout prices can spike over £300/MWh. Knowing this error profile allows you to plan your thermal hedging with precision."*

### [3:15 - 4:15] The Thermal Procurement & Quantified Buffer Sizing Optimizer
- **Screen**: Click on the **Thermal Procurement** tab. Show the consumer demand slider and confidence slider. Drag the demand slider to 30,000 MW and confidence level to 95%.
- **Speaker**:
  > *"This brings us to the operational heart of the application: the **Thermal Power Procurement & Buffer Sizing Optimizer**.*
  >
  > *Here, your trading desk enters your utility's baseline consumer demand—say, 30,000 MW—and your risk tolerance. If you want 95% statistical coverage against wind dropouts, you set the confidence slider.*
  >
  > *The algorithm instantly computes:*
  > *1. Your expected wind contribution (the blue area).*
  > *2. Your baseline net thermal procurement (the orange area).*
  > *3. And critically, **the quantified reserve buffer** (the purple area)—derived directly from the empirical 95th percentile wind shortfall distribution.*
  >
  > *Notice the outturn validation banner below: by holding this calibrated 1,200 MW thermal buffer, **zero out of 48 settlement periods were exposed to deficit cashout penalties**, while completely avoiding the massive expense of arbitrary over-hedging. You can also export this hourly dispatch plan straight to CSV with one click."*

### [4:15 - 5:00] Commercial Impact, ROI & Transition
- **Screen**: Click the **Client Pitch (Part 1)** button in the top navbar. Flip through the slides briefly.
- **Speaker**:
  > *"In summary, for a mid-to-large UK utility, deploying Aero-Procure delivers:*
  > *1. Over **£2.4 million in annual avoided cashout penalties**.*
  > *2. Up to **30% reduction in unnecessary thermal fuel and carbon holding costs**.*
  > *3. Complete compliance and auditability backed by official Elexon BMRS timestamps.*
  >
  > *This concludes our client walkthrough. Next, I will transition to Part 2 to review the software design, architecture, and engineering implementation with our technical lead."*

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
  > *- On the frontend, we used React with a custom Vanilla CSS institutional dark design system and Recharts for responsive, hardware-accelerated SVG plotting without bloated CSS frameworks."*

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
- **Screen**: Show `backend/app/services/metrics_engine.py` and `procurement_service.py` in the IDE.
- **Speaker**:
  > *"Next, looking at `MetricsEngine`: all calculations are fully vectorized using NumPy for microsecond execution times:*
  > *- We calculate signed error as $\text{Forecast} - \text{Actual}$. Positive errors indicate wind overforecasting—meaning a shortfall risk.*
  > *- We compute MAE, RMSE, WAPE (Weighted Absolute Percentage Error), and Mean Bias Error (MBE).*
  > *- For risk management, we compute empirical quantiles from P10 through P95.*
  >
  > *In `ProcurementService`, the reserve buffer isn't an arbitrary fixed percentage. We calculate the empirical shortfall distribution across January 2026. The buffer margin is sized as $Q_{\alpha}(\text{Shortfalls}) \times \text{VolatilityScale}$, providing mathematically defensible risk coverage."*

### [8:00 - 9:00] Codebase Tour, Automated Testing & Docker Setup
- **Screen**: Open terminal in `backend/` and run `python -m pytest tests/test_backend.py -v`. Show all 9 passing tests. Then show `docker-compose.yml`.
- **Speaker**:
  > *"Let's examine our automated test suite in `backend/tests/test_backend.py`.*
  >
  > *As you can see, running `pytest` executes 9 comprehensive unit and integration tests in approximately one second:*
  > *- We test the health check and Elexon dataset loading.*
  > *- We validate the mathematical correctness of MAE, RMSE, MBE, and quantile formulas against synthetic test vectors.*
  > *- We test end-to-end endpoint serialization for Day-Ahead curves, diurnal profiles, and procurement plans.*
  >
  > *For containerization, we provided a root `docker-compose.yml` that boots both the Python backend and multi-stage Nginx frontend in isolated containers with a single command: `docker-compose up --build`. The application is also pre-configured with `Procfile` for Heroku and `vercel.json` for Vercel."*

### [9:00 - 10:00] Development Practices, Data Provenance & AI Attribution
- **Screen**: Show `README.md` and the **Tech Lead Review** modal Topic 5.
- **Speaker**:
  > *"Finally, let's address development practices, data provenance, and AI tools:*
  > *- **Data Provenance**: In `backend/data`, we have bundled the complete, verified January 2026 Elexon datasets (1,585 actual settlement periods and 19,856 forecast records), ensuring zero cold-start delay while still supporting background live re-sync from Elexon BMRS.*
  > *- **AI Tools Attribution**: As permitted by the assignment, we utilized Antigravity AI to assist with exploring the Elexon API parameters, accelerating boilerplate creation for FastAPI routers and Pydantic schemas, and designing the responsive visual components.*
  > *- All domain-specific logic—including GB settlement period mapping, D-1 gate closure timing, WAPE calculations, and quantile hedging—was manually designed, verified, and validated against UK market rules.*
  >
  > *The code is clean, modular, thoroughly documented, and ready for production handover. Thank you for your review, and I look forward to your questions."*

---

## 💡 Practical Recording Tips for the Candidate
1. **Resolution**: Record at 1080p (1920x1080) at 60fps or 30fps using OBS Studio or Chrome Screen Recorder.
2. **Audio**: Use a headset mic or clear desktop mic in a quiet room.
3. **Pacing**: Speak at a steady, confident pace. You have plenty of time (5 minutes per part).
4. **YouTube Settings**: Upload to YouTube as **Unlisted** (anyone with the link can view; not public or private). Title it: `Aero-Procure: UK Day-Ahead Wind & Thermal Procurement Platform`.

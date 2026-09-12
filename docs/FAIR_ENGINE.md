# FAIR Engine Architecture

The CYBERVEST FAIR engine is a transparent, modular Python package designed to execute cyber risk quantification via Monte Carlo simulation securely and reproducibly.

## Architecture & Modules

The package is structured in `risk_engine/` and strictly segregates calculation logic from data integration.

### Core Modules
- `fair/models.py`: Leverages **Pydantic** for rigorous schema and constraint validation. It strictly enforces boundary criteria (e.g., probability `0 <= x <= 1`, non-negative losses, `min <= likely <= max`). 
- `fair/distributions.py`: Implements a transparent PERT distribution sampler relying heavily on the Beta transform for rigorous, mathematically sound random value generation.
- `fair/monte_carlo.py`: The heart of the simulation engine. It applies fully vectorized operations utilizing **NumPy** to evade standard Python loops. This guarantees high-performance calculation (e.g., executing 10,000 scenarios in ~20ms).
- `fair/drivers.py`: Implements Spearman rank-order correlation analysis, determining the variable that most significantly influences output variance without arbitrary estimation logic.
- `fair/calculator.py`: The orchestrator that unites inputs, executes calculations via `monte_carlo`, generates risk drivers, and formats the output deterministically.
- `services/fair_service.py`: Provides seamless, loosely-coupled integration with the Supabase REST framework to persist data gracefully while keeping the math agnostic to the database.

## Inputs & Outputs
Inputs require strict adherence to the explicit FAIR schema bounds provided by `FAIRScenarioInput`. 
Outputs provide mean inputs generated during simulation runs and absolute distributions for P10, P50 (median), P90, and EAL (mean) returned within the `FAIRResultOutput` object. 

## Supabase Integration
Data is loaded natively using the Supabase API. Validated models seamlessly marshal variables into `fair_results`, enforcing strict foreign keys spanning `organization_id`, `business_service_id`, and `scenario_id` for unbreakable mathematical provenance.

## Error Handling
Exceptions are raised cleanly utilizing Python's structured error framework:
- **`ValidationError`**: Triggers explicitly prior to calculation execution if bounds are breached (e.g., Min > Max, Susceptibility > 1).
- **`ValueError`**: Thrown in calculation states if internal matrix parameters mismatch. 

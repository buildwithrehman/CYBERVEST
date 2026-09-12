# FAIR Variables & Units Documentation

The CYBERVEST platform utilizes the Factor Analysis of Information Risk (FAIR) methodology. Below are the unit specifications for the inputs and outputs stored within the schema (e.g., `fair_scenarios` and `fair_results`).

## 1. Threat Event Frequency (TEF)
- **Unit**: Events per year.
- **Description**: The probable frequency, within a given timeframe (annualized), that threat agents will act against an asset. Stored as `tef_min`, `tef_likely`, `tef_max`.

## 2. Susceptibility / Vulnerability
- **Unit**: Probability (decimal between 0.0 and 1.0).
- **Description**: The probability that a threat event will become a loss event (i.e., threat capability exceeds control strength). Stored as `susceptibility_min`, `susceptibility_likely`, `susceptibility_max`.

## 3. Loss Event Frequency (LEF)
- **Unit**: Loss events per year.
- **Description**: The annualized frequency of threat events that successfully materialize into loss events. (TEF × Susceptibility).

## 4. Loss Values (Primary and Secondary)
- **Unit**: INR (Indian Rupee) per loss event.
- **Description**: The financial magnitude of the loss event. Includes productivity loss, response cost, regulatory loss, and reputation loss inputs.

## 5. Expected Annual Loss (EAL)
- **Unit**: Expected annual loss in INR.
- **Description**: The statistically expected annual financial loss derived from the Monte Carlo simulation across the LEF and Loss Magnitude distributions.

## 6. P10 / P50 / P90
- **Unit**: INR loss quantiles from Monte Carlo simulation.
- **Description**: 
  - **P10**: The value where there is a 10% chance the loss will be equal to or less than this amount.
  - **P50**: The median expected loss.
  - **P90**: The 90th percentile; a 10% chance the loss will exceed this upper-tail magnitude. Used for extreme scenario risk appetite modeling.

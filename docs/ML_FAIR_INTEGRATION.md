# FAIR + ML Integration Strategy

The platform maintains a strict segregation of responsibility between predictive intelligence (ML) and financial risk quantification (FAIR).

## Boundary Definition
- **Machine Learning (ML)**: Evaluates raw security state vectors (Vulnerabilities, CVSS, Assets, Controls, Events) and generates a normalized probability: $P(Incident \mid Window)$.
- **FAIR**: Operates strictly on frequencies (TEF, LEF), condition probabilities (Susceptibility), and financial severity bounds (Primary/Secondary Loss) through Monte Carlo compounding.

## The Handshake Contract
The ML output (`0.73` Likelihood for the next 15 days) **does not equal** a TEF of `0.73`.
A TEF represents the annualized Threat Event Frequency. A 73% probability over 15 days translates to a substantially higher annual Threat Event Frequency. 

The application utilizes ML purely as **Decision Support**. 
When defining a FAIR scenario, the UI will display:
> *"ML Intelligence: This asset has a High Likelihood (73%) of an incident occurring in the next 15 days due to Internet Exposure and Critical Vulnerabilities."*

The human analyst or a deterministic scaling mapping uses this signal to set the PERT distribution for TEF (e.g. elevating TEF Likely from 5.0 to 20.0). No automatic arbitrary replacement of the quantitative bounds is permitted.

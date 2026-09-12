# Optimization Engine (Milestone 5)

## 1. Business Problem
Cybersecurity leaders face a continuous capital allocation problem: given a fixed budget, which portfolio of security investments will mathematically maximize the reduction in financial risk exposure? 

## 2. Optimization Objective
The objective is to maximize the expected reduction in annualized financial loss (EAL) without exceeding the allocated budget. 

## 3. Mathematical Formulation
This is modeled as a 0-1 Knapsack / Mixed Integer Programming (MIP) problem.

Let $N$ be the set of candidate mitigations.
Let $x_i \in \{0, 1\}$ be the decision variable (1 if mitigation $i$ is selected, 0 otherwise).
Let $C_i$ be the cost of mitigation $i$.
Let $B$ be the available budget.
Let $\Delta EAL_i$ be the marginal risk reduction of mitigation $i$ evaluated independently against the FAIR baseline.

**Objective:**
Maximize $\sum_{i \in N} \Delta EAL_i \cdot x_i$

**Constraints:**
1. Budget Constraint: $\sum C_i \cdot x_i \leq B$
2. Dependency Constraint (if $i$ requires $j$): $x_i \leq x_j$
3. Mutual Exclusion Constraint: $x_i + x_k \leq 1$

## 4. Decision Variables
- `x[i]`: Binary selection variables mapped to `Mitigation` IDs.

## 5. Constraints
- **Budget**: Enforced mathematically by the solver.
- **Dependencies**: e.g., PAM requires MFA.
- **Mutual Exclusions**: e.g., Vendor A vs Vendor B.

## 6. Mitigation Model
The `Mitigation` model includes `cost`, `implementation_time`, and `risk_reduction_parameters` (multipliers for TEF, susceptibility, and loss magnitude). **All costs and mitigation impacts used in this prototype are SYNTHETIC DEMO ASSUMPTIONS.**

## 7. Scenario Integration
To avoid double-counting benefits (e.g., two mitigations both reducing susceptibility), the impacts are treated multiplicatively when evaluating the final portfolio within the Monte Carlo engine. 
*Example:* A 30% reduction from MFA (0.7 multiplier) and a 20% reduction from Patching (0.8 multiplier) yields a combined multiplier of 0.56 (44% reduction), not an additive 50%.

## 8. FAIR Integration
The optimization engine orchestrates the FAIR calculator without bypassing it. The optimizer leverages the precise output of the audited Milestone 3/3.1 Compound Poisson engine.

## 9. ROSI
Modeled Return on Security Investment:
`ROSI = (Modeled Absolute Risk Reduction - Total Investment Cost) / Total Investment Cost`

## 10. Double-Counting Treatment
We use the marginal EAL reduction as a linear heuristic for the OR-Tools solver. However, the final `optimized_eal`, `absolute_risk_reduction`, and `rosi` provided in the API response are calculated by executing a *full combined FAIR Monte Carlo recalculation* using the portfolio's multiplied parameters, structurally eliminating additive double-counting.

## 11. Assumptions
- Linear marginal benefit approximation in the solver objective.
- Multiplicative recalculation inside actual FAIR engine to handle diminishing returns / double-counting.
- **All mitigation impacts are synthetic demonstration assumptions.**

## 12. Limitations
- Synthetic mitigation costs.
- Synthetic mitigation effects.
- Relies entirely on FAIR assumptions.
- No real enterprise investment dataset is provided.
- **There is no claim that the optimizer guarantees real financial returns.**

## 13. Complexity
Because the solver uses `SCIP` (Solving Constraint Integer Programs), it easily scales to hundreds of candidate mitigations within seconds. For a small set of 5-10 mitigations, runtime is completely bounded by the FAIR Monte Carlo recalculations (e.g., < 2 seconds).

## 14. API
Endpoint: `POST /optimization/run`

**Example Request:**
```json
{
  "organization_id": "00000000-0000-0000-0000-000000000000",
  "budget": 10000000,
  "mitigations": [ ... ],
  "baseline_scenario": { ... }
}
```

**Example Response:**
```json
{
  "status": "OPTIMAL",
  "budget": 10000000.0,
  "selected_mitigations": [
    {
      "id": "m1_mfa",
      "name": "Enterprise MFA",
      "cost": 2500000.0,
      "modeled_eal_reduction": 6504466.91
    }
  ],
  ...
}
```

## 15. Reproducibility
Seeding `20260908` to the Monte Carlo engine perfectly bounds the solver outputs, producing identical EAL calculations on repeated runs.

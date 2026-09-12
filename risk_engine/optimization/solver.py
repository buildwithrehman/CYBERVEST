import itertools
from typing import List, Dict, Tuple
from ortools.linear_solver import pywraplp
from .models import Mitigation, OptimizationConstraints, OptimizationRequest, OptimizationResponse, SelectedMitigationDetail
from ..fair.models import FAIRScenarioInput
from .scenario import evaluate_portfolio
from ..fair.calculator import calculate_fair

def optimize_portfolio(request: OptimizationRequest) -> OptimizationResponse:
    # 1. Establish Baseline
    baseline = FAIRScenarioInput(**request.baseline_scenario)
    baseline_result = calculate_fair(baseline)
    baseline_eal = baseline_result.eal
    
    mitigations = request.mitigations
    n = len(mitigations)
    
    # 2. Extract marginal benefit (heuristic for solver, final is re-evaluated)
    marginal_reductions = []
    for m in mitigations:
        _, reduction, _ = evaluate_portfolio(baseline, [m])
        marginal_reductions.append(reduction)
        
    # 3. Formulate OR-Tools Mixed Integer Program
    solver = pywraplp.Solver.CreateSolver('SCIP')
    if not solver:
        raise ValueError("Could not create SCIP solver.")
        
    x = {}
    for i in range(n):
        x[i] = solver.IntVar(0, 1, f'x_{i}')
        
    solver.Add(sum(mitigations[i].cost * x[i] for i in range(n)) <= request.budget)
    
    id_to_idx = {m.id: i for i, m in enumerate(mitigations)}
    
    if request.constraints:
        if request.constraints.mutual_exclusions:
            for group in request.constraints.mutual_exclusions:
                indices = [i for i, m in enumerate(mitigations) if m.id in group]
                solver.Add(sum(x[i] for i in indices) <= 1)
        if request.constraints.max_mitigations is not None:
            solver.Add(sum(x[i] for i in range(n)) <= request.constraints.max_mitigations)
            
    for i, m in enumerate(mitigations):
        if m.dependencies:
            for dep_id in m.dependencies:
                if dep_id in id_to_idx:
                    solver.Add(x[i] <= x[id_to_idx[dep_id]])
                    
    solver.Maximize(sum(marginal_reductions[i] * x[i] for i in range(n)))
    
    status = solver.Solve()
    
    mip_selected_indices = []
    solver_status_str = "UNKNOWN"
    
    if status == pywraplp.Solver.OPTIMAL:
        solver_status_str = "OPTIMAL"
        for i in range(n):
            if x[i].solution_value() > 0.5:
                mip_selected_indices.append(i)
    elif status == pywraplp.Solver.FEASIBLE:
        solver_status_str = "FEASIBLE"
        for i in range(n):
            if x[i].solution_value() > 0.5:
                mip_selected_indices.append(i)
    elif status == pywraplp.Solver.INFEASIBLE:
        solver_status_str = "INFEASIBLE"
    
    # 4. Exact FAIR search (For Prototype <= 15 mitigations)
    exact_selected_indices = []
    exact_min_eal = float('inf')
    exact_best_reduction = -1.0
    exact_best_investment = 0.0
    feasible_count = 0
    evaluated_count = 0
    
    all_subsets = []
    for r in range(n + 1):
        all_subsets.extend(itertools.combinations(range(n), r))
        
    for subset in all_subsets:
        cost = sum(mitigations[i].cost for i in subset)
        if cost > request.budget:
            continue
            
        valid_deps = True
        for i in subset:
            m = mitigations[i]
            if m.dependencies:
                for dep in m.dependencies:
                    if dep in id_to_idx and id_to_idx[dep] not in subset:
                        valid_deps = False
                        break
            if not valid_deps:
                break
        if not valid_deps:
            continue
            
        valid_excl = True
        if request.constraints and request.constraints.mutual_exclusions:
            for group in request.constraints.mutual_exclusions:
                count = sum(1 for i in subset if mitigations[i].id in group)
                if count > 1:
                    valid_excl = False
                    break
        if not valid_excl:
            continue
            
        if request.constraints and request.constraints.max_mitigations is not None:
            if len(subset) > request.constraints.max_mitigations:
                continue
                
        feasible_count += 1
        
        # Evaluate exact portfolio in FAIR
        port_mits = [mitigations[i] for i in subset]
        port_result, port_reduction, port_investment = evaluate_portfolio(baseline, port_mits)
        evaluated_count += 1
        
        if port_result.eal < exact_min_eal:
            exact_min_eal = port_result.eal
            exact_best_reduction = port_reduction
            exact_best_investment = port_investment
            exact_selected_indices = list(subset)
            
    mip_exact_match = set(mip_selected_indices) == set(exact_selected_indices)
    
    # OVERRIDE OR-TOOLS with exact for the prototype
    final_indices = exact_selected_indices
    final_result, final_absolute_reduction, total_investment = evaluate_portfolio(baseline, [mitigations[i] for i in final_indices])
    
    optimized_eal = final_result.eal
    percentage_reduction = (final_absolute_reduction / baseline_eal) * 100 if baseline_eal > 0 else 0
    rosi = (final_absolute_reduction - total_investment) / total_investment if total_investment > 0 else 0.0
    
    selected_details = []
    for i, m in enumerate([mitigations[i] for i in final_indices]):
        marginal = marginal_reductions[final_indices[i]]
        selected_details.append(SelectedMitigationDetail(
            id=m.id,
            name=m.name,
            cost=m.cost,
            modeled_eal_reduction=marginal,
            risk_drivers_affected=m.affected_risk_drivers,
            dependencies=m.dependencies,
            assumptions=[f"Synthetic Marginal EAL reduction estimate: {marginal}"],
            reason_for_selection=f"cost = ₹{m.cost}, modeled EAL marginal reduction = ₹{marginal:.2f}, satisfies budget and dependencies, contributes to exact non-linear minimum EAL objective."
        ))

    return OptimizationResponse(
        status=solver_status_str,
        portfolio_validation="EXACT",
        feasible_portfolio_count=feasible_count,
        evaluated_portfolio_count=evaluated_count,
        mip_exact_match=mip_exact_match,
        budget=request.budget,
        selected_mitigations=selected_details,
        total_investment=total_investment,
        remaining_budget=request.budget - total_investment,
        baseline_eal=baseline_eal,
        optimized_eal=optimized_eal,
        absolute_risk_reduction=final_absolute_reduction,
        percentage_risk_reduction=percentage_reduction,
        rosi=rosi,
        portfolio_score=solver.Objective().Value() if solver_status_str in ['OPTIMAL', 'FEASIBLE'] else 0.0,
        constraints={"budget": request.budget, "mutual_exclusions": getattr(request.constraints, 'mutual_exclusions', None)},
        assumptions=[
            "Linear marginal benefit approximation in solver objective.",
            "Exact combinatorial FAIR evaluation used for SIH prototype (<15 mitigations).",
            "Multiplicative recalculation inside actual FAIR engine to handle diminishing returns / double-counting.",
            "All mitigation impacts are synthetic demonstration assumptions."
        ],
        calculation_version="OPT-v1.1-Exact"
    )

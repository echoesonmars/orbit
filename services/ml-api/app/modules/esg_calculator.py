"""
Module 10: ESG Assessor — Environmental, Social, and Governance calculator.
Uses Life Cycle Assessment (LCA) formulas from ESA/NASA GHG Protocol standards.
No ML: pure deterministic formulas + optional OpenAI recommendations.
"""
import os
import math

try:
    from openai import OpenAI as _OpenAI
    _client = _OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))
    _openai_available = bool(os.getenv("OPENAI_API_KEY"))
except Exception:
    _client = None
    _openai_available = False


# ─── Emission Factors (kg CO₂-eq per kg of propellant) ───────────────────────
# Sources: ESA LCA handbook, GHG Protocol, peer-reviewed literature

PROPELLANT_FACTORS = {
    "kerosene_rp1": {
        "label": "Kerosene (RP-1)",
        "co2_kg_per_kg": 3.40,   # combustion CO₂
        "bc_kg_per_kg": 0.08,    # black carbon (powerful short-term warming)
        "toxicity_score": 2,      # 1-5 scale
        "ozone_impact": "moderate",
    },
    "methane_ch4": {
        "label": "Liquid Methane (CH₄)",
        "co2_kg_per_kg": 2.75,
        "bc_kg_per_kg": 0.015,
        "toxicity_score": 1,
        "ozone_impact": "low",
    },
    "hydrogen_lh2": {
        "label": "Liquid Hydrogen (LH₂)",
        "co2_kg_per_kg": 0.0,    # pure H₂O exhaust
        "bc_kg_per_kg": 0.0,
        "toxicity_score": 1,
        "ozone_impact": "low",
        "h2o_stratosphere_kg_per_kg": 8.94,  # water in stratosphere
    },
    "hydrazine_n2h4": {
        "label": "Hydrazine (N₂H₄)",
        "co2_kg_per_kg": 0.0,
        "bc_kg_per_kg": 0.0,
        "toxicity_score": 5,     # Highly toxic
        "ozone_impact": "high",
        "nox_kg_per_kg": 0.42,
    },
    "solid_srb": {
        "label": "Solid Rocket Booster (APCP)",
        "co2_kg_per_kg": 1.60,
        "bc_kg_per_kg": 0.35,    # Very high black carbon
        "toxicity_score": 3,
        "ozone_impact": "very high",
        "al2o3_kg_per_kg": 0.35,  # Alumina particles
    },
    "xenon_ion": {
        "label": "Xenon (Ion Thruster)",
        "co2_kg_per_kg": 0.0,
        "bc_kg_per_kg": 0.0,
        "toxicity_score": 1,
        "ozone_impact": "none",
    },
}

# Manufacturing CO₂ intensity: kg CO₂-eq per kg of satellite mass
# (electronics-heavy satellites have very high embedded carbon)
MANUFACTURING_CO2_PER_KG_SAT = 200.0   # kg CO₂ per kg satellite (ESA avg)

# Launch vehicle mass ratio: payload fraction (typical)
PAYLOAD_FRACTION_TO_FUEL_RATIO = {
    "small": 18,   # Small rockets: ~18kg propellant per 1kg payload
    "medium": 12,  # Medium: Falcon 9
    "heavy": 8,    # Heavy: Falcon Heavy, Ariane 6
    "super_heavy": 6,  # Super Heavy: Starship
}


# ─── Debris Risk Score ────────────────────────────────────────────────────────

def _calc_debris_risk(
    altitude_km: float,
    has_deorbit_system: bool,
    expected_lifetime_years: float,
    orbit_type: str = "LEO",
) -> dict:
    """
    Score debris risk 0-100 (lower = better = less risky).
    Based on UN/IADC Space Debris Mitigation Guidelines.
    """
    # Natural decay estimate
    if altitude_km < 300:
        natural_decay_years = 1.0
    elif altitude_km < 400:
        natural_decay_years = 5.0
    elif altitude_km < 600:
        natural_decay_years = 25.0
    elif altitude_km < 800:
        natural_decay_years = 50.0
    elif altitude_km < 1000:
        natural_decay_years = 150.0
    elif altitude_km < 1500:
        natural_decay_years = float('inf')  # Never decays naturally
    else:
        natural_decay_years = float('inf')

    # UN guideline: must deorbit within 25 years
    UN_THRESHOLD_YEARS = 25.0

    if has_deorbit_system:
        effective_decay_years = min(natural_decay_years, expected_lifetime_years + 3)
    else:
        effective_decay_years = natural_decay_years

    # Score: 0 = good (fast decay), 100 = bad (stays forever)
    if effective_decay_years < 5:
        raw_score = 5
        compliance = "Excellent"
    elif effective_decay_years <= UN_THRESHOLD_YEARS:
        raw_score = 20 + (effective_decay_years / UN_THRESHOLD_YEARS) * 30
        compliance = "Compliant"
    elif effective_decay_years <= 50:
        raw_score = 60 + (effective_decay_years - 25) / 25 * 25
        compliance = "Non-Compliant"
    else:
        raw_score = 90 + min(10, (effective_decay_years - 50) / 100 * 10)
        compliance = "Severe Violation"

    # Check high-traffic debris shells
    if 550 <= altitude_km <= 650 or 1100 <= altitude_km <= 1300:
        raw_score = min(100, raw_score * 1.2)  # Penalty for crowded shells
        zone = "High-Density Debris Zone"
    elif altitude_km >= 35700 and altitude_km <= 35900:
        zone = "Geostationary Belt"
    else:
        zone = "Standard"

    return {
        "score": min(100.0, round(raw_score, 1)),
        "effective_decay_years": round(effective_decay_years, 1) if effective_decay_years != float('inf') else 9999,
        "un_compliant": effective_decay_years <= UN_THRESHOLD_YEARS,
        "compliance": compliance,
        "zone": zone,
    }


# ─── Carbon Footprint LCA ─────────────────────────────────────────────────────

def _calc_carbon(
    satellite_mass_kg: float,
    propellant_type: str,
    launch_vehicle_class: str,
) -> dict:
    """Life Cycle Assessment of CO₂-equivalent emissions."""
    factor = PROPELLANT_FACTORS.get(propellant_type, PROPELLANT_FACTORS["kerosene_rp1"])
    fuel_ratio = PAYLOAD_FRACTION_TO_FUEL_RATIO.get(launch_vehicle_class, 12)

    # Estimated propellant mass attributed to this satellite
    attributed_fuel_kg = satellite_mass_kg * fuel_ratio

    # Launch emissions
    launch_co2_tons = (attributed_fuel_kg * factor["co2_kg_per_kg"]) / 1000
    bc_co2_equiv_tons = (attributed_fuel_kg * factor["bc_kg_per_kg"] * 900) / 1000  # BC GWP ~900

    # Manufacturing (LCA)
    manufacturing_co2_tons = (satellite_mass_kg * MANUFACTURING_CO2_PER_KG_SAT) / 1000

    total_co2_tons = launch_co2_tons + bc_co2_equiv_tons + manufacturing_co2_tons

    # Equivalence narratives
    car_years = total_co2_tons / 4.6  # avg car = 4.6t CO2/year
    tree_years = total_co2_tons / 0.022  # avg tree absorbs 22 kg/year

    return {
        "total_co2_tons": round(total_co2_tons, 2),
        "launch_co2_tons": round(launch_co2_tons, 2),
        "bc_co2_equiv_tons": round(bc_co2_equiv_tons, 2),
        "manufacturing_co2_tons": round(manufacturing_co2_tons, 2),
        "propellant_label": factor["label"],
        "propellant_fuel_kg": round(attributed_fuel_kg, 0),
        "toxicity_score": factor["toxicity_score"],
        "ozone_impact": factor["ozone_impact"],
        "equivalents": {
            "car_years": round(car_years, 1),
            "tree_years_to_offset": round(tree_years, 0),
        },
    }


# ─── ESG Score + Grade ────────────────────────────────────────────────────────

def _compute_esg_score(
    carbon: dict,
    debris: dict,
    satellite_mass_kg: float,
    has_solar_power: bool,
    mission_benefit_score: float,  # 0-100: how beneficial is the mission
) -> tuple[float, str, str]:
    """
    Compute overall ESG score 0-100. Higher = better.
    Returns (score, grade, grade_color).
    """
    # ── E (Environmental) ─────────────────────────────────────────────────
    # Carbon: normalize against satellite class benchmarks
    co2_per_kg = carbon["total_co2_tons"] / max(satellite_mass_kg, 1)
    if co2_per_kg < 1:
        carbon_score = 100
    elif co2_per_kg < 2:
        carbon_score = 80
    elif co2_per_kg < 5:
        carbon_score = 60
    elif co2_per_kg < 10:
        carbon_score = 40
    else:
        carbon_score = 20

    # Debris: invert (0 risk = 100 score)
    debris_score = 100 - debris["score"]

    # Propellant toxicity penalty
    tox_penalty = (carbon["toxicity_score"] - 1) * 8   # 0, 8, 16, 24, 32

    e_score = (carbon_score * 0.5 + debris_score * 0.5) - tox_penalty
    e_score = max(0, min(100, e_score))

    # ── S (Social) ────────────────────────────────────────────────────────
    s_score = mission_benefit_score

    # ── G (Governance) ────────────────────────────────────────────────────
    # UN compliance is a hard governance requirement
    un_bonus = 15 if debris["un_compliant"] else -20
    solar_bonus = 5 if has_solar_power else 0
    g_score = min(100, max(0, 65 + un_bonus + solar_bonus))

    # Weighted: E=50%, S=30%, G=20%
    overall = e_score * 0.50 + s_score * 0.30 + g_score * 0.20

    # Grade
    if overall >= 90: grade, color = "A+", "#10B981"
    elif overall >= 80: grade, color = "A",  "#22C55E"
    elif overall >= 70: grade, color = "B",  "#84CC16"
    elif overall >= 60: grade, color = "C",  "#EAB308"
    elif overall >= 45: grade, color = "D",  "#F97316"
    else:               grade, color = "F",  "#EF4444"

    return round(overall, 1), grade, color


# ─── OpenAI Recommendations ──────────────────────────────────────────────────

def _get_recommendations(
    grade: str,
    overall_score: float,
    debris: dict,
    carbon: dict,
    satellite_mass_kg: float,
) -> list[dict]:
    """Generate AI improvement recommendations or use deterministic fallback."""
    if _openai_available and _client and grade not in ("A+",):
        try:
            prompt = (
                f"A satellite mission received ESG grade: {grade} (score: {overall_score}/100).\n"
                f"Key issues:\n"
                f"- Carbon footprint: {carbon['total_co2_tons']:.1f} tons CO₂ "
                f"(propellant: {carbon['propellant_label']}, toxicity: {carbon['toxicity_score']}/5)\n"
                f"- Debris compliance: {debris['compliance']} "
                f"(estimated {debris['effective_decay_years']} yrs to deorbit)\n"
                f"- UN 25yr compliance: {'Yes' if debris['un_compliant'] else 'NO VIOLATION'}\n"
                f"Satellite mass: {satellite_mass_kg} kg\n\n"
                "Provide exactly 3 specific, actionable engineering recommendations to improve the ESG grade. "
                "Format as JSON array: [{\"title\": \"...\", \"detail\": \"...\", \"impact\": \"High/Medium/Low\"}]. "
                "Be concise and technical. Output ONLY the JSON array, no extra text."
            )
            resp = _client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.4,
                response_format={"type": "json_object"},
            )
            import json
            raw = resp.choices[0].message.content or "{}"
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed[:3]
            # Some models wrap in an object
            for v in parsed.values():
                if isinstance(v, list):
                    return v[:3]
        except Exception as e:
            print(f"[ESG] OpenAI error: {e}")

    # ── Deterministic fallback ─────────────────────────────────────────────
    recs = []
    if not debris["un_compliant"]:
        recs.append({
            "title": "Add Drag Augmentation Device (DAD)",
            "detail": f"A 50g drag sail can reduce deorbit time from {debris['effective_decay_years']} years "
                      f"to under 25 years, achieving UN IADC compliance and raising your ESG score by ~15 points.",
            "impact": "High",
        })
    if carbon["toxicity_score"] >= 4:
        recs.append({
            "title": "Switch Propellant to Green Alternative",
            "detail": "Replace Hydrazine with AF-M315E (green monopropellant) or Liquid Methane. "
                      "Reduces toxicity score from 5 to 1, improving ESG E-score by up to 20 points.",
            "impact": "High",
        })
    if carbon["total_co2_tons"] > 50:
        recs.append({
            "title": "Purchase Verified Carbon Offsets",
            "detail": f"Purchase {carbon['total_co2_tons']:.0f} tons of Gold Standard VCUs (~$15-50/ton) "
                      f"to carbon-neutralize the launch. This can raise Grade by one tier if offsetting >80%.",
            "impact": "Medium",
        })
    recs.append({
        "title": "Implement Satellite Passivation",
        "detail": "Vent all residual propellant and discharge batteries at end-of-life. "
                  "Required by FCC/ITU for all frequencies. Prevents fragmentation events.",
        "impact": "Medium",
    })
    return recs[:3]


# ─── Main Entry Point ─────────────────────────────────────────────────────────

def assess_esg(
    satellite_mass_kg: float,
    propellant_type: str,
    launch_vehicle_class: str,
    altitude_km: float,
    has_deorbit_system: bool,
    expected_lifetime_years: float,
    has_solar_power: bool,
    mission_benefit_score: float,
    mission_description: str = "",
) -> dict:
    """Full ESG assessment pipeline."""
    carbon = _calc_carbon(satellite_mass_kg, propellant_type, launch_vehicle_class)
    debris = _calc_debris_risk(altitude_km, has_deorbit_system, expected_lifetime_years)
    overall, grade, grade_color = _compute_esg_score(
        carbon, debris, satellite_mass_kg, has_solar_power, mission_benefit_score
    )
    recommendations = _get_recommendations(grade, overall, debris, carbon, satellite_mass_kg)

    return {
        "overall_esg_score": overall,
        "overall_esg_grade": grade,
        "grade_color": grade_color,
        "environmental_breakdown": {
            "carbon": carbon,
            "debris": debris,
        },
        "subscores": {
            "environmental": round(
                max(0, min(100, (100 - carbon["total_co2_tons"] / max(satellite_mass_kg, 1) * 10) * 0.5
                              + (100 - debris["score"]) * 0.5
                              - (carbon["toxicity_score"] - 1) * 8)), 1
            ),
            "social": round(mission_benefit_score, 1),
            "governance": round(min(100, max(0, 65 + (15 if debris["un_compliant"] else -20) + (5 if has_solar_power else 0))), 1),
        },
        "recommendations": recommendations,
        "summary": {
            "total_co2_tons": carbon["total_co2_tons"],
            "debris_compliance": debris["compliance"],
            "un_25yr_compliant": debris["un_compliant"],
            "deorbit_years": debris["effective_decay_years"],
        },
    }

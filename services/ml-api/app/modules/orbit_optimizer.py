"""
Module 6: Orbit Optimizer — Pure math orbital mechanics engine.
Implements Hohmann Transfer, Plane Change, and Tsiolkovsky Equation.
No external physics libraries required.
"""
import math
from typing import List

# ─── Constants ────────────────────────────────────────────────────────────────

MU_EARTH = 3.986004418e14     # Earth's gravitational parameter (m³/s²)
R_EARTH = 6_371_000.0         # Earth's mean radius (m)
G0 = 9.80665                  # Standard gravity (m/s²)


# ─── Orbital Mechanics Formulas ──────────────────────────────────────────────

def circular_velocity(radius_m: float) -> float:
    """Orbital velocity for a circular orbit at given radius from Earth center."""
    return math.sqrt(MU_EARTH / radius_m)


def hohmann_transfer(r1_m: float, r2_m: float) -> dict:
    """
    Hohmann Transfer Orbit — most fuel-efficient way to move between
    two circular coplanar orbits.
    
    Returns delta-v for each burn and transfer orbit period.
    """
    # Velocities on circular orbits
    v1 = circular_velocity(r1_m)
    v2 = circular_velocity(r2_m)

    # Transfer orbit semi-major axis
    a_transfer = (r1_m + r2_m) / 2.0

    # Velocities on the transfer ellipse at periapsis and apoapsis
    v_transfer_periapsis = math.sqrt(MU_EARTH * (2.0 / r1_m - 1.0 / a_transfer))
    v_transfer_apoapsis = math.sqrt(MU_EARTH * (2.0 / r2_m - 1.0 / a_transfer))

    # Delta-V for each burn
    if r2_m >= r1_m:
        # Raising orbit
        dv1 = abs(v_transfer_periapsis - v1)
        dv2 = abs(v2 - v_transfer_apoapsis)
    else:
        # Lowering orbit
        dv1 = abs(v1 - v_transfer_periapsis)
        dv2 = abs(v_transfer_apoapsis - v2)

    # Transfer time = half the orbital period of the transfer ellipse
    t_transfer = math.pi * math.sqrt(a_transfer**3 / MU_EARTH)

    return {
        "dv1": dv1,
        "dv2": dv2,
        "total_dv": dv1 + dv2,
        "transfer_time_s": t_transfer,
        "a_transfer_m": a_transfer,
    }


def plane_change_dv(velocity_ms: float, delta_inclination_deg: float) -> float:
    """
    Delta-V for a simple plane change maneuver.
    Most efficient when performed at the highest point (lowest velocity).
    """
    if abs(delta_inclination_deg) < 0.01:
        return 0.0
    delta_rad = math.radians(abs(delta_inclination_deg))
    return 2.0 * velocity_ms * math.sin(delta_rad / 2.0)


def tsiolkovsky_fuel_mass(delta_v_ms: float, dry_mass_kg: float, isp_s: float) -> float:
    """
    Tsiolkovsky Rocket Equation.
    Returns the propellant mass needed for a given delta-V.
    """
    if delta_v_ms <= 0:
        return 0.0
    ve = isp_s * G0  # Exhaust velocity
    mass_ratio = math.exp(delta_v_ms / ve)
    return dry_mass_kg * (mass_ratio - 1.0)


# ─── 3D Trajectory Generation ────────────────────────────────────────────────

def _generate_orbit_points(radius_m: float, inclination_deg: float,
                           num_points: int = 100, offset_deg: float = 0.0) -> list:
    """Generate 3D points for a circular orbit at given radius and inclination."""
    points = []
    inc_rad = math.radians(inclination_deg)
    off_rad = math.radians(offset_deg)

    # Scale for Three.js (1 unit = 1000 km)
    r_scaled = radius_m / 1_000_000.0  # Convert to thousands of km

    for i in range(num_points + 1):
        theta = 2.0 * math.pi * i / num_points + off_rad
        # Rotate the orbit plane by inclination around X axis
        x = r_scaled * math.cos(theta)
        y = r_scaled * math.sin(theta) * math.cos(inc_rad)
        z = r_scaled * math.sin(theta) * math.sin(inc_rad)
        points.append({"x": round(x, 4), "y": round(y, 4), "z": round(z, 4)})

    return points


def _generate_transfer_points(r1_m: float, r2_m: float,
                               inc1_deg: float, inc2_deg: float,
                               num_points: int = 60) -> list:
    """Generate points for the Hohmann transfer ellipse."""
    points = []
    a = (r1_m + r2_m) / 2.0
    # Eccentricity of transfer orbit
    e = abs(r2_m - r1_m) / (r1_m + r2_m)
    # Inclination linearly interpolated along transfer
    inc1_rad = math.radians(inc1_deg)
    inc2_rad = math.radians(inc2_deg)

    for i in range(num_points + 1):
        # Only half-orbit for Hohmann (0 to π)
        theta = math.pi * i / num_points
        r = a * (1 - e**2) / (1 + e * math.cos(theta))
        r_scaled = r / 1_000_000.0

        # Interpolate inclination
        frac = i / num_points
        inc = inc1_rad + (inc2_rad - inc1_rad) * frac

        x = r_scaled * math.cos(theta)
        y = r_scaled * math.sin(theta) * math.cos(inc)
        z = r_scaled * math.sin(theta) * math.sin(inc)
        points.append({"x": round(x, 4), "y": round(y, 4), "z": round(z, 4)})

    return points


# ─── Main Optimizer Function ─────────────────────────────────────────────────

def optimize_orbit(
    initial_alt_km: float,
    target_alt_km: float,
    initial_inc_deg: float,
    target_inc_deg: float,
    satellite_mass_kg: float,
    isp_s: float = 320.0,
    fuel_cost_per_kg: float = 5000.0,
) -> dict:
    """
    Calculate optimal orbital transfer between two orbits.
    Combines Hohmann Transfer + Plane Change if needed.
    """
    # Convert altitudes to orbital radii (from Earth center)
    r1 = R_EARTH + initial_alt_km * 1000.0
    r2 = R_EARTH + target_alt_km * 1000.0

    burns = []
    total_dv = 0.0
    transfer_time = 0.0
    maneuver_type = "Hohmann Transfer"

    # ── Step 1: Hohmann Transfer (altitude change) ────────────────────────
    hohmann = hohmann_transfer(r1, r2)
    total_dv += hohmann["total_dv"]
    transfer_time += hohmann["transfer_time_s"]

    burns.append({
        "name": "Burn 1 — Hohmann Departure",
        "delta_v_ms": round(hohmann["dv1"], 2),
        "description": f"Prograde burn at {initial_alt_km:.0f} km to enter transfer orbit",
    })
    burns.append({
        "name": "Burn 2 — Hohmann Arrival",
        "delta_v_ms": round(hohmann["dv2"], 2),
        "description": f"Circularization burn at {target_alt_km:.0f} km to achieve target orbit",
    })

    # ── Step 2: Plane Change (inclination change) ─────────────────────────
    delta_inc = abs(target_inc_deg - initial_inc_deg)
    if delta_inc > 0.01:
        maneuver_type = "Hohmann Transfer + Plane Change"
        # Plane change is cheapest at the highest point (lowest velocity)
        v_at_target = circular_velocity(r2)
        pc_dv = plane_change_dv(v_at_target, delta_inc)
        total_dv += pc_dv

        burns.append({
            "name": "Burn 3 — Plane Change",
            "delta_v_ms": round(pc_dv, 2),
            "description": f"Inclination change of {delta_inc:.1f}° at {target_alt_km:.0f} km",
        })

    # ── Step 3: Fuel Calculation (Tsiolkovsky) ────────────────────────────
    fuel_mass = tsiolkovsky_fuel_mass(total_dv, satellite_mass_kg, isp_s)
    fuel_cost = fuel_mass * fuel_cost_per_kg

    # ── Step 4: Generate 3D Trajectories ──────────────────────────────────
    trajectories = [
        {
            "label": f"Initial Orbit ({initial_alt_km:.0f} km)",
            "color": "#3B82F6",  # blue
            "points": _generate_orbit_points(r1, initial_inc_deg),
        },
        {
            "label": "Transfer Orbit",
            "color": "#F59E0B",  # amber
            "points": _generate_transfer_points(r1, r2, initial_inc_deg, target_inc_deg),
        },
        {
            "label": f"Target Orbit ({target_alt_km:.0f} km)",
            "color": "#10B981",  # green
            "points": _generate_orbit_points(r2, target_inc_deg),
        },
    ]

    return {
        "total_delta_v_ms": round(total_dv, 2),
        "fuel_mass_kg": round(fuel_mass, 2),
        "fuel_cost_usd": round(fuel_cost, 2),
        "transfer_time_hours": round(transfer_time / 3600.0, 2),
        "maneuver_type": maneuver_type,
        "burns": burns,
        "trajectories": trajectories,
        "initial_altitude_km": initial_alt_km,
        "target_altitude_km": target_alt_km,
        "initial_inclination_deg": initial_inc_deg,
        "target_inclination_deg": target_inc_deg,
        "satellite_mass_kg": satellite_mass_kg,
    }

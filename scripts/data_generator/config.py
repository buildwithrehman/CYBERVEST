import random
import argparse

PROFILES = {
    "demo": {
        "org_count": 3,
        "services_per_org": (5, 10),
        "assets_per_service": (5, 15),
        "vulns_per_asset": (1, 5),
        "events_per_asset": (10, 50),
        "controls_per_org": (10, 20),
        "incidents_per_org": (5, 20),
    },
    "sih": {
        "org_count": 10,
        "services_per_org": (3, 8),
        "assets_per_service": (10, 30),
        "vulns_per_asset": (2, 8),
        "events_per_asset": (20, 100),
        "controls_per_org": (15, 30),
        "incidents_per_org": (20, 100),
    },
    "stress": {
        "org_count": 20,
        "services_per_org": (5, 10),
        "assets_per_service": (20, 50),
        "vulns_per_asset": (5, 15),
        "events_per_asset": (50, 200),
        "controls_per_org": (20, 40),
        "incidents_per_org": (50, 200),
    }
}

def get_args():
    parser = argparse.ArgumentParser(description="Synthetic Data Generator")
    parser.add_argument("--profile", type=str, default="demo", choices=["demo", "sih", "stress"])
    parser.add_argument("--seed", type=int, default=20260907)
    return parser.parse_args()

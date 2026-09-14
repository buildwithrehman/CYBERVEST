import pytest
from datetime import datetime, timedelta

def cluster_events(ev_list_sorted):
    if not ev_list_sorted:
        return 0
    clusters = 1
    for i in range(1, len(ev_list_sorted)):
        if (ev_list_sorted[i] - ev_list_sorted[i-1]).total_seconds() > 3600:
            clusters += 1
    return clusters

def test_clustering_A():
    base = datetime(2023, 1, 1, 10, 0, 0)
    evs = [base, base + timedelta(minutes=50), base + timedelta(minutes=100)]
    assert cluster_events(evs) == 1

def test_clustering_B():
    base = datetime(2023, 1, 1, 10, 0, 0)
    evs = [base, base + timedelta(minutes=61)]
    assert cluster_events(evs) == 2

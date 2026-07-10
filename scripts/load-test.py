#!/usr/bin/env python3
"""Quick load test for DataSphere RH."""
import asyncio, aiohttp, time, sys

BASE_URL = "http://localhost:3000"

ENDPOINTS = ['/api/healthz', '/api/llm/providers', '/api/llm/templates', '/api/llm/workflows', '/api/security-audit']

async def worker(session, duration):
    end = time.time() + duration
    count = 0; errors = 0; latencies = []
    while time.time() < end:
        for ep in ENDPOINTS:
            start = time.time()
            try:
                async with session.get(f"{BASE_URL}{ep}", timeout=aiohttp.ClientTimeout(total=10)) as r:
                    if r.status == 200: count += 1
                    else: errors += 1
            except: errors += 1
            latencies.append((time.time() - start) * 1000)
            await asyncio.sleep(0.05)
    return count, errors, latencies

async def main():
    duration = int(sys.argv[sys.argv.index('--duration')+1]) if '--duration' in sys.argv else 15
    users = int(sys.argv[sys.argv.index('--users')+1]) if '--users' in sys.argv else 20
    print(f"Load test: {users} users × {duration}s on {len(ENDPOINTS)} endpoints")
    conn = aiohttp.TCPConnector(limit=100)
    async with aiohttp.ClientSession(connector=conn) as session:
        # Sanity check
        async with session.get(f"{BASE_URL}/api/healthz") as r:
            if r.status != 200: print("Server not ready"); return
        print("✓ Server accessible")
        start = time.time()
        results = await asyncio.gather(*[worker(session, duration) for _ in range(users)])
        elapsed = time.time() - start
        total_req = sum(r[0] for r in results)
        total_err = sum(r[1] for r in results)
        all_lat = sorted([l for r in results for l in r[2]])
        rps = total_req / elapsed if elapsed > 0 else 0
        err_rate = (total_err / (total_req + total_err) * 100) if (total_req + total_err) > 0 else 0
        p50 = all_lat[int(len(all_lat)*0.5)] if all_lat else 0
        p95 = all_lat[int(len(all_lat)*0.95)] if all_lat else 0
        p99 = all_lat[int(len(all_lat)*0.99)] if all_lat else 0
        print(f"\n{'='*60}")
        print(f"  Requêtes: {total_req} | Erreurs: {total_err} ({err_rate:.1f}%)")
        print(f"  Débit: {rps:.1f} req/s | Durée: {elapsed:.1f}s")
        print(f"  Latence P50: {p50:.0f}ms | P95: {p95:.0f}ms | P99: {p99:.0f}ms")
        if err_rate < 1 and rps > 10: print("  ✓ TEST RÉUSSI")
        elif err_rate < 5: print("  ⚠ ACCEPTABLE")
        else: print("  ✗ ÉCHEC")
        print(f"{'='*60}")

asyncio.run(main())

#!/usr/bin/env python3
"""
Tests de charge avancés — DataSphere RH
=========================================
Scénarios :
  1. 100+ utilisateurs simultanés sur le dashboard
  2. Charge API LLM (chat + RAG + templates)
  3. Connexions SSE simultanées (analytics-live)
  4. Pic de charge progressif (ramp-up)
  5. Test endurance (30 min sustain)
  6. Test limite (trouver le point de rupture)

Usage :
  python3 scripts/load-test-advanced.py --scenario dashboard --users 100
  python3 scripts/load-test-advanced.py --scenario llm --users 20 --duration 60
  python3 scripts/load-test-advanced.py --scenario rampup --max-users 200
  python3 scripts/load-test-advanced.py --scenario sse --users 50 --duration 30
  python3 scripts/load-test-advanced.py --scenario endurance --duration 1800
  python3 scripts/load-test-advanced.py --scenario stress --max-users 500
"""
import argparse
import asyncio
import aiohttp
import json
import time
import statistics
import sys
from collections import defaultdict
from datetime import datetime

# ━━━ Couleurs ━━━
def green(s): return f'\033[32m{s}\033[0m'
def red(s): return f'\033[31m{s}\033[0m'
def yellow(s): return f'\033[33m{s}\033[0m'
def cyan(s): return f'\033[36m{s}\033[0m'
def bold(s): return f'\033[1m{s}\033[0m'

# ━━━ Métriques avancées ━━━

class AdvancedMetrics:
    def __init__(self):
        self.latencies = defaultdict(list)
        self.errors = defaultdict(int)
        self.success = defaultdict(int)
        self.status_codes = defaultdict(lambda: defaultdict(int))
        self.concurrent = defaultdict(int)
        self.start_time = None
        self.end_time = None
        self.timeline = []  # [(timestamp, active_workers)]
        self.max_concurrent = 0
        self.current_workers = 0

    def record(self, endpoint, latency_ms, status_code, success):
        self.latencies[endpoint].append(latency_ms)
        self.status_codes[endpoint][status_code] += 1
        if success:
            self.success[endpoint] += 1
        else:
            self.errors[endpoint] += 1

    def worker_start(self):
        self.current_workers += 1
        if self.current_workers > self.max_concurrent:
            self.max_concurrent = self.current_workers
        if self.start_time:
            self.timeline.append((time.time(), self.current_workers))

    def worker_end(self):
        self.current_workers -= 1

    def summary(self, scenario_name):
        total_req = sum(len(v) for v in self.latencies.values())
        total_success = sum(self.success.values())
        total_errors = sum(self.errors.values())
        duration = self.end_time - self.start_time if self.end_time else 0
        rps = total_req / duration if duration > 0 else 0
        error_rate = (total_errors / total_req * 100) if total_req > 0 else 0

        print()
        print(cyan('=' * 70))
        print(cyan(f'  RAPPORT DE CHARGE — {scenario_name.upper()}'))
        print(cyan('=' * 70))
        print(f'  Scénario          : {scenario_name}')
        print(f'  Durée totale      : {duration:.1f}s')
        print(f'  Requêtes totales  : {total_req}')
        print(f'  Succès            : {green(str(total_success))}')
        print(f'  Erreurs           : {red(str(total_errors)) if total_errors > 0 else green("0")}')
        print(f'  Taux d\'erreur     : {error_rate:.2f}%')
        print(f'  Débit             : {rps:.1f} req/s')
        print(f'  Concurrent max    : {self.max_concurrent}')
        print()
        print(cyan('  Latences par endpoint :'))
        print(f'  {"Endpoint":<50} {"Count":>6} {"P50":>8} {"P95":>8} {"P99":>8} {"Min":>8} {"Max":>8} {"Err":>5}')
        print(f'  {"-"*50} {"-"*6} {"-"*8} {"-"*8} {"-"*8} {"-"*8} {"-"*8} {"-"*5}')
        for endpoint in sorted(self.latencies.keys()):
            lats = sorted(self.latencies[endpoint])
            count = len(lats)
            p50 = lats[int(count * 0.5)] if count > 0 else 0
            p95 = lats[int(count * 0.95)] if count > 0 else 0
            p99 = lats[int(count * 0.99)] if count > 0 else 0
            mn = min(lats) if lats else 0
            mx = max(lats) if lats else 0
            err = self.errors[endpoint]
            ep_display = endpoint[:50] if len(endpoint) <= 50 else endpoint[:47] + '...'
            err_str = red(str(err)) if err > 0 else green('0')
            print(f'  {ep_display:<50} {count:>6} {p50:>7.0f}ms {p95:>7.0f}ms {p99:>7.0f}ms {mn:>7.0f}ms {mx:>7.0f}ms {err_str:>5}')
        print()
        print(cyan('  Codes HTTP :'))
        for ep in sorted(self.status_codes.keys()):
            for code, count in sorted(self.status_codes[ep].items()):
                color = green if 200 <= code < 300 else (yellow if 400 <= code < 500 else red)
                print(f'    {ep[:40]:<40} {color(str(code))} : {count}')
        print()

        # Verdict
        if error_rate < 1 and rps > 10:
            print(green(f'  ✓ TEST RÉUSSI — {error_rate:.2f}% erreurs, {rps:.1f} req/s'))
        elif error_rate < 5:
            print(yellow(f'  ⚠ TEST ACCEPTABLE — {error_rate:.2f}% erreurs, {rps:.1f} req/s'))
        else:
            print(red(f'  ✗ TEST ÉCHEC — {error_rate:.2f}% erreurs, {rps:.1f} req/s'))

        print(cyan('=' * 70))

        # Recommandations
        print()
        print(cyan('  Recommandations :'))
        if error_rate > 5:
            print(red(f'    • Taux d\'erreur élevé ({error_rate:.2f}%) — vérifiez les ressources serveur'))
        if rps < 10:
            print(yellow(f'    • Débit faible ({rps:.1f} req/s) — envisagez un scaling horizontal'))
        for ep in self.latencies:
            lats = self.latencies[ep]
            if lats and lats[int(len(lats) * 0.95)] > 5000:
                print(yellow(f'    • Latence P95 élevée sur {ep[:40]} — optimisez cet endpoint'))
        if self.max_concurrent > 100 and error_rate > 1:
            print(yellow(f'    • {self.max_concurrent} users simultanés — envisagez Redis + load balancer'))
        if not any([error_rate > 5, rps < 10]):
            print(green('    • Aucune action requise — performance satisfaisante'))
        print()


# ━━━ Scénarios ━━━

ENDPOINTS_DASHBOARD = [
    ('GET', '/api/pilotage?nocache=1', None),
    ('GET', '/api/health', None),
    ('GET', '/api/notifications?limit=10', None),
    ('GET', '/api/audit-advanced?pageSize=10', None),
    ('GET', '/api/llm/providers', None),
]

ENDPOINTS_LLM = [
    ('POST', '/api/llm/chat', {
        'provider': 'zai', 'model': 'glm-4.6',
        'messages': [{'role': 'user', 'content': 'Bonjour'}],
        'maxTokens': 30,
    }),
    ('POST', '/api/llm/rag/ask', {
        'question': 'Combien de jours de télétravail ?',
    }),
    ('POST', '/api/llm/templates/run', {
        'templateId': 'contrat_cdi_resume',
        'variables': {'poste': 'Dev', 'salaire': '1500000', 'date_embauche': '2026-01-15', 'periode_essai': '3 mois', 'lieu': 'Conakry'},
    }),
    ('POST', '/api/chatbot', {
        'message': 'Bonjour',
    }),
]

async def worker_dashboard(session, base_url, metrics, duration):
    end_time = time.time() + duration
    while time.time() < end_time:
        for method, path, body in ENDPOINTS_DASHBOARD:
            start = time.time()
            success = False
            status = 0
            try:
                if method == 'GET':
                    async with session.get(f'{base_url}{path}', timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        status = resp.status
                        success = resp.status == 200
                else:
                    async with session.post(f'{base_url}{path}', json=body, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                        status = resp.status
                        success = resp.status == 200
            except:
                success = False
                status = 0
            latency = (time.time() - start) * 1000
            metrics.record(f'{method} {path[:40]}', latency, status, success)
            await asyncio.sleep(0.1)

async def worker_llm(session, base_url, metrics, duration):
    end_time = time.time() + duration
    idx = 0
    while time.time() < end_time:
        method, path, body = ENDPOINTS_LLM[idx % len(ENDPOINTS_LLM)]
        idx += 1
        start = time.time()
        success = False
        status = 0
        try:
            async with session.post(f'{base_url}{path}', json=body, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                status = resp.status
                success = resp.status == 200
        except:
            success = False
            status = 0
        latency = (time.time() - start) * 1000
        metrics.record(f'{method} {path[:40]}', latency, status, success)
        await asyncio.sleep(1.0)  # 1s entre appels LLM (rate limit)

async def worker_sse(session, base_url, metrics, duration, idx):
    start = time.time()
    received = 0
    try:
        async with session.get(f'{base_url}/api/analytics-live', timeout=aiohttp.ClientTimeout(total=duration + 5)) as resp:
            async for line in resp.content:
                if line.startswith(b'data: '):
                    received += 1
                if time.time() - start > duration:
                    break
        metrics.record('SSE analytics-live', (time.time() - start) * 1000, 200, True)
    except:
        metrics.record('SSE analytics-live', (time.time() - start) * 1000, 0, False)

async def scenario_dashboard(base_url, users, duration):
    metrics = AdvancedMetrics()
    metrics.start_time = time.time()
    connector = aiohttp.TCPConnector(limit=200, force_close=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = []
        for _ in range(users):
            metrics.worker_start()
            tasks.append(asyncio.create_task(worker_dashboard(session, base_url, metrics, duration)))
        await asyncio.gather(*tasks)
        for _ in range(users):
            metrics.worker_end()
    metrics.end_time = time.time()
    metrics.summary('Dashboard (100+ users)')

async def scenario_llm(base_url, users, duration):
    metrics = AdvancedMetrics()
    metrics.start_time = time.time()
    connector = aiohttp.TCPConnector(limit=100, force_close=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = []
        for _ in range(users):
            metrics.worker_start()
            tasks.append(asyncio.create_task(worker_llm(session, base_url, metrics, duration)))
        await asyncio.gather(*tasks)
        for _ in range(users):
            metrics.worker_end()
    metrics.end_time = time.time()
    metrics.summary('LLM API Load')

async def scenario_sse(base_url, users, duration):
    metrics = AdvancedMetrics()
    metrics.start_time = time.time()
    connector = aiohttp.TCPConnector(limit=200, force_close=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = []
        for i in range(users):
            metrics.worker_start()
            tasks.append(asyncio.create_task(worker_sse(session, base_url, metrics, duration, i)))
        await asyncio.gather(*tasks)
        for _ in range(users):
            metrics.worker_end()
    metrics.end_time = time.time()
    metrics.summary('SSE Concurrent Connections')

async def scenario_rampup(base_url, max_users, duration):
    """Ramp-up progressif : 0 → max_users sur la durée totale."""
    metrics = AdvancedMetrics()
    metrics.start_time = time.time()
    connector = aiohttp.TCPConnector(limit=500, force_close=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = []
        ramp_duration = duration * 0.5  # 50% du temps pour le ramp-up
        interval = ramp_duration / max_users

        for i in range(max_users):
            metrics.worker_start()
            tasks.append(asyncio.create_task(worker_dashboard(session, base_url, metrics, duration)))
            await asyncio.sleep(interval)
            if (i + 1) % 20 == 0:
                print(yellow(f'  ▸ Ramp-up : {i + 1}/{max_users} workers actifs...'))

        await asyncio.gather(*tasks)
    metrics.end_time = time.time()
    metrics.summary(f'Ramp-up (0 → {max_users} users)')

async def scenario_stress(base_url, max_users):
    """Test de stress : augmente jusqu'au point de rupture."""
    metrics = AdvancedMetrics()
    metrics.start_time = time.time()
    batch_size = 25
    duration_per_batch = 10

    connector = aiohttp.TCPConnector(limit=max_users + 50, force_close=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        all_tasks = []
        current_users = 0

        while current_users < max_users:
            batch = min(batch_size, max_users - current_users)
            current_users += batch
            print(yellow(f'  ▸ Stress : {current_users} users simultanés (batch de {batch})...'))

            batch_tasks = []
            for _ in range(batch):
                metrics.worker_start()
                task = asyncio.create_task(worker_dashboard(session, base_url, metrics, duration_per_batch))
                batch_tasks.append(task)
                all_tasks.append(task)

            # Attend la fin de ce batch avant d'ajouter le suivant
            await asyncio.gather(*batch_tasks)

            # Vérifie le taux d'erreur — si > 20%, arrête
            total_req = sum(len(v) for v in metrics.latencies.values())
            total_err = sum(metrics.errors.values())
            if total_req > 0 and (total_err / total_req * 100) > 20:
                print(red(f'  ✗ Point de rupture détecté à {current_users} users ({total_err/total_req*100:.1f}% erreurs)'))
                break

    metrics.end_time = time.time()
    metrics.summary(f'Stress Test (rupture à {current_users} users)')

async def scenario_endurance(base_url, duration):
    """Test d'endurance : charge modérée soutenue."""
    metrics = AdvancedMetrics()
    metrics.start_time = time.time()
    users = 20
    connector = aiohttp.TCPConnector(limit=50, force_close=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = []
        for _ in range(users):
            metrics.worker_start()
            tasks.append(asyncio.create_task(worker_dashboard(session, base_url, metrics, duration)))
        await asyncio.gather(*tasks)
    metrics.end_time = time.time()
    metrics.summary(f'Endurance ({users} users, {duration}s)')

# ━━━ Main ━━━

async def main():
    parser = argparse.ArgumentParser(description='Tests de charge avancés — DataSphere RH')
    parser.add_argument('--base-url', default='http://localhost:3000')
    parser.add_argument('--scenario', required=True,
                       choices=['dashboard', 'llm', 'sse', 'rampup', 'stress', 'endurance'],
                       help='Scénario de test')
    parser.add_argument('--users', type=int, default=100, help='Nombre d\'utilisateurs simultanés')
    parser.add_argument('--max-users', type=int, default=200, help='Users max (rampup/stress)')
    parser.add_argument('--duration', type=int, default=30, help='Durée en secondes')
    args = parser.parse_args()

    print(cyan('=' * 70))
    print(cyan('  TESTS DE CHARGE AVANCÉS — DataSphere RH'))
    print(cyan('=' * 70))
    print(f'  Base URL    : {args.base_url}')
    print(f'  Scénario    : {args.scenario}')
    print(f'  Users       : {args.users if args.scenario not in ["rampup", "stress"] else f"0 → {args.max_users}"}')
    print(f'  Durée       : {args.duration}s')
    print(cyan('=' * 70))

    # Sanity check
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f'{args.base_url}/api/health', timeout=aiohttp.ClientTimeout(total=5)) as r:
                if r.status != 200:
                    print(red(f'✗ Serveur injoignable (HTTP {r.status})'))
                    sys.exit(1)
        print(green('✓ Serveur accessible'))
    except Exception as e:
        print(red(f'✗ Serveur injoignable : {e}'))
        sys.exit(1)

    if args.scenario == 'dashboard':
        await scenario_dashboard(args.base_url, args.users, args.duration)
    elif args.scenario == 'llm':
        await scenario_llm(args.base_url, args.users, args.duration)
    elif args.scenario == 'sse':
        await scenario_sse(args.base_url, args.users, args.duration)
    elif args.scenario == 'rampup':
        await scenario_rampup(args.base_url, args.max_users, args.duration)
    elif args.scenario == 'stress':
        await scenario_stress(args.base_url, args.max_users)
    elif args.scenario == 'endurance':
        await scenario_endurance(args.base_url, args.duration)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(red('\n✗ Interrompu'))
        sys.exit(130)

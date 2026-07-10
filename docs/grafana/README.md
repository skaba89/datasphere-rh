# ━━━ Grafana — Dashboard DataSphere RH ━━━

## Installation

### 1. Configurer Prometheus

Dans `prometheus.yml` :

```yaml
scrape_configs:
  - job_name: 'datasphere-rh'
    scrape_interval: 30s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
```

### 2. Importer le dashboard

1. Ouvrir Grafana → **Dashboards** → **Import**
2. Upload le fichier `dashboard.json`
3. Sélecteur la datasource Prometheus
4. Cliquer **Import**

### 3. Panels inclus

| Panel | Type | Métrique |
|---|---|---|
| Statut global (uptime) | Stat | `datasphere_process_uptime_seconds` |
| Sociétés | Stat | `datasphere_companies_total` |
| Employés | Stat | `datasphere_employees_total` |
| Appels LLM | Stat | `datasphere_llm_usages_total` |
| Tokens consommés | Stat | `datasphere_llm_tokens_total` |
| Mémoire RSS | Gauge | `datasphere_process_memory_rss_bytes` |
| Latence moyenne LLM | TimeSeries | `datasphere_llm_avg_duration_ms` |
| Consommation tokens | TimeSeries (stacked) | `datasphere_llm_prompt_tokens_total` + `completion_tokens_total` |
| Inventaire données | Table | companies, employees, contracts, documents, chunks, api_keys |
| Activité IA | Table | llm_usages, generations, workflows, webhooks |
| Audit & Notifications | Table | audit_logs, notifications, leaves, expenses |
| Heap mémoire | TimeSeries | `heap_used_bytes` + `heap_total_bytes` |

### 4. Alertes recommandées

Configurer dans Grafana → **Alerting** :

| Alerte | Condition | Severity |
|---|---|---|
| Service down | `up == 0` pendant 1min | Critical |
| Latence LLM élevée | `datasphere_llm_avg_duration_ms > 5000` pendant 5min | Warning |
| Mémoire élevée | `datasphere_process_memory_rss_bytes > 1073741824` (1GB) | Warning |
| Beaucoup d'erreurs LLM | taux d'erreur > 10% sur 1h | Warning |
| Uptime redémarré | `increase(datasphere_process_uptime_seconds[5m]) < 0` | Info |

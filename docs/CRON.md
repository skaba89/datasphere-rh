# Cron jobs — Alertes proactives DataSphere RH

## Endpoints disponibles

### `GET /api/cron/contract-alerts?key=XXX`

Scanne tous les contrats fournisseurs et déclenche :
- Création d'une notification IN_APP pour chaque contrat expirant dans ≤ 30 jours
- Appel des webhooks configurés pour l'événement `contract.expiring`
- Enregistrement d'une entrée `ALERT` dans l'audit trail avancé

**Authentification** : clé passée en query string `?key=...`. La clé attendue est :
- Variable d'environnement `CRON_SECRET` (recommandé en prod)
- Ou fallback hardcoded `datasphere-cron-2026` (démo uniquement)

## Scheduling recommandé

### Option 1 — Systemd timer (Linux serveur)

Créer `/etc/systemd/system/datasphere-cron.service` :
```ini
[Unit]
Description=DataSphere RH cron - alertes contrats
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -fsS "https://rh.datasphere.gn/api/cron/contract-alerts?key=VOTRE_CLE_SECRETE"
User=www-data
```

Créer `/etc/systemd/system/datasphere-cron.timer` :
```ini
[Unit]
Description=DataSphere RH cron - tous les jours à 8h00

[Timer]
OnCalendar=*-*-* 08:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Activer :
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now datasphere-cron.timer
sudo systemctl list-timers | grep datasphere
```

### Option 2 — Cron Linux classique

Ajouter à `crontab -e` :
```cron
# DataSphere RH - alertes contrats à 8h00 chaque jour
0 8 * * * curl -fsS "https://rh.datasphere.gn/api/cron/contract-alerts?key=VOTRE_CLE_SECRETE" >> /var/log/datasphere-cron.log 2>&1
```

### Option 3 — Vercel Cron (si déployé sur Vercel)

Dans `vercel.json` :
```json
{
  "crons": [
    {
      "path": "/api/cron/contract-alerts?key=VOTRE_CLE_SECRETE",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## Test manuel

```bash
# Sans clé → 401 Unauthorized
curl https://rh.datasphere.gn/api/cron/contract-alerts

# Avec clé → 200 + rapport d'alertes
curl "https://rh.datasphere.gn/api/cron/contract-alerts?key=VOTRE_CLE_SECRETE"
```

## Sévérités

| `daysLeft` | `severity` | Action |
|---|---|---|
| `< 0` | `EXPIRE` | Le contrat a expiré — action immédiate requise |
| `0-7` | `URGENT` | Renouvellement urgent cette semaine |
| `8-15` | `ATTENTION` | Préparer le renouvellement sous 2 semaines |
| `16-30` | `SURVEILLER` | Surveiller et planifier le renouvellement |

## Configuration de la clé en production

Dans `.env` :
```
CRON_SECRET=votre-cle-secrete-tres-longue-ici
```

## Monitoring

1. **Audit trail** : chaque exécution crée N entrées `ALERT` dans `/api/audit-advanced?module=CONTRACTS_MGMT`
2. **Notifications** : les notifications IN_APP sont visibles via la cloche 🔔 en haut à droite
3. **Webhooks** : `lastTriggered` mis à jour sur chaque webhook correspondant
4. **Logs serveur** : `journalctl -u datasphere-cron.service` (systemd) ou `/var/log/datasphere-cron.log` (cron classique)

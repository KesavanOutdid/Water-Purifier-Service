# 🐳 Docker & Dynamic IP Deployment Guide

This guide explains how to run the entire **Water Purifier Service Platform** with Docker, auto-detecting host network IPs across different machines and networks.

---

## ⚡ 1-Step Quick Start (All Services)

### On Windows (PowerShell):
```powershell
.\run-docker.ps1
```

### On Linux / macOS / Git Bash:
```bash
chmod +x ./run-docker.sh
./run-docker.sh
```

### What this script does automatically:
1. 🔍 **Scans active network adapters** to find your machine's current WiFi / LAN IPv4 address (e.g. `192.168.0.18`).
2. ⚙️ **Synchronizes all configs**:
   - Updates `FRONTEND/Admin/.env.local`
   - Updates `FRONTEND/App/service_app/.env`
   - Updates root `.env`
3. 🐳 **Builds & boots all Docker containers** (`Backend API`, `Next.js Admin Dashboard`, and `Redis Cache`).

---

## 🌐 Live URLs Once Running

| Service | Local URL | LAN / WiFi URL (for other PCs / Phones) |
| :--- | :--- | :--- |
| **Admin Web Dashboard** | `http://localhost:5003` | `http://<YOUR_IP>:5003` |
| **Backend API Docs (Swagger)**| `http://localhost:5001/api-docs` | `http://<YOUR_IP>:5001/api-docs` |
| **Redis Cache** | `localhost:6379` | `localhost:6379` |
| **Mobile App Backend Target** | - | `http://<YOUR_IP>:5001` |

---

## 📱 Building the Flutter Mobile App with Active IP

Whenever you are on a new WiFi or machine and want to build the APK connecting to your current IP:

```powershell
.\build-apk.ps1
```
The script will prompt to confirm your detected IP, update `FRONTEND/App/service_app/.env`, and output the APK to:
`FRONTEND\App\service_app\build\app\outputs\flutter-apk\app-release.apk`

---

## 🛠️ Individual Service Management (Docker Commands)

### 1. Run Only Backend & Redis:
```bash
cd BACKEND
docker compose up --build
```

### 2. Run Only Admin Web:
```bash
cd FRONTEND/Admin
docker compose up --build
```

### 3. Run Everything Manually with standard docker-compose:
```bash
docker compose up --build -d
```

### 4. Stop all running containers:
```bash
docker compose down
```

### 5. View live container logs:
```bash
docker compose logs -f
```

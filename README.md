# Uptix Open Source 🚀

Uptix is a real-time monitoring tool for your servers and websites. This is the Open Source version designed for self-hosting.

## Features
- **Real-time Dashboard**: CPU, RAM, and Disk metrics.
- **Service Uptime**: Website monitoring with automated checks.
- **Email Alerts**: Get notified via SMTP when a site goes down or CPU is critical.
- **Secure Login**: Simple single-tenant authentication.
- **Lightweight Agent**: High-performance Rust agent.

## Components
- **Hub**: Node.js backend (Socket.IO + Express).
- **Frontend**: React + Vite dashboard.
- **Agent**: High-performance Rust agent (available at [uptix-agent](https://github.com/xavdp-pro/uptix-agent)).

## Setup
1. Clone the repository.
2. Install dependencies for `hub` and `frontend`.
3. Configure `.env` files (including SMTP settings for alerts).
4. Run the Hub and Frontend.

## License
MIT

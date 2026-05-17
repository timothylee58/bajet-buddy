# Architecture Layer Flow

![bajet_buddies_tech_architecture.svg](Architecture%20Layer%20Flow/bajet_buddies_tech_architecture.svg)

![image.png](Architecture%20Layer%20Flow/image.png)

**Deployment topology**
Frontend: Vercel (auto-deploy on main branch push)
Backend: Railway (Docker container, always-on, ~RM22/mo)
Database: Supabase free tier (500MB, sufficient for hackathon)
Cache: Redis on Railway sidecar
CI/CD: GitHub Actions — lint → test → deploy on PR merge
Monitoring: Railway metrics + Supabase dashboard

UPDATE: AGENTS HAS BEEN CHANGED —> REFER [Agents](https://www.notion.so/Agents-362c05476e4380838288c7fde5ad6fa7?pvs=21)
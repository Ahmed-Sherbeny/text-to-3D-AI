# 🚀 START HERE - OptiForge3D Infrastructure

## Welcome!

You're looking at the **complete Docker infrastructure** for OptiForge3D, a 3D model optimization platform.

---

## ⚡ Quick Start (5 Minutes)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit passwords (IMPORTANT!)
# Open .env and change the default passwords

# 3. Start everything
docker compose up -d

# 4. Verify (wait 30 seconds first)
bash verify-infrastructure.sh       # Linux/macOS/Git Bash
.\verify-infrastructure.ps1         # Windows PowerShell

# 5. Access services
# PostgreSQL: localhost:5432
# Redis: localhost:6379
# MinIO Console: http://localhost:9001
```

✅ **Done!** You now have a running infrastructure with PostgreSQL, Redis, and MinIO.

---

## 📚 What to Read First

### I'm New Here
1. **[README.md](README.md)** - Start here for overview
2. **[SETUP.md](SETUP.md)** - Follow step-by-step setup
3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Bookmark this for daily commands

### I'm a Backend Developer
1. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Connection strings and commands
2. **[docker/postgres/README.md](docker/postgres/README.md)** - Database guide
3. **[docker/redis/README.md](docker/redis/README.md)** - Cache guide
4. **[docker/minio/README.md](docker/minio/README.md)** - Storage guide

### I'm a DevOps Engineer
1. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
2. **[BEST_PRACTICES.md](BEST_PRACTICES.md)** - Design decisions
3. **[docker-compose.yml](docker-compose.yml)** - Every line explained
4. **[TESTING.md](TESTING.md)** - Comprehensive tests

### I Need to Find Something
**[INDEX.md](INDEX.md)** - Complete documentation index

---

## 🏗️ What's Included

### Services
- **PostgreSQL 16** - Relational database (port 5432)
- **Redis 7** - Cache & message broker (port 6379)
- **MinIO** - S3-compatible storage (ports 9000, 9001)

### Features
- ✅ Production-ready configuration
- ✅ Persistent data storage
- ✅ Automated health checks
- ✅ Service discovery (DNS)
- ✅ Security best practices
- ✅ Comprehensive documentation

### MinIO Buckets
- `raw-uploads` - User uploaded 3D files
- `generated-models` - Optimized outputs

---

## 🔍 Common Tasks

### Start Services
```bash
docker compose up -d
```

### Check Status
```bash
docker compose ps
```

### View Logs
```bash
docker compose logs -f
```

### Stop Services
```bash
docker compose down
```

### Connect to PostgreSQL
```bash
docker compose exec postgres psql -U optiforge_user -d optiforge_db
```

### Connect to Redis
```bash
docker compose exec redis redis-cli
```

### Access MinIO Console
Open browser: http://localhost:9001

---

## 📖 Documentation Structure

```
📁 OptiForge3D/
│
├── 📄 START_HERE.md ⭐ (You are here!)
├── 📄 README.md (Project overview)
├── 📄 INDEX.md (Documentation index)
│
├── 📘 SETUP.md (Detailed setup guide)
├── 📘 QUICK_REFERENCE.md (Command cheat sheet)
├── 📘 ARCHITECTURE.md (Visual diagrams)
├── 📘 BEST_PRACTICES.md (Design decisions)
├── 📘 TESTING.md (Testing guide)
│
├── 🐳 docker-compose.yml (Main config - fully commented!)
├── 🔐 .env (Your credentials)
├── 📋 .env.example (Template)
│
└── 📂 docker/ (Service-specific docs)
    ├── postgres/README.md
    ├── redis/README.md
    └── minio/README.md
```

---

## ⚠️ Important First Steps

### 1. Change Passwords!
The `.env` file has default passwords. **Change them before deploying to production!**

```bash
# Open .env
nano .env  # or code .env

# Change these:
POSTGRES_PASSWORD=your_secure_password_here
MINIO_ROOT_PASSWORD=your_secure_password_here
```

### 2. Never Commit .env
The `.gitignore` file already prevents this, but double-check:
```bash
git status .env
# Should show: "nothing to commit"
```

### 3. Verify Everything Works
After starting services:
```bash
bash verify-infrastructure.sh
```

All checks should pass ✓

---

## 🎯 What Can I Do Now?

### Test the Database
```bash
docker compose exec postgres psql -U optiforge_user -d optiforge_db

# Try a query
optiforge_db=# SELECT * FROM system_health;
optiforge_db=# \q
```

### Test Redis
```bash
docker compose exec redis redis-cli

# Try commands
127.0.0.1:6379> PING
127.0.0.1:6379> SET test "Hello OptiForge3D"
127.0.0.1:6379> GET test
127.0.0.1:6379> exit
```

### Test MinIO
1. Open: http://localhost:9001
2. Login:
   - Username: `minioadmin` (from .env)
   - Password: (from .env)
3. Click "Buckets" - you should see:
   - raw-uploads
   - generated-models

---

## 🐍 Connect from Python

### PostgreSQL
```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",  # or "postgres" from Docker
    port=5432,
    database="optiforge_db",
    user="optiforge_user",
    password="your_password"
)
```

### Redis
```python
import redis

client = redis.Redis(
    host='localhost',  # or "redis" from Docker
    port=6379,
    decode_responses=True
)

client.set('key', 'value')
print(client.get('key'))
```

### MinIO
```python
from minio import Minio

client = Minio(
    "localhost:9000",  # or "minio:9000" from Docker
    access_key="minioadmin",
    secret_key="your_password",
    secure=False
)

# List buckets
for bucket in client.list_buckets():
    print(bucket.name)
```

---

## ❓ Troubleshooting

### Services won't start
```bash
# Check logs
docker compose logs

# Check if ports are already in use
# Windows
netstat -ano | findstr "5432 6379 9000"

# Linux/macOS
lsof -i :5432
lsof -i :6379
lsof -i :9000
```

### Can't connect to services
```bash
# Check containers are running
docker compose ps

# Check health
docker compose ps | grep healthy

# Restart if needed
docker compose restart
```

### Complete reset (DELETES ALL DATA!)
```bash
docker compose down -v
docker compose up -d
```

---

## 📞 Need Help?

### Check Documentation
- **[INDEX.md](INDEX.md)** - Find the right doc
- **[SETUP.md](SETUP.md)** - Troubleshooting section
- **[TESTING.md](TESTING.md)** - Verify everything works

### Common Issues Solved
- Port conflicts → [SETUP.md](SETUP.md)
- Connection errors → [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- Data persistence → [volumes/README.md](volumes/README.md)

---

## 🎓 Learn More

### Understanding the System
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md) - Visual diagrams
- **Best Practices**: [BEST_PRACTICES.md](BEST_PRACTICES.md) - Why decisions were made
- **Complete Overview**: [SUMMARY.md](SUMMARY.md) - Everything explained

### Deep Dives
- **PostgreSQL**: [docker/postgres/README.md](docker/postgres/README.md)
- **Redis**: [docker/redis/README.md](docker/redis/README.md)
- **MinIO**: [docker/minio/README.md](docker/minio/README.md)
- **Volumes**: [volumes/README.md](volumes/README.md)

---

## ✅ Quick Checklist

Before moving to backend development:

- [ ] Docker and Docker Compose installed
- [ ] `.env` file created and passwords changed
- [ ] Services started (`docker compose up -d`)
- [ ] Verification passed (`verify-infrastructure.sh`)
- [ ] Can connect to PostgreSQL
- [ ] Can connect to Redis
- [ ] Can access MinIO console
- [ ] Bookmarked [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## 🚀 Next Steps

### For Backend Developers
Start building your API! The infrastructure is ready:
- Database: `postgresql://optiforge_user:password@postgres:5432/optiforge_db`
- Cache: `redis://redis:6379/0`
- Storage: `http://minio:9000`

### For DevOps Engineers
Review the configuration:
- **[docker-compose.yml](docker-compose.yml)** - Every line explained
- **[BEST_PRACTICES.md](BEST_PRACTICES.md)** - Production guidance
- **[TESTING.md](TESTING.md)** - Comprehensive tests

### For Everyone
Keep **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** handy for daily commands!

---

## 📊 What You Get

### Files Created: 22
- 4 configuration files
- 9 documentation files
- 2 verification scripts
- 3 service configurations
- 4 service-specific docs

### Documentation: 6,000+ lines
- Complete setup instructions
- Best practices guide
- Testing procedures
- Troubleshooting guides
- Architecture diagrams

### Features
- ✅ Production-ready
- ✅ Fully documented
- ✅ Automated testing
- ✅ Security best practices
- ✅ Easy to maintain

---

## 🎉 You're All Set!

The infrastructure is **complete**, **tested**, and **ready for development**.

Start with the 5-minute quick start at the top of this file, then explore the documentation as needed.

**Happy coding! 🚀**

---

**Questions?** Check [INDEX.md](INDEX.md) to find the right documentation.

**Issues?** See [SETUP.md](SETUP.md) troubleshooting section.

**Everything working?** Time to build some awesome features! 🎨

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import uuid

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:123@localhost:5432/optiforge_db')
    async with engine.begin() as conn:
        await conn.execute(text("""
            INSERT INTO users (id, email, username, full_name, hashed_password, is_active, is_superuser) 
            VALUES ('123e4567-e89b-12d3-a456-426614174000', 'dummy@example.com', 'dummy', 'Dummy User', 'hash', true, false)
            ON CONFLICT (id) DO NOTHING;
        """))
    await engine.dispose()
    print('Dummy user seeded!')

asyncio.run(main())

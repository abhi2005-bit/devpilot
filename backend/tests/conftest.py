import pytest
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base, get_db
from app.main import app
from app.models import Issue, IssueComment, Label, Project, User


class TestSettings(BaseSettings):
    database_url: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = TestSettings()

configured_url = make_url(settings.database_url)
local_hosts = {None, "localhost", "127.0.0.1", "::1"}
if configured_url.database not in {"devpilot", "devpilot_test"}:
    raise RuntimeError(
        "Tests require a local development URL named devpilot or devpilot_test; "
        "refusing to derive a test target from another database."
    )
if configured_url.host not in local_hosts:
    raise RuntimeError("Tests require a local PostgreSQL host; refusing remote database access.")

TEST_DATABASE_URL = configured_url.set(database="devpilot_test")

engine = create_engine(
    TEST_DATABASE_URL,
    echo=True,
)

TestingSessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def assert_test_database_target():
    if engine.url.database != "devpilot_test" or engine.url.host not in local_hosts:
        raise RuntimeError("Refusing destructive test setup: expected local devpilot_test.")
    with engine.connect() as connection:
        actual_database = connection.execute(text("SELECT current_database()")).scalar_one()
    if actual_database != "devpilot_test":
        raise RuntimeError(
            f"Refusing destructive test setup: PostgreSQL connected to {actual_database!r}."
        )


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    assert_test_database_target()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    assert_test_database_target()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        try:
            session.rollback()
            assert_test_database_target()
            for table in reversed(Base.metadata.sorted_tables):
                session.execute(table.delete())
            session.commit()
        finally:
            session.close()


@pytest.fixture(autouse=True)
def override_database(db: Session):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    yield

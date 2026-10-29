CREATE TABLE "Greeting" (
    "locale" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    CONSTRAINT "Greeting_pkey" PRIMARY KEY ("locale")
);

INSERT INTO "Greeting" ("locale", "message") VALUES
    ('en', 'Hello world from PostgreSQL!'),
    ('sv', 'Hej världen från PostgreSQL!');

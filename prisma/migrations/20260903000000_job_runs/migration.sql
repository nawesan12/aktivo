-- Throttle for background jobs. See `model JobRun` for why there is no
-- `running` flag: the claim is the bump of "lastRunAt".
CREATE TABLE "JobRun" (
    "name" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3) NOT NULL,
    "lastEndAt" TIMESTAMP(3),
    "lastError" TEXT,
    "runs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("name")
);

-- Seeded here so the claim never has to deal with a missing row. The epoch
-- makes every job due on the first tick after a deploy.
INSERT INTO "JobRun" ("name", "lastRunAt")
VALUES
    ('tick', '1970-01-01T00:00:00.000Z'),
    ('expire-holds', '1970-01-01T00:00:00.000Z'),
    ('reminders', '1970-01-01T00:00:00.000Z'),
    ('retry-notifications', '1970-01-01T00:00:00.000Z'),
    ('no-shows', '1970-01-01T00:00:00.000Z'),
    ('review-requests', '1970-01-01T00:00:00.000Z'),
    ('campaigns', '1970-01-01T00:00:00.000Z')
ON CONFLICT ("name") DO NOTHING;

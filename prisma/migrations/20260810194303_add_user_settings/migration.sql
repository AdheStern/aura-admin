-- CreateTable
CREATE TABLE "user_settings" (
    "userId" TEXT NOT NULL,
    "llmProvider" TEXT,
    "llmApiKeyCipher" TEXT,
    "units" TEXT NOT NULL DEFAULT 'metric',
    "defaultMode" TEXT NOT NULL DEFAULT 'simple',

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clubes"
ADD COLUMN "nome_normalizado" VARCHAR(60);

UPDATE "clubes"
SET "nome_normalizado" = LOWER(TRIM(REGEXP_REPLACE("nome", '\s+', ' ', 'g')));

ALTER TABLE "clubes"
ALTER COLUMN "nome_normalizado" SET NOT NULL;

CREATE UNIQUE INDEX "clubes_nome_normalizado_key"
ON "clubes"("nome_normalizado");

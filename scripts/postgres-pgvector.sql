-- ━━━ Migration PostgreSQL + pgvector ━━━
--
-- Ce script active l'extension pgvector et ajoute une colonne vectorielle
-- à la table DocumentChunk pour la recherche sémantique ultra-rapide.
--
-- À exécuter après migration Prisma :
--   psql $DATABASE_URL -f scripts/postgres-pgvector.sql

-- 1. Active l'extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Ajoute une colonne vectorielle (1536 dims = OpenAI text-embedding-3-small)
ALTER TABLE "DocumentChunk" ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- 3. Crée un index IVFFlat pour similarité cosinus rapide
-- (à créer après avoir inséré quelques données pour optimiser les listes)
CREATE INDEX IF NOT EXISTS documentchunk_embedding_vector_idx
  ON "DocumentChunk"
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);

-- 4. Fonction pour mettre à jour embedding_vector depuis embedding (JSON)
CREATE OR REPLACE FUNCTION update_embedding_vector()
RETURNS void AS $$
DECLARE
  chunk_record RECORD;
  vec float8[];
BEGIN
  FOR chunk_record IN SELECT id, embedding FROM "DocumentChunk" WHERE embedding IS NOT NULL LOOP
    BEGIN
      vec := ARRAY(SELECT jsonb_array_elements_text(chunk_record.embedding::jsonb)::float8);
      UPDATE "DocumentChunk" SET embedding_vector = vec::vector WHERE id = chunk_record.id;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore les erreurs de parsing
      NULL;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Exécute la migration
SELECT update_embedding_vector();

-- 6. Statistiques
SELECT
  COUNT(*) AS total_chunks,
  COUNT(embedding_vector) AS with_vector,
  COUNT(*) - COUNT(embedding_vector) AS without_vector
FROM "DocumentChunk";

-- ━━━ Note : pour la recherche sémantique en production ━━━
--
-- Remplacer la fonction searchByEmbeddings() par :
--
-- SELECT id, title, content, source,
--   1 - (embedding_vector <=> $1::vector) AS similarity
-- FROM "DocumentChunk"
-- WHERE "companyId" = $2
--   AND embedding_vector IS NOT NULL
-- ORDER BY embedding_vector <=> $1::vector
-- LIMIT 10;
--
-- L'opérateur <=> calcule la distance cosinus nativement en C,
-- 1000x plus rapide que le calcul en JavaScript.

-- Campañas, Analytics y el widget embebible salieron del producto. Esto borra
-- lo que quedó de ellos en la base: nada del código los lee desde entonces.
--
-- Es destructivo y no tiene vuelta atrás: se van las filas, no sólo las tablas.
-- Se aplica a mano contra cada base (`prisma migrate deploy`), y conviene mirar
-- antes cuántas filas hay para no enterarse después:
--
--   SELECT
--     (SELECT count(*) FROM "Campaign")          AS campanias,
--     (SELECT count(*) FROM "CampaignExecution") AS ejecuciones,
--     (SELECT count(*) FROM "AnalyticsSnapshot") AS snapshots;
--
-- Los snapshots son los que pueden doler: son métricas diarias históricas, y no
-- se recalculan hacia atrás si las tablas de origen ya rotaron.

-- CampaignExecution primero, que referencia a Campaign.
DROP TABLE IF EXISTS "CampaignExecution";
DROP TABLE IF EXISTS "Campaign";
DROP TABLE IF EXISTS "AnalyticsSnapshot";

DROP TYPE IF EXISTS "CampaignStatus";
DROP TYPE IF EXISTS "CampaignType";

-- El widget embebible se configuraba desde estas tres columnas. Ninguna
-- pantalla las edita desde que se dio de baja la sección.
ALTER TABLE "BusinessSettings" DROP COLUMN IF EXISTS "widgetEnabled";
ALTER TABLE "BusinessSettings" DROP COLUMN IF EXISTS "widgetTheme";
ALTER TABLE "BusinessSettings" DROP COLUMN IF EXISTS "widgetPosition";

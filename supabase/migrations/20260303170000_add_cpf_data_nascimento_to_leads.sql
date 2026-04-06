-- Adiciona campos de CPF e data de nascimento na BASE_DE_LEADS
ALTER TABLE "BASE_DE_LEADS"
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Indice para consulta por empresa + CPF
CREATE INDEX IF NOT EXISTS idx_base_de_leads_empresa_cpf
ON "BASE_DE_LEADS" (id_empresa, cpf);

COMMENT ON COLUMN "BASE_DE_LEADS".cpf IS 'CPF do lead no formato 000.000.000-00';
COMMENT ON COLUMN "BASE_DE_LEADS".data_nascimento IS 'Data de nascimento do lead';

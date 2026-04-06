ALTER TABLE "BASE_DE_LEADS"
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS bot_ativo BOOLEAN DEFAULT FALSE;

ALTER TABLE "VENDEDORES"
ADD COLUMN IF NOT EXISTS atender VARCHAR(20) DEFAULT 'espera',
ADD COLUMN IF NOT EXISTS quantos_lead INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_base_de_leads_empresa_cpf
ON "BASE_DE_LEADS" (id_empresa, cpf);

COMMENT ON COLUMN "BASE_DE_LEADS".cpf IS 'CPF do lead no formato 000.000.000-00';
COMMENT ON COLUMN "BASE_DE_LEADS".data_nascimento IS 'Data de nascimento do lead';
COMMENT ON COLUMN "BASE_DE_LEADS".bot_ativo IS 'Define se o atendimento automatizado esta ativo para o lead';
COMMENT ON COLUMN "VENDEDORES".atender IS 'Estado de atendimento do vendedor';
COMMENT ON COLUMN "VENDEDORES".quantos_lead IS 'Quantidade de leads atribuidos ao vendedor';

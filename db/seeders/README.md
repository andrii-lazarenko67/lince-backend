# Portuguese Seeders Directory (Diretório de Seeders em Português)

This directory contains Portuguese versions of all seeder files.
Este diretório contém versões em português de todos os arquivos de seeders.

## How to Use Portuguese Seeders / Como Usar Seeders em Português

Portuguese is the default language. To explicitly set Portuguese:
Português é o idioma padrão. Para definir explicitamente português:

### Set to Portuguese / Definir como Português:
```env
SEEDER_LANGUAGE=pt
```

### Switch to English / Mudar para Inglês:
```env
SEEDER_LANGUAGE=en
```

## Running Seeders / Executando Seeders

After setting the language, run the standard Sequelize seeder commands:
Após definir o idioma, execute os comandos padrão do Sequelize:

```bash
# Run all seeders / Executar todos os seeders
npx sequelize-cli db:seed:all

# Undo all seeders / Desfazer todos os seeders
npx sequelize-cli db:seed:undo:all

# Run specific seeder / Executar seeder específico
npx sequelize-cli db:seed --seed 20240101000001-demo-users.js
```

## Files in this Directory / Arquivos neste Diretório

1. **20240101000001-demo-users.js** - Usuários demo com nomes em português
2. **20240101000002-seed-parameters.js** - Parâmetros de qualidade da água em português
3. **20240101000003-seed-units.js** - Unidades de medida em português
4. **20240101000004-demo-systems.js** - Sistemas, pontos de monitoramento e itens de checklist em português
5. **20240101000005-demo-products.js** - 24 produtos com nomes, descrições e dosagens em português
6. **20240101000006-demo-dailylogs.js** - Registros diários com notas em português
7. **20240101000007-demo-inspections.js** - Inspeções com conclusões em português
8. **20240101000008-demo-incidents.js** - Incidentes com descrições e comentários em português
9. **20240101000009-demo-notifications.js** - Notificações com mensagens em português

## Note / Nota

The seeder language selection is configured in [.sequelizerc](../../.sequelizerc) which reads the `SEEDER_LANGUAGE` environment variable.

A seleção do idioma dos seeders é configurada em [.sequelizerc](../../.sequelizerc) que lê a variável de ambiente `SEEDER_LANGUAGE`.

## English Version / Versão em Inglês

English seeders are available in the [seeders1](../seeders1) directory.
Seeders em inglês estão disponíveis no diretório [seeders1](../seeders1).

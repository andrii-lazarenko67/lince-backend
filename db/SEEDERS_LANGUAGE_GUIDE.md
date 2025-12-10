# Seeders Language Configuration Guide

The Lince system supports both Portuguese and English demo data seeders.

## Quick Start

To switch between languages, edit the [.env](../.env) file:

### For Portuguese (Default):
```env
SEEDER_LANGUAGE=pt
```

### For English:
```env
SEEDER_LANGUAGE=en
```

## Directory Structure

```
db/
├── seeders/          # Portuguese seeders (default)
│   ├── 20240101000001-demo-users.js
│   ├── 20240101000002-seed-parameters.js
│   ├── 20240101000003-seed-units.js
│   ├── 20240101000004-demo-systems.js
│   ├── 20240101000005-demo-products.js
│   ├── 20240101000006-demo-dailylogs.js
│   ├── 20240101000007-demo-inspections.js
│   ├── 20240101000008-demo-incidents.js
│   └── 20240101000009-demo-notifications.js
│
└── seeders1/         # English seeders
    ├── 20240101000001-demo-users.js
    ├── 20240101000002-seed-parameters.js
    ├── 20240101000003-seed-units.js
    ├── 20240101000004-demo-systems.js
    ├── 20240101000005-demo-products.js
    ├── 20240101000006-demo-dailylogs.js
    ├── 20240101000007-demo-inspections.js
    ├── 20240101000008-demo-incidents.js
    └── 20240101000009-demo-notifications.js
```

## How It Works

The [.sequelizerc](../.sequelizerc) file reads the `SEEDER_LANGUAGE` environment variable and dynamically sets the seeders directory:

- `SEEDER_LANGUAGE=pt` (or not set) → uses `db/seeders`
- `SEEDER_LANGUAGE=en` → uses `db/seeders1`

## Running Seeders

After setting the language in `.env`, use standard Sequelize CLI commands:

### Run all seeders:
```bash
npx sequelize-cli db:seed:all
```

### Undo all seeders:
```bash
npx sequelize-cli db:seed:undo:all
```

### Run a specific seeder:
```bash
npx sequelize-cli db:seed --seed 20240101000001-demo-users.js
```

## What Gets Translated

### Portuguese Seeders (db/seeders):
- User names: Carlos Silva, Ana Santos, Pedro Oliveira, Maria Costa, João Ferreira
- System names: Piscina Principal, Torre de Resfriamento, Caldeira a Vapor, ETA, ETE
- Product names: Hipoclorito de Sódio, Cloro Granulado, Ácido Clorídrico, Barrilha Leve, etc.
- Parameters: pH, Cloro, Temperatura, Turbidez, Alcalinidade, etc.
- Units: Graus Celsius, Miligramas por litro, etc.
- All descriptions, notes, comments, and messages in Portuguese

### English Seeders (db/seeders1):
- User names: Charles Smith, Anna Johnson, Peter Williams, Mary Brown, John Davis
- System names: Main Pool, Cooling Tower, Steam Boiler, WTP, WWTP
- Product names: Sodium Hypochlorite, Granular Chlorine, Hydrochloric Acid, Soda Ash, etc.
- Parameters: pH, Chlorine, Temperature, Turbidity, Alkalinity, etc.
- Units: Degrees Celsius, Milligrams per liter, etc.
- All descriptions, notes, comments, and messages in English

## Important Notes

1. **Migrations are language-agnostic** - They only define database structure, not content
2. **Switch before seeding** - Change the language setting BEFORE running seeders
3. **Clean database first** - If switching languages after seeding, undo existing seeds first:
   ```bash
   npx sequelize-cli db:seed:undo:all
   ```
4. **Default is Portuguese** - If `SEEDER_LANGUAGE` is not set, Portuguese will be used

## Example Workflow

### Initial Setup (Portuguese):
```bash
# 1. Ensure .env has Portuguese setting (or leave unset)
SEEDER_LANGUAGE=pt

# 2. Run migrations
npx sequelize-cli db:migrate

# 3. Run seeders
npx sequelize-cli db:seed:all
```

### Switch to English:
```bash
# 1. Undo existing Portuguese seeds
npx sequelize-cli db:seed:undo:all

# 2. Update .env
SEEDER_LANGUAGE=en

# 3. Run English seeders
npx sequelize-cli db:seed:all
```

### Switch back to Portuguese:
```bash
# 1. Undo existing English seeds
npx sequelize-cli db:seed:undo:all

# 2. Update .env
SEEDER_LANGUAGE=pt

# 3. Run Portuguese seeders
npx sequelize-cli db:seed:all
```

## Troubleshooting

### Seeders not switching languages?
1. Check that `.env` file is updated with correct `SEEDER_LANGUAGE` value
2. Restart your terminal/command prompt to reload environment variables
3. Verify `.sequelizerc` file has the language-switching logic

### Getting wrong language data?
1. Undo all existing seeds: `npx sequelize-cli db:seed:undo:all`
2. Update `.env` file
3. Re-run seeds with correct language: `npx sequelize-cli db:seed:all`

## Technical Details

The language switching is implemented in [.sequelizerc](../.sequelizerc):

```javascript
const seederLanguage = process.env.SEEDER_LANGUAGE || 'pt';
const seedersDir = seederLanguage === 'en' ? 'seeders1' : 'seeders';

module.exports = {
  'seeders-path': path.resolve('db', seedersDir),
  // ... other configurations
};
```

This ensures that Sequelize CLI automatically uses the correct directory based on the environment variable.

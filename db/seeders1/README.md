# English Seeders Directory

This directory contains English versions of all seeder files.

## How to Use English Seeders

To switch from Portuguese to English seeders, simply change the `SEEDER_LANGUAGE` environment variable in the `.env` file:

### Switch to English:
```env
SEEDER_LANGUAGE=en
```

### Switch to Portuguese (default):
```env
SEEDER_LANGUAGE=pt
```

## Running Seeders

After setting the language, run the standard Sequelize seeder commands:

```bash
# Run all seeders
npx sequelize-cli db:seed:all

# Undo all seeders
npx sequelize-cli db:seed:undo:all

# Run specific seeder
npx sequelize-cli db:seed --seed 20240101000001-demo-users.js
```

## Files in this Directory

All files are English translations of the Portuguese seeders in the `db/seeders` directory:

1. **20240101000001-demo-users.js** - Demo users with English names
2. **20240101000002-seed-parameters.js** - Water quality parameters in English
3. **20240101000003-seed-units.js** - Measurement units in English
4. **20240101000004-demo-systems.js** - Systems, monitoring points, and checklist items in English
5. **20240101000005-demo-products.js** - All 24 products with English names, descriptions, and dosage instructions
6. **20240101000006-demo-dailylogs.js** - Daily logs with English notes
7. **20240101000007-demo-inspections.js** - Inspections with English conclusions
8. **20240101000008-demo-incidents.js** - Incidents with English descriptions and comments
9. **20240101000009-demo-notifications.js** - Notifications with English messages

## Note

The seeder language selection is configured in [.sequelizerc](../../.sequelizerc) which reads the `SEEDER_LANGUAGE` environment variable.

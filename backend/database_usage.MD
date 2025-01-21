**initialize Sequelize**
run:
    "npx sequelize-cli init --config src/database/config/config.json --migrations-path src/database/migrations --models-path src/database/models --seeders-path src/database/seeders"


src/database/:
    config.json/:
        - Sequelize uses this to connect to db!

    migrations/:
        - store files that define database schema changes
            (e.g., adding tables, altering columns)
        - apply migrations with:
            "npx sequelize-cli db:migrate"
    
    models/:
        - table representation in code.. basically
        - contains Sequelize models, each modesl is a TypeScript class that represent a table.
            defines (columns, data types, associations)
    
    seeders/: 
        - contains files for seeding(populating) database with initial data
        - create seed files:
            "npx sequelize-cli seed:generate --name demo-user
        - apply seeds: 
            "npx sequelize-cli db:seed:all"
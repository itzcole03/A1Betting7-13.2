exports.up = function (knex) {
  return knex.schema
    .createTable('users', function (table) {
      table.increments('id').primary();
      table.string('username').unique().notNullable();
      table.string('password_hash').notNullable();
      table.string('email').unique();
      table.string('api_key_encrypted');
      table.timestamps(true, true);
    })
    .createTable('settings', function (table) {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users');
      table.string('key').notNullable();
      table.string('value');
      table.timestamps(true, true);
    })
    .createTable('predictions', function (table) {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users');
      table.string('sport');
      table.string('event');
      table.string('market');
      table.string('selection');
      table.float('odds');
      table.float('probability');
      table.float('expected_value');
      table.timestamps(true, true);
    })
    .createTable('betting_history', function (table) {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users');
      table.string('bet_type');
      table.string('sport');
      table.string('event');
      table.string('market');
      table.string('selection');
      table.float('stake');
      table.float('odds');
      table.float('result');
      table.float('pnl');
      table.timestamps(true, true);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('betting_history')
    .dropTableIfExists('predictions')
    .dropTableIfExists('settings')
    .dropTableIfExists('users');
};

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('settings')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('settings').insert([
        { user_id: 1, key: 'theme', value: 'dark' },
        { user_id: 1, key: 'notification', value: 'enabled' },
        { user_id: 2, key: 'theme', value: 'light' },
        { user_id: 2, key: 'notification', value: 'disabled' },
      ]);
    });
};

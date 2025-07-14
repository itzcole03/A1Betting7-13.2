exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('users')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {
          username: 'admin',
          password_hash: '',
          email: 'admin@a1betting.com',
          api_key_encrypted: '',
        },
        {
          username: 'testuser',
          password_hash: '',
          email: 'test@a1betting.com',
          api_key_encrypted: '',
        },
      ]);
    });
};

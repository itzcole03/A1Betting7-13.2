exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('predictions')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('predictions').insert([
        {
          user_id: 1,
          sport: 'NBA',
          event: 'Lakers vs Celtics',
          market: 'Moneyline',
          selection: 'Lakers',
          odds: 2.1,
          probability: 0.48,
          expected_value: 0.01,
        },
        {
          user_id: 2,
          sport: 'NFL',
          event: 'Patriots vs Chiefs',
          market: 'Spread',
          selection: 'Chiefs -3.5',
          odds: 1.9,
          probability: 0.52,
          expected_value: 0.03,
        },
      ]);
    });
};

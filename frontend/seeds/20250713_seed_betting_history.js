exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('betting_history')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('betting_history').insert([
        {
          user_id: 1,
          bet_type: 'Single',
          sport: 'NBA',
          event: 'Lakers vs Celtics',
          market: 'Moneyline',
          selection: 'Lakers',
          stake: 100,
          odds: 2.1,
          result: 1,
          pnl: 110,
        },
        {
          user_id: 2,
          bet_type: 'Parlay',
          sport: 'NFL',
          event: 'Patriots vs Chiefs',
          market: 'Spread',
          selection: 'Chiefs -3.5',
          stake: 50,
          odds: 1.9,
          result: 0,
          pnl: -50,
        },
      ]);
    });
};

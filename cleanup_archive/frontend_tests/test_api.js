// Test API connection from browser context
// console.log('Testing API connection...');

// Test 1: Props endpoint
fetch('${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/prizepicks/props')
  .catch(error => console.error('API Error:', error))
  .then(res => res.json())
  .then(data => {
    //     console.log('✅ Props API Response:', data.length, 'props');
    if (data.length > 0) {
      //       console.log('Sample prop:', data[0].player, '-', data[0].prop_type);
    }
  })
  .catch(err => console.error('❌ Props API Error:', err));

// Test 2: Comprehensive endpoint
fetch(
  '${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/prizepicks/comprehensive-projections'
)
  .catch(error => console.error('API Error:', error))
  .then(res => res.json())
  .then(data => {
    //     console.log('✅ Comprehensive API Response:', data);
  })
  .catch(err => console.error('❌ Comprehensive API Error:', err));

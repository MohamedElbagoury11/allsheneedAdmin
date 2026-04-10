const axios = require('axios');

async function sync() {
  try {
    console.log('Logging in...');
    let loginRes;
    try {
      loginRes = await axios.post('http://localhost:3000/auth/login', {
        email: 'admin@store.com',
        password: 'password123'
      });
    } catch (e) {
      loginRes = await axios.post('http://localhost:3000/admin/login', {
        email: 'admin@store.com',
        password: 'password123'
      });
    }
    
    let token = loginRes.data.access_token || loginRes.data.token || loginRes.data.accessToken;
    if (!token && loginRes.data.user?.token) token = loginRes.data.user.token;
    
    if (!token) throw new Error('No token found in response');
    console.log('Login successful.');
    
    console.log('Starting sync...');
    const syncRes = await axios.post('http://localhost:3000/admin/sync-categories', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('--- SYNC SUCCESS ---');
    console.log(JSON.stringify(syncRes.data, null, 2));
    console.log('--------------------');
  } catch (error) {
    if (error.response) {
      console.error('ERROR (Status ' + error.response.status + '):', error.response.data);
    } else {
      console.error('SERVER COMMUNICATION FAILED:', error.message);
    }
  }
}

sync();

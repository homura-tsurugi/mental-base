// Manual test to check auth
const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(7);
const email = 'test-manual-' + uniqueId + '@mentalbase.local';

async function testAuth() {
  console.log('Testing registration with email:', email);
  const registerResponse = await fetch('http://localhost:3247/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email,
      password: 'TestPassword123!',
    }),
  });

  console.log('Register status:', registerResponse.status);
  const registerData = await registerResponse.json();
  console.log('Register data:', JSON.stringify(registerData, null, 2));

  if (registerData.user) {
    console.log('\nTesting login...');
    const loginResponse = await fetch('http://localhost:3247/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'TestPassword123!',
      }),
    });

    console.log('Login status:', loginResponse.status);
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login cookies:', cookies);
    const loginText = await loginResponse.text();
    console.log('Login response:', loginText);
  }
}

testAuth().catch(console.error);

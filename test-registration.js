const fetch = require('node-fetch');

async function testRegistration() {
    try {
        console.log('Testing registration endpoint...\n');

        const response = await fetch('http://localhost:8000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'password123',
                role: 'student',
                phone: '1234567890',
                gender: 'male',
                age: 20
            }),
        });

        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✓ Registration successful!');
            console.log('User should be saved to database.');
        } else {
            console.log('\n❌ Registration failed!');
            console.log('Error:', data.message);
        }

    } catch (error) {
        console.error('❌ Error testing registration:', error.message);
        console.log('\nPossible issues:');
        console.log('1. Backend server not running on port 8000');
        console.log('2. MongoDB connection failed');
        console.log('3. Network error');
    }
}

testRegistration();

const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function checkDatabase() {
    try {
        // Connect to MongoDB
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/e_learning';
        await mongoose.connect(uri);

        console.log('✓ Connected to MongoDB');
        console.log('Database:', mongoose.connection.db.databaseName);
        console.log('');

        // Get all users
        const users = await User.find();
        console.log('Total users in database:', users.length);
        console.log('');

        if (users.length === 0) {
            console.log('⚠️  No users found in database!');
            console.log('This means registration is not saving to the database.');
        } else {
            console.log('Users found:');
            users.forEach((user, index) => {
                console.log(`${index + 1}. Email: ${user.email}`);
                console.log(`   Name: ${user.name}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Status: ${user.status}`);
                console.log(`   Join Date: ${user.joinDate}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkDatabase();

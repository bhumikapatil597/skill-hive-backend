const mongoose = require('mongoose');
const Resource = require('./src/models/Resource');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Fetching all resources from database...\n');

    const resources = await Resource.find({});
    console.log(`Total resources in database: ${resources.length}\n`);

    resources.forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   Subject: ${r.subject || 'N/A'}`);
        console.log(`   Has educational content: ${!!(r.explanation || r.examples?.length || r.bulletPoints?.length || r.questions?.length)}`);
        console.log('');
    });

    await mongoose.connection.close();
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

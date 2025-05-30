import mongoose from 'mongoose';

// MongoDB Connection
const mongoURI = "mongodb+srv://dhananjaykhaire2004:Dk2004@smart-atttend.d2zoi3b.mongodb.net/?retryWrites=true&w=majority&appName=smart-atttend";

const testDb = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(coll => console.log(`- ${coll.name}`));

    // Check users collection
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\nUsers in database:', users.length);
    users.forEach(user => {
      console.log(`\nUser details:
- ID: ${user._id}
- Name: ${user.name}
- Email: ${user.email}
- Role: ${user.role}
- Active: ${user.isActive}
- Has Password: ${!!user.password}
- Password Length: ${user.password ? user.password.length : 0}
`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testDb(); 
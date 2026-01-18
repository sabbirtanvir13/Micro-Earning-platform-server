import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const createAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@microearn.com' });

        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('\n=== ADMIN CREDENTIALS ===');
            console.log('Email: admin@microearn.com');
            console.log('Password: Use Firebase Authentication');
            console.log('Role: admin');
            console.log('========================\n');
            process.exit(0);
        }

        // Create admin user
        const adminUser = new User({
            email: 'admin@microearn.com',
            displayName: 'Admin User',
            role: 'admin',
            coins: 10000,
            initialCoinsReceived: true,
            isActive: true,
        });

        await adminUser.save();

        console.log('\n✅ Admin user created successfully!');
        console.log('\n=== ADMIN CREDENTIALS ===');
        console.log('Email: admin@microearn.com');
        console.log('Password: You need to register this email in Firebase');
        console.log('Role: admin');
        console.log('Coins: 10000');
        console.log('========================\n');
        console.log('📝 Next steps:');
        console.log('1. Go to your app and register with email: admin@microearn.com');
        console.log('2. Use any password (Firebase will handle authentication)');
        console.log('3. The system will automatically assign admin role');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminUser();

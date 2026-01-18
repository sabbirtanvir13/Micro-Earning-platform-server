import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './src/models/Task.js';
import User from './src/models/User.js';

dotenv.config();

const seedTasks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find a buyer explicitly; if none, default to finding any user to act as buyer for seeding
        let buyer = await User.findOne({ role: 'buyer' });

        // If no buyer exists, try to find ANY user and temporarily use them, or create a dummy one
        if (!buyer) {
            const anyUser = await User.findOne({});
            if (anyUser) {
                console.log(`No explicit buyer found. Using user ${anyUser.email} as the task creator.`);
                buyer = anyUser;
            } else {
                console.log('No users found in database. Please register a user first.');
                process.exit(1);
            }
        }

        const tasks = [
            {
                buyerId: buyer._id,
                title: 'Watch YouTube Video and Like',
                description: 'Watch the full video and hit the like button. Screenshot required as proof.',
                coinsPerWorker: 5,
                requiredWorkers: 100,
                currentWorkers: 12,
                category: 'social_media',
                submissionInstructions: 'Upload a screenshot showing you liked the video.',
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                image: 'https://i.ibb.co/C91cDYq/youtube-logo.png'
            },
            {
                buyerId: buyer._id,
                title: 'Install Game App - Level 5',
                description: 'Download our new game from the Play Store and reach Level 5. It takes about 10 minutes.',
                coinsPerWorker: 25,
                requiredWorkers: 50,
                currentWorkers: 5,
                category: 'app_install',
                submissionInstructions: 'Submit a screenshot of your profile page showing Level 5.',
                deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                image: 'https://i.ibb.co/hK7jV0k/game-icon.png'
            },
            {
                buyerId: buyer._id,
                title: 'Complete 5-Minute Survey',
                description: 'Answer simple questions about your shopping habits. We need your honest opinion.',
                coinsPerWorker: 15,
                requiredWorkers: 200,
                currentWorkers: 145,
                category: 'survey',
                submissionInstructions: 'Submit the completion code given at the end of the survey.',
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                image: 'https://i.ibb.co/ZJ9NfbQ/survey-icon.png'
            },
            {
                buyerId: buyer._id,
                title: 'Write a Review for Tech Blog',
                description: 'Read the article and leave a positive, relevant comment of at least 20 words.',
                coinsPerWorker: 8,
                requiredWorkers: 30,
                currentWorkers: 0,
                category: 'content',
                submissionInstructions: 'Copy and paste your comment here.',
                deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                image: 'https://i.ibb.co/L5k9XjH/blog-icon.png'
            },
            {
                buyerId: buyer._id,
                title: 'Follow Instagram Page',
                description: 'Follow our official Instagram page for updates on new products.',
                coinsPerWorker: 3,
                requiredWorkers: 500,
                currentWorkers: 420,
                category: 'social_media',
                submissionInstructions: 'Provide your Instagram handle.',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                image: 'https://i.ibb.co/mJk9GjL/instagram-icon.png'
            },
            {
                buyerId: buyer._id,
                title: 'Signup for Newsletter',
                description: 'Visit our website and subscribe to the weekly newsletter.',
                coinsPerWorker: 4,
                requiredWorkers: 150,
                currentWorkers: 22,
                category: 'other',
                submissionInstructions: 'Submit the email address you used to subscribe.',
                deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                image: 'https://i.ibb.co/dGt7jKk/newsletter-icon.png'
            }
        ];

        await Task.insertMany(tasks);
        console.log('Successfully seeded 6 sample tasks!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeing tasks:', error);
        process.exit(1);
    }
};

seedTasks();

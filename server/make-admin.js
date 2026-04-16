require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const Client = require('./src/models/Client');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function makeAdmin() {
  try {
    // 1. Connect to MongoDB
    if (!process.env.MONGO_URI) {
      console.error('Error: MONGO_URI is missing from your .env file.');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // 2. Ask for details
    const email = await question('Enter new admin email (username): ');
    const password = await question('Enter new admin password: ');
    
    if (!email || !password) {
      console.error('Error: Email and password are required.');
      process.exit(1);
    }

    // 3. Check if exists
    const existingClient = await Client.findOne({ email: email.toLowerCase() });
    if (existingClient) {
      console.error(`Error: An admin with the email ${email} already exists.`);
      process.exit(1);
    }

    // 4. Hash password and save
    console.log('Hashing password and saving...');
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newAdmin = new Client({
      email: email.toLowerCase(),
      password_hash,
      first_name: 'CLI',
      last_name: 'Admin',
      company_name: 'System Admin'
    });

    await newAdmin.save();

    console.log(`\nSuccess! Admin account created for ${email}.`);
    console.log('You can now log in using this email and the password you provided.');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Cleanup
    mongoose.connection.close();
    rl.close();
    process.exit(0);
  }
}

makeAdmin();

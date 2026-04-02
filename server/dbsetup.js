const { execSync } = require('child_process');

console.log('=========================================');
console.log('   Official MongoDB Setup Script');
console.log('=========================================\n');

try {
    console.log('⏳ Step 1: Installing prerequisites (curl, gnupg)...');
    execSync('apt-get install -y gnupg curl', { stdio: 'inherit' });

    console.log('\n⏳ Step 2: Importing MongoDB Official GPG Key...');
    execSync('curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes', { stdio: 'inherit' });

    console.log('\n⏳ Step 3: Adding MongoDB Official Repository...');
    execSync('echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list', { stdio: 'inherit' });

    console.log('\n⏳ Step 4: Updating package list...');
    execSync('apt-get update', { stdio: 'inherit' });

    console.log('\n⏳ Step 5: Installing MongoDB (mongodb-org)...');
    execSync('apt-get install -y mongodb-org', { stdio: 'inherit' });

    console.log('\n⏳ Step 6: Starting and enabling MongoDB service...');
    // Note: The official package uses 'mongod' instead of 'mongodb'
    execSync('systemctl start mongod', { stdio: 'inherit' });
    execSync('systemctl enable mongod', { stdio: 'inherit' });

    console.log('\n✅ SUCCESS: MongoDB is now installed and running locally!');
    
    console.log('\n=========================================');
    console.log('              NEXT STEPS                 ');
    console.log('=========================================');
    console.log('1. Open your .env file:');
    console.log('   nano .env');
    console.log('\n2. Update your MONGO_URI to point to the local database:');
    console.log('   MONGO_URI=mongodb://127.0.0.1:27017/smtp_db');
    console.log('\n3. Restart your application:');
    console.log('   pm2 restart all');
    console.log('=========================================\n');

} catch (error) {
    console.error('\n❌ ERROR: Something went wrong during the installation.');
    console.error(error.message);
}

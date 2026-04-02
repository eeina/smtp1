const { execSync } = require('child_process');

console.log('=========================================');
console.log('   Local MongoDB Setup Script');
console.log('=========================================\n');

try {
    console.log('⏳ Step 1: Updating system package list...');
    execSync('apt-get update', { stdio: 'inherit' });

    console.log('\n⏳ Step 2: Installing MongoDB...');
    try {
        // Try the standard mongodb package first
        execSync('apt-get install -y mongodb', { stdio: 'inherit' });
    } catch (err) {
        console.log('Standard package failed, trying mongodb-server...');
        execSync('apt-get install -y mongodb-server', { stdio: 'inherit' });
    }

    console.log('\n⏳ Step 3: Starting and enabling MongoDB service...');
    // The service name is usually 'mongodb' on Ubuntu when installed from default repos
    execSync('systemctl start mongodb', { stdio: 'inherit' });
    execSync('systemctl enable mongodb', { stdio: 'inherit' });

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
    console.log('\nPlease try running the commands manually:');
    console.log('apt-get update');
    console.log('apt-get install -y mongodb');
    console.log('systemctl enable --now mongodb');
}

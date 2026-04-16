import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DOMAIN = 'mail.eeina.com';
const APP_PATH = process.cwd();
const SERVER_PORT = 4000; // Matches your server.js port

function run(command, cwd = APP_PATH) {
    console.log(`\x1b[36mRunning: ${command}\x1b[0m`);
    try {
        execSync(command, { stdio: 'inherit', cwd });
    } catch (error) {
        console.error(`\x1b[31mError executing: ${command}\x1b[0m`);
        process.exit(1);
    }
}

console.log('\x1b[35m🚀 Starting Automatic Deployment for mail.eeina.com\x1b[0m');

// 1. Build Frontend
console.log('\n--- Building Frontend ---');
run('npm install');
run('npm run build');

// 2. Setup Backend
console.log('\n--- Setting up Backend ---');
run('npm install', path.join(APP_PATH, 'server'));

// 3. Configure Nginx
console.log('\n--- Configuring Nginx ---');
const nginxConfig = `
server {
    listen 80;
    server_name ${DOMAIN};

    # Frontend Static Files
    root ${path.join(APP_PATH, 'dist')};
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:${SERVER_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
`;

// Determine Nginx config path (Universal conf.d is safer for non-Ubuntu)
const nginxConfPath = `/etc/nginx/conf.d/${DOMAIN}.conf`;

try {
    console.log(`Writing Nginx config to ${nginxConfPath}...`);
    // We use sudo because /etc/nginx is usually root-owned
    fs.writeFileSync('temp_nginx.conf', nginxConfig);
    run(`sudo mv temp_nginx.conf ${nginxConfPath}`);
    
    console.log('Testing Nginx configuration...');
    run('sudo nginx -t');
    
    console.log('Reloading Nginx...');
    run('sudo systemctl reload nginx || sudo service nginx reload');
} catch (err) {
    console.error('\x1b[31mFailed to configure Nginx. Make sure you have sudo privileges.\x1b[0m');
}

// 4. Configure PM2
console.log('\n--- Configuring PM2 ---');
try {
    // Check if process exists
    const status = execSync('pm2 jlist').toString();
    if (status.includes('smtp-server')) {
        run('pm2 restart smtp-server');
    } else {
        run(`pm2 start server.js --name smtp-server`, path.join(APP_PATH, 'server'));
    }
    run('pm2 save');
} catch (err) {
    console.log('PM2 command failed. Attempting to start fresh...');
    run(`pm2 start server.js --name smtp-server`, path.join(APP_PATH, 'server'));
}

console.log(`\n\x1b[32m✅ Deployment Complete!\x1b[0m`);
console.log(`\x1b[32mYour service should now be live at http://${DOMAIN}\x1b[0m`);
console.log(`\x1b[33mNote: Remember to run 'certbot --nginx -d ${DOMAIN}' if you need SSL.\x1b[0m`);

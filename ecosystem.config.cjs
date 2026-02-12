module.exports = {
  apps: [
    {
      name: 'uptix-hub-oss',
      script: 'src/index.js',
      cwd: './hub',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};

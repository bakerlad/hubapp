// PM2 ecosystem configuration for HGV Charging Infrastructure system

module.exports = {
  apps: [
    {
      name: 'hgv-charging-sites',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=hgv-charging-sites-production --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false, // Disable PM2 file monitoring (wrangler handles hot reload)
      instances: 1, // Development mode uses single instance
      exec_mode: 'fork'
    }
  ]
}

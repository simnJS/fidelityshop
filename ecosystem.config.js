module.exports = {
  apps: [{
    name: 'simnshop',
    script: 'npm',
    args: 'start',
    env: {
      PORT: 3744,
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}; 
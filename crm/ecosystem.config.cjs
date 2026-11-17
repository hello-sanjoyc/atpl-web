/**
 * PM2 process definitions. Run `pnpm build` first, then `pm2 start ecosystem.config.cjs --env production`.
 *
 * - api: HTTP in cluster mode. Safe to scale; rate-limit counters are shared through Redis when REDIS_URL is set.
 * - worker: exactly one instance. Outbox claims are safe across instances, but scheduled jobs are
 *   single-leader via a PostgreSQL advisory lock, so a second worker only waits as a standby.
 */
module.exports = {
  apps: [
    {
      name: 'aranax-api',
      script: 'dist/server.js',
      cwd: './backend',
      exec_mode: 'cluster',
      instances: process.env.API_INSTANCES || 2,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 2000,
      kill_timeout: 20000,
      listen_timeout: 10000,
      wait_ready: false,
      autorestart: true,
      time: true,
      out_file: 'logs/api.out.log',
      error_file: 'logs/api.err.log',
      merge_logs: true,
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
    },
    {
      name: 'aranax-worker',
      script: 'dist/worker.js',
      cwd: './backend',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 2000,
      kill_timeout: 20000,
      autorestart: true,
      time: true,
      out_file: 'logs/worker.out.log',
      error_file: 'logs/worker.err.log',
      merge_logs: true,
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
    },
  ],
};

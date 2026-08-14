module.exports = {
    apps: [
        {
            name: "AranaxTech",
            cwd: "/var/www/aranax.tech/frontend",

            script: "node_modules/next/dist/bin/next",
            args: "start -p 3000 -H 127.0.0.1",

            instances: 1,
            exec_mode: "fork",

            env: {
                NODE_ENV: "production",
            },

            error_file: "/var/www/aranax.tech/logs/frontend/app-error.log",
            out_file: "/var/www/aranax.tech/logs/frontend/app-out.log",
            log_file: "/var/www/aranax.tech/logs/frontend/app-combined.log",
            merge_logs: true,
            time: true,

            watch: false,
            autorestart: true,
            max_memory_restart: "512M",
            restart_delay: 5000,
            max_restarts: 10,
            kill_timeout: 10000,
        },

        {
            name: "AranaxTech-CMS",
            cwd: "/var/www/aranax.tech/cms",

            script: "node_modules/@strapi/strapi/bin/strapi.js",
            args: "start",

            instances: 1,
            exec_mode: "fork",

            env: {
                NODE_ENV: "production",
                HOST: "127.0.0.1",
                PORT: 1337,
            },

            error_file: "/var/www/aranax.tech/logs/cms/app-error.log",
            out_file: "/var/www/aranax.tech/logs/cms/app-out.log",
            log_file: "/var/www/aranax.tech/logs/cms/app-combined.log",
            merge_logs: true,
            time: true,

            watch: false,
            autorestart: true,
            max_memory_restart: "1024M",
            restart_delay: 5000,
            max_restarts: 10,
            kill_timeout: 10000,
        },
    ],
};

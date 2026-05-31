// Mock data for Rage UI — homelab projects with realistic secrets.
// Persisted in localStorage; the mock API layer reads/writes here.

window.__seedData = {
  user: { name: "sofiane", host: "homelab.local", repo: "git@github.com:sofiane/homelab.git" },
  projects: [
    {
      id: "plex",
      name: "Plex",
      path: "/projets/plex",
      file: "secrets.enc.yaml",
      icon: "P",
      iconColor: "linear-gradient(135deg, #FF9F0A, #FF453A)",
      lastSync: "2 hours ago",
      branch: "main",
      secrets: {
        PLEX_CLAIM_TOKEN: "claim-xQ7n2Mv9Lp3KrT8w",
        ADVERTISE_IP: "https://plex.homelab.local:32400",
        TZ: "Europe/Paris",
        PLEX_UID: "1000",
        PLEX_GID: "1000",
        TRANSCODE_PATH: "/transcode",
        DLNA_ENABLED: "false"
      }
    },
    {
      id: "home-assistant",
      name: "Home Assistant",
      path: "/projets/home-assistant",
      file: "secrets.enc.yaml",
      icon: "H",
      iconColor: "linear-gradient(135deg, #18BCF2, #0A84FF)",
      lastSync: "5 minutes ago",
      branch: "main",
      dirty: true,
      secrets: {
        HASS_API_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.token_here",
        MQTT_BROKER: "mqtt://mosquitto:1883",
        MQTT_USER: "homeassistant",
        MQTT_PASSWORD: "z9Vr!Kp2Lq8Wn4Mc",
        NABU_CASA_TOKEN: "nc_2f9a8b7c6d5e4f3a",
        ZWAVE_S2_AUTH: "0xAB12CD34EF56GH78",
        HUE_BRIDGE_IP: "192.168.1.42",
        HUE_API_KEY: "8s7TmV3qLp9NrK2WfXc4DhB6JaG1",
        OPENWEATHER_KEY: "a1b2c3d4e5f6g7h8i9j0"
      }
    },
    {
      id: "vaultwarden",
      name: "Vaultwarden",
      path: "/projets/vaultwarden",
      file: "secrets.enc.yaml",
      icon: "V",
      iconColor: "linear-gradient(135deg, #5dd5ff, #0A84FF)",
      lastSync: "yesterday",
      branch: "main",
      secrets: {
        ADMIN_TOKEN: "$argon2id$v=19$m=65540,t=3,p=4$XyZpQrStUvWxYz",
        DATABASE_URL: "postgresql://vw:secretpass@db:5432/vaultwarden",
        SMTP_HOST: "smtp.fastmail.com",
        SMTP_PORT: "587",
        SMTP_FROM: "vault@homelab.local",
        SMTP_USERNAME: "sofiane@fastmail.com",
        SMTP_PASSWORD: "fmpwd-9X3kLnVqRtY8w",
        DOMAIN: "https://vault.homelab.local",
        SIGNUPS_ALLOWED: "false",
        WEBSOCKET_ENABLED: "true"
      }
    },
    {
      id: "nextcloud",
      name: "Nextcloud",
      path: "/projets/nextcloud",
      file: "secrets.enc.yaml",
      icon: "N",
      iconColor: "linear-gradient(135deg, #0080ff, #5B5BD6)",
      lastSync: "3 days ago",
      branch: "main",
      dirty: true,
      secrets: {
        MYSQL_ROOT_PASSWORD: "rootpw-Kx9!Vn3Lp7QrT2",
        MYSQL_PASSWORD: "ncpw-8mZv2Bq5Wp1Xc4",
        NEXTCLOUD_ADMIN_PASSWORD: "admin-7Hk3Lp9NrV2Mc8",
        NEXTCLOUD_TRUSTED_DOMAINS: "cloud.homelab.local",
        REDIS_HOST_PASSWORD: "redis-3Tq8Mv5Lp2Wn9Kc",
        ONLYOFFICE_JWT_SECRET: "jwt-secret-abcdef123456",
        S3_BUCKET: "nextcloud-backup",
        S3_KEY: "AKIAIOSFODNN7EXAMPLE",
        S3_SECRET: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
      }
    },
    {
      id: "traefik",
      name: "Traefik",
      path: "/projets/traefik",
      file: "secrets.enc.yaml",
      icon: "T",
      iconColor: "linear-gradient(135deg, #FF6B6B, #BF5AF2)",
      lastSync: "1 week ago",
      branch: "main",
      secrets: {
        CF_API_EMAIL: "sofiane@example.com",
        CF_DNS_API_TOKEN: "cftoken-9X8mZq3Lp7VrK2Wn",
        DASHBOARD_PASSWORD: "$2y$10$abc123def456ghi789",
        ACME_EMAIL: "sofiane@example.com",
        LE_STAGING: "false"
      }
    },
    {
      id: "grafana",
      name: "Grafana",
      path: "/projets/grafana",
      file: "secrets.enc.yaml",
      icon: "G",
      iconColor: "linear-gradient(135deg, #F46800, #FFD60A)",
      lastSync: "2 weeks ago",
      branch: "main",
      secrets: {
        GF_SECURITY_ADMIN_PASSWORD: "gf-admin-7Vp3Lq9Mn2Wr8Kx",
        GF_DATABASE_PASSWORD: "gf-db-5Tq8Mv2Lp7Wn3Kc",
        GF_SMTP_PASSWORD: "smtp-9Hk3Lp7NrV2Mc8x",
        PROMETHEUS_URL: "http://prometheus:9090",
        LOKI_URL: "http://loki:3100",
        DISCORD_WEBHOOK: "https://discord.com/api/webhooks/123456/abcdef"
      }
    },
    {
      id: "immich",
      name: "Immich",
      path: "/projets/immich",
      file: "secrets.enc.yaml",
      icon: "I",
      iconColor: "linear-gradient(135deg, #4250AF, #BF5AF2)",
      lastSync: "4 days ago",
      branch: "main",
      secrets: {
        DB_PASSWORD: "immich-db-Vq3Lp9Mn7Wr2Kx",
        JWT_SECRET: "jwt-immich-XyZpQrStUvWxYz123",
        TYPESENSE_API_KEY: "typesense-Kx9Vn3Lp7QrT2Wm",
        UPLOAD_LOCATION: "/photos"
      }
    }
  ],
  commits: [
    { hash: "a4f2c91", msg: "Rotate Vaultwarden SMTP credentials", author: "sofiane", date: "2 hours ago" },
    { hash: "9b8d3e5", msg: "Update Plex claim token after re-auth", author: "sofiane", date: "yesterday" },
    { hash: "7c5a1f8", msg: "Add Immich JWT and typesense keys", author: "sofiane", date: "3 days ago" },
    { hash: "2e8b6d4", msg: "Initial Grafana SMTP + alerting webhooks", author: "sofiane", date: "1 week ago" },
    { hash: "1a3f9c7", msg: "Bootstrap Traefik with Cloudflare DNS-01", author: "sofiane", date: "2 weeks ago" }
  ]
};


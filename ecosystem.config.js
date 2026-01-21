module.exports = {
  apps: [{
    name: "nest-api",
    script: "./dist/main.js", // El archivo compilado
    instances: "max",         // Aprovecha todos los núcleos de tu CPU (Modo Cluster)
    exec_mode: "cluster",
    watch: false,             // En producción es mejor false. En desarrollo usa true.
    max_memory_restart: "1G", // Reinicia si hay fugas de memoria
    env: {
      NODE_ENV: "development",
      PORT: 3000
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 80
    },
    // Configuración de Logs
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "./logs/error.log",
    out_file: "./logs/access.log",
    merge_logs: true, // Une logs de todos los clusters en un solo archivo
  }]
}
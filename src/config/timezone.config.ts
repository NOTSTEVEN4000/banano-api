import * as moment from 'moment-timezone';

// Forzar TODAS las fechas de Node.js a Ecuador
// Esto afecta a new Date(), Date.now(), Mongoose timestamps, etc.
process.env.TZ = 'America/Guayaquil';

console.log('Zona horaria configurada:', moment.tz.guess()); // Debe decir America/Guayaquil
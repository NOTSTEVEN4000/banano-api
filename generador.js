const fs = require('fs');
const crypto = require('crypto');

const TOTAL_REGISTROS = 9000;
const empresaId = "empresa_001";
const adminId = "69436e17d9c296b563ef22ed";

const provincias = ["El Oro", "Guayas", "Pichincha", "Azuay", "Manabí"];
const ciudades = {
    "El Oro": ["Pasaje", "Machala", "Santa Rosa", "Huaquillas"],
    "Guayas": ["Guayaquil", "Durán", "Samborondón", "Daule"],
    "Pichincha": ["Quito", "Sangolquí", "Machachi"],
    "Azuay": ["Cuenca", "Gualaceo"],
    "Manabí": ["Manta", "Portoviejo", "Chone"]
};

const nombres = ["JUAN", "MARIA", "CARLOS", "ANA", "LUIS", "PETRA", "MIGUEL", "JOSE", "ELENA", "ROBERTO"];
const apellidos = ["PEREZ", "LOPEZ", "GARCIA", "RODRIGUEZ", "SANCHEZ", "ZAMBRANO", "CEDEÑO", "VIVAR"];

function generarCliente(i) {
    const nombreRand = nombres[Math.floor(Math.random() * nombres.length)];
    const apellidoRand = apellidos[Math.floor(Math.random() * apellidos.length)];
    const nombreCompleto = `${nombreRand} ${apellidoRand} ${i}`;
    const provincia = provincias[Math.floor(Math.random() * provincias.length)];
    const ciudad = ciudades[provincia][Math.floor(Math.random() * ciudades[provincia].length)];
    const fecha = new Date().toISOString();

    return {
        empresaId: empresaId,
        idExterno: crypto.randomUUID(),
        nombre: nombreCompleto,
        rucCi: (1000000000 + i).toString(),
        contacto: {
            nombre: nombreCompleto,
            telefono: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
            correo: `cliente${i}@ejemplo.com`
        },
        direccion: {
            provincia: provincia,
            ciudad: ciudad,
            detalle: `Sector ${i}, Calle Secundaria y Principal`
        },
        precio: {
            precioActual: parseFloat((Math.random() * 5 + 1).toFixed(2)),
            moneda: "USD",
            historialPrecios: [
                {
                    precio: 2.0,
                    desde: { "$date": fecha },
                    motivo: "Precio inicial",
                    registradoPor: adminId
                }
            ]
        },
        saldo: {
            totalPorCobrar: 0,
            totalCobrado: 0
        },
        estado: "Activo",
        activo: true,
        observaciones: null,
        creadoPor: adminId,
        creadoPorCorreo: "admin@local.com",
        actualizadoPor: adminId,
        actualizadoPorCorreo: "admin@local.com",
        fechaCreacion: { "$date": fecha },
        fechaActualizacion: { "$date": fecha },
        __v: 0
    };
}

console.log("Generando 9000 registros...");
const data = [];
for (let i = 1; i <= TOTAL_REGISTROS; i++) {
    data.push(generarCliente(i));
}

fs.writeFileSync('clientes_bulk.json', JSON.stringify(data, null, 2));
console.log("¡Archivo clientes_bulk.json creado con éxito!");
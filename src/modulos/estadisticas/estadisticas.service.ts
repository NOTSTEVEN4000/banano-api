import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViajeCargaCajas } from '../viajes/schemas/viaje-carga-cajas.schema';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(ViajeCargaCajas.name) 
    private readonly model: Model<ViajeCargaCajas>,
  ) {}

  async getDashboardStats(empresaId: string, rol: string) {
    const ahora = new Date();
    
    // Inicio de hoy (00:00:00)
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    
    // Inicio de la semana (Lunes)
    const inicioSemana = new Date();
    const dia = inicioSemana.getDay();
    const diff = inicioSemana.getDate() - dia + (dia === 0 ? -6 : 1);
    inicioSemana.setDate(diff);
    inicioSemana.setHours(0, 0, 0, 0);

    // Agregación Única: Quitamos la fecha del $match inicial 
    // para poder calcular "Viajes Totales"
    const stats = await this.model.aggregate([
      { $match: { empresaId } }, 
      {
        $group: {
          _id: null,
          // 1. Viajes Totales (Histórico de la empresa sin importar la fecha)
          viajesTotales: { $sum: 1 },

          // 2. Viajes Hoy (Filtro condicional dentro del grupo)
          viajesHoy: {
            $sum: { $cond: [{ $gte: ['$fechaCreacion', inicioHoy] }, 1, 0] }
          },

          // 3. Cajas Semanales
          cajasSemana: {
            $sum: { $cond: [{ $gte: ['$fechaCreacion', inicioSemana] }, '$cantidadCajas', 0] }
          },

          // 4. Finanzas Semanales (Solo sumamos si es de esta semana)
          totalVentasSemana: {
            $sum: { 
              $cond: [
                { $gte: ['$fechaCreacion', inicioSemana] }, 
                { $ifNull: ['$totalVenta', 0] }, 
                0
              ] 
            }
          },
          totalComprasSemana: {
            $sum: { 
              $cond: [
                { $gte: ['$fechaCreacion', inicioSemana] }, 
                { $ifNull: ['$totalCompra', 0] }, 
                0
              ] 
            }
          }
        }
      }
    ]);

    const res = stats[0] || { 
      viajesTotales: 0, viajesHoy: 0, cajasSemana: 0, 
      totalVentasSemana: 0, totalComprasSemana: 0 
    };

    // --- LÓGICA DE ROLES SEGÚN TU ENUM ---
    // ADMINISTRADOR y CONTADOR ven finanzas.
    // Solo ADMINISTRADOR ve viajes totales históricos.
    // OPERADOR y LECTOR solo ven datos operativos.

    const puedeVerFinanzas = (rol === 'ADMINISTRADOR' || rol === 'CONTADOR');
    const esAdmin = (rol === 'ADMINISTRADOR');

    return {
      viajesHoy: res.viajesHoy,
      viajesTotales: esAdmin ? res.viajesTotales : 0, 
      cajasMes: res.cajasSemana, 
      porPagar: puedeVerFinanzas ? res.totalComprasSemana : 0,
      porCobrar: puedeVerFinanzas ? res.totalVentasSemana : 0,
    };
  }

  // ... dentro de EstadisticasService

async getSaldoPorProveedor(empresaId: string, proveedorIdExterno: string) {
  const resultado = await this.model.aggregate([
    { 
      $match: { 
        empresaId, 
        proveedorIdExterno 
      } 
    },
    {
      $group: {
        _id: '$proveedorIdExterno',
        totalDebito: { $sum: '$totalCompra' },
        cajasTotales: { $sum: '$cantidadCajas' }
      }
    }
  ]);

  return resultado[0] || { totalDebito: 0, cajasTotales: 0 };
}

async getSaldoPorCliente(empresaId: string, clienteIdExterno: string) {
  const resultado = await this.model.aggregate([
    { 
      $match: { 
        empresaId, 
        clienteIdExterno 
      } 
    },
    {
      $group: {
        _id: '$clienteIdExterno',
        totalCredito: { $sum: { $ifNull: ['$totalVenta', 0] } },
        cajasTotales: { $sum: '$cantidadCajas' }
      }
    }
  ]);

  return resultado[0] || { totalCredito: 0, cajasTotales: 0 };
}
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViajeCargaCajas } from '../viajes/schemas/viaje-carga-cajas.schema';
import { Pago } from './schemas/pagos.schema';


@Injectable()
export class PagosService {
  constructor(
    @InjectModel(Pago.name) private pagoModel: Model<Pago>,
    @InjectModel('ViajeCargaCajas') private viajeModel: Model<ViajeCargaCajas>,
  ) {}

  async getSaldoPendiente(viajeCargaIdExterno: string, tipo: 'PAGO_PROVEEDOR' | 'COBRO_CLIENTE') {
    // 1. Obtener el viaje y validar que existe
    const viaje = await this.viajeModel.findOne({ idExterno: viajeCargaIdExterno });
    
    if (!viaje) {
      throw new NotFoundException(`No se encontró el viaje con ID: ${viajeCargaIdExterno}`);
    }

    // 2. Sumar todos los pagos realizados
    const pagosRealizados = await this.pagoModel.aggregate([
      { $match: { viajeCargaIdExterno, tipo } },
      { $group: { _id: null, total: { $sum: '$monto' } } }
    ]);

    const pagado = pagosRealizados[0]?.total || 0;

    // 3. Determinar el total original asegurando que no sea null
    // Usamos ?? 0 para dar un valor por defecto si el campo en la DB está vacío
    const totalOriginal = tipo === 'PAGO_PROVEEDOR' 
      ? (viaje.totalCompra ?? 0) 
      : (viaje.totalVenta ?? 0);

    return {
      totalOriginal,
      totalPagado: pagado,
      pendiente: totalOriginal - pagado
    };
  }

  // Agrega este método para registrar el pago
  async registrarPago(data: any) {
    const viaje = await this.viajeModel.findOne({ idExterno: data.viajeCargaIdExterno });
    if (!viaje) throw new NotFoundException('El viaje de carga no existe');
    
    return await this.pagoModel.create(data);
  }
}
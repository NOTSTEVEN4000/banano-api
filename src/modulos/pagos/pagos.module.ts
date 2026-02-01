import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { Pago, PagoSchema } from './schemas/pagos.schema';
import { ViajeCargaCajas, ViajeCargaCajasSchema } from '../viajes/schemas/viaje-carga-cajas.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      // Registramos la colección propia de este módulo
      { name: Pago.name, schema: PagoSchema },
      
      // Registramos la colección de viajes porque el servicio la necesita para validar montos
      { name: ViajeCargaCajas.name, schema: ViajeCargaCajasSchema },
    ]),
  ],
  controllers: [PagosController],
  providers: [PagosService],
  // Exportamos el servicio por si el módulo de estadísticas necesita calcular saldos reales
  exports: [PagosService],
})
export class PagosModule {}
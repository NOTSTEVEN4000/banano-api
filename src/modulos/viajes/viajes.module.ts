import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ViajesController } from './viajes.controller';
import { ViajesService } from './viajes.service';
import { Viaje, ViajeSchema } from './schemas/viaje.schema';
import { ViajeInsumos, ViajeInsumosSchema } from './schemas/viaje-insumos.schema';
import { ViajeCargaCajas, ViajeCargaCajasSchema } from './schemas/viaje-carga-cajas.schema';
import { ViajeCombustible, ViajeCombustibleSchema } from './schemas/viaje-combustible.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Viaje.name, schema: ViajeSchema },
      { name: ViajeInsumos.name, schema: ViajeInsumosSchema },
      { name: ViajeCargaCajas.name, schema: ViajeCargaCajasSchema },
      { name: ViajeCombustible.name, schema: ViajeCombustibleSchema },
    ]),
  ],
  controllers: [ViajesController],
  providers: [ViajesService],
})
export class ViajesModule {}

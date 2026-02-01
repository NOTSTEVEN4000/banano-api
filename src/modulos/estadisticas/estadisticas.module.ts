import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticasService } from './estadisticas.service';
import { ViajeCargaCajas, ViajeCargaCajasSchema } from '../viajes/schemas/viaje-carga-cajas.schema';
import { EstadisticasController } from './estadisticas.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ViajeCargaCajas.name, schema: ViajeCargaCajasSchema }
    ]),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}
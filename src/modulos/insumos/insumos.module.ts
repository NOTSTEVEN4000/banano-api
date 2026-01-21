// insumos.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Insumo, InsumoSchema } from './schema/insumo.schema';
import { MovimientoInsumo, MovimientoInsumoSchema } from './schema/movimiento-insumo.schema';
import { InsumosController } from './insumos.controller';
import { InsumosService } from './insumos.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Insumo.name, schema: InsumoSchema },
      { name: MovimientoInsumo.name, schema: MovimientoInsumoSchema },
    ]),
  ],
  controllers: [InsumosController],
  providers: [InsumosService],
  exports: [InsumosService], // Para usarlo desde ViajesModule
})
export class InsumosModule {}
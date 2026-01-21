import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehiculosController } from './vehiculos.controller';
import { VehiculosService } from './vehiculos.service';
import { Vehiculo, VehiculoSchema } from './schemas/vehiculo.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vehiculo.name, schema: VehiculoSchema }]),
  ],
  controllers: [VehiculosController],
  providers: [VehiculosService],
  exports: [VehiculosService],
})
export class VehiculosModule {}

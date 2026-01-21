// proveedor.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Proveedor, ProveedorSchema } from './schemas/proveedor.schema';
import { ProveedoresController } from './proveedor.controller';
import { ProveedoresService } from './proveedor.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proveedor.name, schema: ProveedorSchema },
    ]),
  ],
  providers: [ProveedoresService],
  controllers: [ProveedoresController],
  exports: [ProveedoresService], // Si lo usas en otros módulos (ej: Viajes)
})
export class ProveedoresModule {}
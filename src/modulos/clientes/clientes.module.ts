// cliente.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cliente, ClienteSchema } from './schemas/cliente.schema';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cliente.name, schema: ClienteSchema },
    ]),
  ],
  providers: [ClientesService],
  controllers: [ClientesController],
  exports: [ClientesService], // Para usar en ViajesService
})
export class ClientesModule {}
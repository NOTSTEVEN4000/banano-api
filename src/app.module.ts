import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modulos/auth/auth.module';
import { UsuariosModule } from './modulos/usuarios/usuarios.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientesModule } from './modulos/clientes/clientes.module';
import { ViajesModule } from './modulos/viajes/viajes.module';
import { VehiculosModule } from './modulos/vehiculos/vehiculos.module';
import { ProveedoresModule } from './modulos/proveedores/proveedor.module';
import { SeguridadModule } from './modulos/gestionusuario/seguridad.module';
import { EstadisticasModule } from './modulos/estadisticas/estadisticas.module';
import { PagosModule } from './modulos/pagos/pagos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    UsuariosModule,
    ClientesModule,
    ViajesModule,
    VehiculosModule,
    ProveedoresModule,
    SeguridadModule,
    EstadisticasModule,
    PagosModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
      {
        name: 'login',
        ttl: 60_000,
        limit: 10,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

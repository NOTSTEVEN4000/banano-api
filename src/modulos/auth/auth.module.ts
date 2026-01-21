import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { JwtStrategy } from './estrategias/jwt.stategy';
import { MongooseModule } from '@nestjs/mongoose';
import { LogAcceso, LogAccesoSchema } from '../usuarios/schemas/log-acceso.schema';


@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: LogAcceso.name, schema: LogAccesoSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>('JWT_EXPIRES_IN') ?? '1d';
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: expiresIn as any },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}

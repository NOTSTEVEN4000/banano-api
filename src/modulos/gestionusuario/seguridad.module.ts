import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuario.schema';
import { SeguridadController } from './seguridad.controller';
import { SeguridadService } from './seguridad.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    // Cambiamos a forRootAsync para asegurar que lea el .env
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASS'),
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
        defaults: {
          from: `"Soporte Banano App" <${config.get('MAIL_USER')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SeguridadController],
  providers: [SeguridadService],
})
export class SeguridadModule {}
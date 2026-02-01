import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not set in configuration');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

async validate(payload: any) {
  // Al retornar este objeto, NestJS inyecta estas propiedades en req.user
  return {
    id: payload.sub,        // <--- Mapeamos sub a id
    usuario: payload.usuario,
    correo: payload.correo,
    roles: payload.roles,
    empresaId: payload.empresaId,
  };
}
}

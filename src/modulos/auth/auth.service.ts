import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { PayloadJwt } from './interfaces/payload-jwt.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogAcceso } from '../usuarios/schemas/log-acceso.schema';


const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    @InjectModel(LogAcceso.name) private logModel: Model<LogAcceso>,
  ) {}

  private async registrarLog(data: Partial<LogAcceso>) {
    try {
      await this.logModel.create({
        empresaId: data.empresaId ?? 'empresa_001',
        usuarioId: data.usuarioId,
        usuarioEntrada: data.usuarioEntrada,
        resultado: data.resultado,
        motivo: data.motivo,
        ip: data.ip,
        userAgent: data.userAgent,
      });
    } catch {
      // No tumbar el login por un fallo de logging
    }
  }

  async login(entrada: string, clave: string, meta?: { ip?: string; userAgent?: string }) {
    const usuario = await this.usuariosService.buscarPorUsuarioOEmail(entrada);

    // Usuario no encontrado: log FAIL neutro
    if (!usuario) {
      await this.registrarLog({
        empresaId: 'empresa_001',
        usuarioEntrada: entrada,
        resultado: 'FAIL',
        motivo: 'Credenciales inválidas',
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Bloqueo por intentos
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      await this.registrarLog({
        empresaId: usuario.empresaId,
        usuarioId: String(usuario._id),
        usuarioEntrada: entrada,
        resultado: 'BLOQUEADO',
        motivo: 'Usuario bloqueado temporalmente por intentos fallidos',
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      });
      throw new ForbiddenException('Usuario bloqueado temporalmente. Intenta más tarde.');
    }

    const ok = await bcrypt.compare(clave, usuario.claveHash);

    if (!ok) {
      usuario.intentosFallidos = (usuario.intentosFallidos ?? 0) + 1;

      // Si llegó al máximo, bloquea
      if (usuario.intentosFallidos >= MAX_INTENTOS) {
        const bloqueadoHasta = new Date(Date.now() + MINUTOS_BLOQUEO * 60 * 1000);
        usuario.bloqueadoHasta = bloqueadoHasta;
      }

      await usuario.save();

      await this.registrarLog({
        empresaId: usuario.empresaId,
        usuarioId: String(usuario._id),
        usuarioEntrada: entrada,
        resultado: 'FAIL',
        motivo: 'Credenciales inválidas',
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      });

      throw new UnauthorizedException('Credenciales inválidas.');
    }

    // Login OK: reinicia contador y guarda último acceso
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    usuario.ultimoAcceso = new Date();
    await usuario.save();

    const payload: PayloadJwt = {
      sub: String(usuario._id),
      usuario: usuario.usuario,
      correo: usuario.correo,
      empresaId: usuario.empresaId,
      roles: usuario.roles,
    };

    await this.registrarLog({
      empresaId: usuario.empresaId,
      usuarioId: String(usuario._id),
      usuarioEntrada: entrada,
      resultado: 'OK',
      motivo: 'Login correcto',
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      token: await this.jwtService.signAsync(payload),
      usuario: {
        id: String(usuario._id),
        usuario: usuario.usuario,
        correo: usuario.correo,
        nombreCompleto: usuario.nombreCompleto,
        roles: usuario.roles,
      },
    };
  }
}

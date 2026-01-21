import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario } from './schemas/usuario.schema';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { RolUsuario } from '../../comunes/tipos/roles.enum';

@Injectable()
export class UsuariosService {
  constructor(@InjectModel(Usuario.name) private usuarioModel: Model<Usuario>) {}

  async crear(dto: CrearUsuarioDto) {
    const existeUsuario = await this.usuarioModel.findOne({
      $or: [{ usuario: dto.usuario }, { correo: dto.correo }],
    });

    if (existeUsuario) throw new ConflictException('El usuario o correo ya existe.');

    const claveHash = await bcrypt.hash(dto.clave, 10);

    const nuevo = await this.usuarioModel.create({
      usuario: dto.usuario,
      correo: dto.correo,
      nombreCompleto: dto.nombreCompleto,
      claveHash,
      roles: dto.roles?.length ? dto.roles : [RolUsuario.LECTOR],
      activo: true,
      empresaId: 'empresa_001',
    });

    return {
      id: nuevo._id,
      usuario: nuevo.usuario,
      correo: nuevo.correo,
      nombreCompleto: nuevo.nombreCompleto,
      roles: nuevo.roles,
      activo: nuevo.activo,
    };
  }

  async listar() {
    return this.usuarioModel
      .find({}, { claveHash: 0 })
      .sort({ fechaCreacion: -1 })
      .lean();
  }

  async buscarPorUsuarioOEmail(entrada: string) {
    return this.usuarioModel.findOne({
      $or: [{ usuario: entrada }, { correo: entrada }],
      activo: true,
    });
  }

  async buscarPorId(id: string) {
    const user = await this.usuarioModel.findById(id, { claveHash: 0 }).lean();
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }
}

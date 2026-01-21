// cliente.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cliente } from './schemas/cliente.schema';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { ActualizarClienteDto } from './dto/actualizar-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(@InjectModel(Cliente.name) private model: Model<Cliente>) { }

  private getEmpresaId(user: any): string {
    return user?.empresaId || 'empresa_001';
  }

  private getUsuarioId(user: any): string {
    return user?.sub?.toString() || 'desconocido';
  }

  private getUsuarioCorreo(user: any): string {
    return user?.correo || 'desconocido';
  }

  async crear(dto: CrearClienteDto, user: any) {
    const empresaId = this.getEmpresaId(user);
    const usuarioId = this.getUsuarioId(user);
    const usuarioCorreo = this.getUsuarioCorreo(user);

    const nombreUpper = dto.nombre.toUpperCase().trim();

    const existente = await this.model.findOne({
      empresaId,
      $or: [{ idExterno: dto.idExterno }, { nombre: nombreUpper }],
    });

    if (existente) {
      throw new ConflictException('Ya existe un cliente con este ID externo o nombre.');
    }

    const nuevo = await this.model.create({
      ...dto,
      empresaId,
      nombre: nombreUpper,
      precio: {
        precioActual: dto.precioActual,
        moneda: dto.moneda || 'USD',
        historialPrecios: [
          {
            precio: dto.precioActual,
            desde: new Date(),
            motivo: 'Precio inicial',
            registradoPor: usuarioId,
          },
        ],
      },
      saldo: { totalPorCobrar: 0, totalCobrado: 0 },
      activo: true,
      estado: 'Activo',
      creadoPor: usuarioId,
      creadoPorCorreo: usuarioCorreo,
      actualizadoPor: usuarioId,
      actualizadoPorCorreo: usuarioCorreo,
    });

    return this.sanitizar(nuevo);
  }

  async listar(user: any) {
    const empresaId = this.getEmpresaId(user);
    return this.model
      .find({ empresaId, activo: true })
      .sort({ nombre: 1 })
      .lean();
  }

  async listarTodos(user: any) {
    const empresaId = this.getEmpresaId(user);
    return this.model
      .find({ empresaId })
      .sort({ activo: -1, nombre: 1 })
      .lean();
  }

async actualizar(idExterno: string, dto: ActualizarClienteDto, user: any) {
  const empresaId = this.getEmpresaId(user);
  const usuarioId = this.getUsuarioId(user);
  const usuarioCorreo = this.getUsuarioCorreo(user);

  // === VALIDACIÓN DE DUPLICADOS ===
  if (dto.nombre || dto.rucCi) {
    const query: any = { empresaId };
    
    if (dto.nombre) {
      const nombreUpper = dto.nombre.toUpperCase().trim();
      query.nombre = nombreUpper;
    }
    if (dto.rucCi) {
      query.rucCi = dto.rucCi.trim();
    }

    // Excluir el cliente actual
    query.idExterno = { $ne: idExterno };

    const existente = await this.model.findOne(query);
    if (existente) {
      if (dto.nombre && existente.nombre === dto.nombre.toUpperCase().trim()) {
        throw new ConflictException('Ya existe otro cliente con este nombre.');
      }
      if (dto.rucCi && existente.rucCi === dto.rucCi.trim()) {
        throw new ConflictException('Ya existe otro cliente con este RUC/CI.');
      }
    }
  }

  // === RESTO DEL CÓDIGO (precio, campos, etc.) ===
  const baseUpdate: any = {
    actualizadoPor: usuarioId,
    actualizadoPorCorreo: usuarioCorreo,
  };

  if (dto.nombre) {
    baseUpdate.nombre = dto.nombre.toUpperCase().trim();
  }

  if (dto.contacto) baseUpdate.contacto = dto.contacto;
  if (dto.direccion) baseUpdate.direccion = dto.direccion;
  if (dto.observaciones !== undefined) baseUpdate.observaciones = dto.observaciones;
  if (dto.rucCi !== undefined) baseUpdate.rucCi = dto.rucCi.trim();

  // === MANEJO ESPECIAL DEL PRECIO ===
  if (dto.precioActual !== undefined) {
    await this.model.updateOne(
      { empresaId, idExterno },
      {
        $set: {
          'precio.historialPrecios.$[elem].hasta': new Date(),
        },
      },
      {
        arrayFilters: [{ 'elem.hasta': { $exists: false } }],
      }
    );

    await this.model.updateOne(
      { empresaId, idExterno },
      {
        $set: {
          'precio.precioActual': dto.precioActual,
        },
        $push: {
          'precio.historialPrecios': {
            precio: dto.precioActual,
            desde: new Date(),
            motivo: 'Actualización manual',
            registradoPor: usuarioId,
          },
        },
      }
    );
  }

  // === ACTUALIZAR CAMPOS ===
  const doc = await this.model.findOneAndUpdate(
    { empresaId, idExterno },
    { $set: baseUpdate },
    { new: true }
  );

  if (!doc) throw new NotFoundException('Cliente no encontrado');

  return this.sanitizar(doc);
}

  async eliminarLogico(idExterno: string, user: any) {
    const empresaId = this.getEmpresaId(user);
    const usuarioId = this.getUsuarioId(user);
    const usuarioCorreo = this.getUsuarioCorreo(user);

    const doc = await this.model.findOneAndUpdate(
      { empresaId, idExterno, activo: true },
      {
        $set: {
          activo: false,
          estado: 'Inactivo',
          eliminadoPor: usuarioId,
          eliminadoPorCorreo: usuarioCorreo,
          fechaEliminacion: new Date(),
        },
      },
      { new: true },
    );

    if (!doc) throw new NotFoundException('Cliente no encontrado');

    return { eliminado: true, idExterno };
  }

  async reactivar(idExterno: string, user: any) {
    const empresaId = this.getEmpresaId(user);
    const usuarioId = this.getUsuarioId(user);
    const usuarioCorreo = this.getUsuarioCorreo(user);

    const doc = await this.model.findOneAndUpdate(
      { empresaId, idExterno, activo: false },
      {
        $set: {
          activo: true,
          estado: 'Activo',
          actualizadoPor: usuarioId,
          actualizadoPorCorreo: usuarioCorreo,
          eliminadoPor: null,
        },
      },
      { new: true },
    );

    if (!doc) throw new NotFoundException('Cliente inactivo no encontrado');

    return { reactivado: true, idExterno };
  }

  private sanitizar(doc: any) {
    return {
      idExterno: doc.idExterno,
      nombre: doc.nombre,
      rucCi: doc.rucCi,
      contacto: doc.contacto,
      direccion: doc.direccion,
      precio: doc.precio,
      saldo: doc.saldo,
      estado: doc.estado,
      activo: doc.activo,
      observaciones: doc.observaciones,
      fechaCreacion: doc.fechaCreacion,
      fechaActualizacion: doc.fechaActualizacion,
    };
  }
}
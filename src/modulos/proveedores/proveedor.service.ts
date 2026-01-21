import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Proveedor } from './schemas/proveedor.schema';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { ActualizarProveedorDto } from './dto/actualizar-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(@InjectModel(Proveedor.name) private model: Model<Proveedor>) {}

  private getEmpresaId(user: any): string {
    return user?.empresaId || 'empresa_001';
  }

  private getUsuarioId(user: any): string {
    return user?.sub?.toString() || 'desconocido';
  }

  private getUsuarioCorreo(user: any): string {
    return user?.correo || 'desconocido';
  }

  async crear(dto: CrearProveedorDto, user: any) {
    const empresaId = this.getEmpresaId(user);
    const usuarioId = this.getUsuarioId(user);
    const usuarioCorreo = this.getUsuarioCorreo(user);

    const nombreUpper = dto.nombre.toUpperCase().trim();

    // 1. Validar duplicados (idExterno o nombre)
    const existente = await this.model.findOne({
      empresaId,
      $or: [{ idExterno: dto.idExterno }, { nombre: nombreUpper }],
    });

    if (existente) {
      throw new ConflictException('Ya existe un proveedor con este ID externo o nombre.');
    }

    // 2. Preparar el nuevo documento basado en tu Schema
    const nuevo = await this.model.create({
      ...dto,
      empresaId,
      nombre: nombreUpper,
      precio: {
        precioActual: dto.precio.precioActual,
        moneda: dto.precio.moneda || 'USD',
        historialPrecios: [
          {
            precio: dto.precio.precioActual,
            desde: new Date(),
            motivo: 'Precio inicial',
            registradoPor: usuarioId,
          },
        ],
      },
      saldo: { totalPorPagar: 0, totalPagado: 0 },
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

  async actualizar(idExterno: string, dto: ActualizarProveedorDto, user: any) {
    const empresaId = this.getEmpresaId(user);
    const usuarioId = this.getUsuarioId(user);
    const usuarioCorreo = this.getUsuarioCorreo(user);

    // === VALIDACIÓN DE DUPLICADOS ===
    if (dto.nombre || dto.rucCi) {
      const query: any = { empresaId, idExterno: { $ne: idExterno } };
      const orConditions: any[] = [];

      if (dto.nombre) orConditions.push({ nombre: dto.nombre.toUpperCase().trim() });
      if (dto.rucCi) orConditions.push({ rucCi: dto.rucCi.trim() });

      if (orConditions.length > 0) {
        query.$or = orConditions;
        const existente = await this.model.findOne(query);
        if (existente) throw new ConflictException('Ya existe otro proveedor con ese nombre o RUC/CI.');
      }
    }

    // === PREPARAR ACTUALIZACIÓN DE CAMPOS PLANOS ===
    const baseUpdate: any = {
      actualizadoPor: usuarioId,
      actualizadoPorCorreo: usuarioCorreo,
    };

    if (dto.nombre) baseUpdate.nombre = dto.nombre.toUpperCase().trim();
    if (dto.tipo) baseUpdate.tipo = dto.tipo;
    if (dto.rucCi !== undefined) baseUpdate.rucCi = dto.rucCi.trim();
    if (dto.estado) baseUpdate.estado = dto.estado;
    if (dto.observaciones !== undefined) baseUpdate.observaciones = dto.observaciones;

    // === ACTUALIZAR OBJETOS ANIDADOS (Contacto, Dirección, Condiciones) ===
    if (dto.contacto) {
        for (const key in dto.contacto) {
            baseUpdate[`contacto.${key}`] = dto.contacto[key];
        }
    }
    if (dto.direccion) {
        for (const key in dto.direccion) {
            baseUpdate[`direccion.${key}`] = dto.direccion[key];
        }
    }
    if (dto.condiciones) {
        for (const key in dto.condiciones) {
            baseUpdate[`condiciones.${key}`] = dto.condiciones[key];
        }
    }

    // === MANEJO ESPECIAL DEL PRECIO (Historial) ===
    if (dto.precio?.precioActual !== undefined) {
      // Cerrar el precio anterior poniendo fecha "hasta"
      await this.model.updateOne(
        { empresaId, idExterno },
        { $set: { 'precio.historialPrecios.$[elem].hasta': new Date() } },
        { arrayFilters: [{ 'elem.hasta': { $exists: false } }] }
      );

      // Agregar nuevo precio al historial y actualizar precioActual
      await this.model.updateOne(
        { empresaId, idExterno },
        {
          $set: { 'precio.precioActual': dto.precio.precioActual },
          $push: {
            'precio.historialPrecios': {
              precio: dto.precio.precioActual,
              desde: new Date(),
              motivo: 'Actualización manual',
              registradoPor: usuarioId,
            },
          },
        }
      );
      
      if (dto.precio.moneda) baseUpdate['precio.moneda'] = dto.precio.moneda;
    }

    const doc = await this.model.findOneAndUpdate(
      { empresaId, idExterno },
      { $set: baseUpdate },
      { new: true }
    );

    if (!doc) throw new NotFoundException('Proveedor no encontrado');

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

    if (!doc) throw new NotFoundException('Proveedor no encontrado');
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

    if (!doc) throw new NotFoundException('Proveedor inactivo no encontrado');
    return { reactivado: true, idExterno };
  }

  private sanitizar(doc: any) {
    return {
      idExterno: doc.idExterno,
      nombre: doc.nombre,
      tipo: doc.tipo,
      rucCi: doc.rucCi,
      contacto: doc.contacto,
      direccion: doc.direccion,
      precio: doc.precio,
      saldo: doc.saldo,
      condiciones: doc.condiciones,
      estado: doc.estado,
      activo: doc.activo,
      observaciones: doc.observaciones,
      fechaCreacion: doc.fechaCreacion,
      fechaActualizacion: doc.fechaActualizacion,
    };
  }
}
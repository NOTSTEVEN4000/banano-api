import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehiculo } from './schemas/vehiculo.schema';
import { CrearVehiculoDto } from './dto/crear-vehiculo.dto';
import { ActualizarVehiculoDto } from './dto/actualizar-vehiculo.dto';
import moment from 'moment-timezone';

@Injectable()
export class VehiculosService {
  constructor(@InjectModel(Vehiculo.name) private model: Model<Vehiculo>) {}

  private getEmpresaId(user: any): string {
    return user?.empresaId || 'empresa_001';
  }

  private getUsuarioId(user: any): string {
    return user?.sub?.toString() || user?._id?.toString() || user?.id?.toString() || 'desconocido';
  }

  private getUsuarioCorreo(user: any): string {
    return user?.correo || 'desconocido';
  }

  async crear(dto: CrearVehiculoDto, user: any) {
    const empresaId = this.getEmpresaId(user);
    const usuarioId = this.getUsuarioId(user);
    const usuarioCorreo = this.getUsuarioCorreo(user);
    const placaUpper = dto.placa.toUpperCase().trim();

    // Validación manual de placa duplicada (incluso inactivos)
    const placaExistente = await this.model.findOne({
      empresaId,
      placa: placaUpper,
    });

    if (placaExistente) {
      if (placaExistente.activo) {
        throw new ConflictException('Esta placa ya está registrada en un vehículo activo.');
      } else {
        throw new ConflictException(
          'Esta placa existe pero está inactiva. Contacte al administrador para habilitarla.',
        );
      }
    }

    try {
      const doc = await this.model.create({
        empresaId,
        idExterno: dto.idExterno,
        placa: placaUpper,
        nombre: dto.nombre,
        capacidadCajas: dto.capacidadCajas ?? null,
        tipo: dto.tipo,
        marca: dto.marca,
        modelo: dto.modelo,
        anio: dto.anio,
        color: dto.color,
        kilometrajeActual: dto.kilometrajeActual ?? 0,
        estado: dto.estado ?? 'Operativo',
        conductorAsignado: dto.conductorAsignado,
        conductorAsignadoNombre: dto.conductorAsignadoNombre,
        activo: true,
        creadoPor: usuarioId,
        creadoPorCorreo: usuarioCorreo,
        actualizadoPor: usuarioId,
        actualizadoPorCorreo: usuarioCorreo,
      });

      return {
        id: doc._id,
        idExterno: doc.idExterno,
        placa: doc.placa,
        nombre: doc.nombre,
        capacidadCajas: doc.capacidadCajas,
        tipo: doc.tipo,
        marca: doc.marca,
        modelo: doc.modelo,
        anio: doc.anio,
        color: doc.color,
        kilometrajeActual: doc.kilometrajeActual,
        estado: doc.estado,
        conductorAsignado: doc.conductorAsignado,
        conductorAsignadoNombre: doc.conductorAsignadoNombre,
        activo: doc.activo,
      };
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new ConflictException('idExterno o placa duplicada.');
      }
      throw e;
    }
  }

  async listar(user: any) {
    const empresaId = this.getEmpresaId(user);
    return this.model
      .find({ empresaId, activo: true }, { __v: 0 })
      .sort({ fechaActualizacion: -1 })
      .lean();
  }

  // NUEVO: Listado completo (activos + inactivos) - solo para admin
  async listarTodos(user: any) {
    const empresaId = this.getEmpresaId(user);
    return this.model
      .find({ empresaId }, { __v: 0 })
      .sort({ activo: -1, fechaActualizacion: -1 }) // Activos primero
      .lean();
  }

  async obtenerPorIdExterno(idExterno: string, user: any) {
    const empresaId = this.getEmpresaId(user);
    const doc = await this.model.findOne({ empresaId, idExterno, activo: true }).lean();
    if (!doc) throw new NotFoundException('Vehículo no encontrado.');
    return doc;
  }

  async actualizar(idExterno: string, dto: ActualizarVehiculoDto, user: any) {
    const empresaId = this.getEmpresaId(user);
    const usuarioId = this.getUsuarioId(user);
    const usuarioCorreo = this.getUsuarioCorreo(user);

    const update: any = {
      ...dto,
      actualizadoPor: usuarioId,
      actualizadoPorCorreo: usuarioCorreo,
    };

    if (dto.placa) {
      const placaNueva = dto.placa.toUpperCase().trim();

      // Validar que la nueva placa no esté usada por otro vehículo
      const placaExistente = await this.model.findOne({
        empresaId,
        placa: placaNueva,
        idExterno: { $ne: idExterno },
      });

      if (placaExistente) {
        if (placaExistente.activo) {
          throw new ConflictException('Esta placa ya está registrada en un vehículo activo.');
        } else {
          throw new ConflictException(
            'Esta placa existe pero está inactiva. Contacte al administrador para habilitarla.',
          );
        }
      }

      update.placa = placaNueva;
    }

    try {
      const doc = await this.model.findOneAndUpdate(
        { empresaId, idExterno, activo: true },
        { $set: update },
        { new: true, select: '-__v' },
      );

      if (!doc) throw new NotFoundException('Vehículo no encontrado para actualizar.');

      return {
        idExterno: doc.idExterno,
        placa: doc.placa,
        nombre: doc.nombre,
        capacidadCajas: doc.capacidadCajas,
        tipo: doc.tipo,
        marca: doc.marca,
        modelo: doc.modelo,
        anio: doc.anio,
        color: doc.color,
        kilometrajeActual: doc.kilometrajeActual,
        estado: doc.estado,
        conductorAsignado: doc.conductorAsignado,
        conductorAsignadoNombre: doc.conductorAsignadoNombre,
      };
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new ConflictException('Error de unicidad en placa o idExterno.');
      }
      throw e;
    }
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
          actualizadoPor: usuarioId,
          actualizadoPorCorreo: usuarioCorreo,
          eliminadoPor: usuarioId,
          eliminadoPorCorreo: usuarioCorreo,
          fechaEliminacion: moment().tz('America/Guayaquil').toDate(),
          estado: 'Fuera de servicio',
        },
      },
      { new: true },
    );

    if (!doc) throw new NotFoundException('Vehículo no encontrado para eliminar.');
    return { eliminado: true, idExterno, placa: doc.placa };
  }

  // Solo admin puede reactivar
  async reactivar(idExterno: string, user: any) {
    const empresaId = this.getEmpresaId(user);
    const usuarioId = this.getUsuarioId(user);
    const usuarioCorreo = this.getUsuarioCorreo(user);

    const doc = await this.model.findOneAndUpdate(
      { empresaId, idExterno, activo: false },
      {
        $set: {
          activo: true,
          actualizadoPor: usuarioId,
          actualizadoPorCorreo: usuarioCorreo,
          eliminadoPor: null,
          eliminadoPorCorreo: null,
          motivoEliminacion: null,
          estado: 'Operativo',
        },
      },
      { new: true },
    );

    if (!doc) throw new NotFoundException('Vehículo inactivo no encontrado.');
    return { reactivado: true, idExterno, placa: doc.placa };
  }
}
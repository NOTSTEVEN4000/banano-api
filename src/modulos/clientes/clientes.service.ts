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

    // Cambia el $or para que solo busque por ID único real (RUC o ID Externo)
    const existente = await this.model.findOne({
      empresaId,
      $or: [
        { idExterno: dto.idExterno }, 
        { rucCi: dto.rucCi } // Es mejor validar que no se repita el RUC
      ],
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

// clientes.service.ts
// clientes.service.ts -> Método listar

async listar(user: any, pagina: number = 1, limite: number = 20, search?: string, activo?: string) {
  const empresaId = this.getEmpresaId(user);
  
  const page = Math.max(1, pagina);
  const limit = Math.max(1, limite);
  const skip = (page - 1) * limit;

  const filtro: any = { empresaId };

  // === CORRECCIÓN AQUÍ ===
  // Según tu imagen, el campo es 'roles' (Array)
  const misRoles = user.roles || []; 
  const esAdmin = misRoles.includes('ADMINISTRADOR');

  if (!esAdmin) {
    // Si no es admin, forzamos ver solo activos
    filtro.activo = true;
  } else {
    // Si es ADMIN, aplicamos el filtro de la URL si existe
    if (activo === 'true') {
      filtro.activo = true;
    } else if (activo === 'false') {
      filtro.activo = false;
    }
    // Si activo es undefined, el admin ve todos (no se agrega filtro.activo)
  }
  // =======================

  if (search) {
    const regex = new RegExp(search, 'i');
    filtro.$or = [
      { nombre: regex },
      { rucCi: regex },
      { 'contacto.telefono': regex }
    ];
  }

  // Este log te confirmará que ahora sí sale: {"empresaId":"empresa_001","activo":false}
  console.log('Filtro final:', JSON.stringify(filtro));

  const [items, total] = await Promise.all([
    this.model
      .find(filtro)
      .sort({ nombre: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.model.countDocuments(filtro),
  ]);

  return {
    items: items.map(doc => this.sanitizar(doc)),
    total,
    paginas: Math.ceil(total / limit),
    paginaActual: page
  };
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
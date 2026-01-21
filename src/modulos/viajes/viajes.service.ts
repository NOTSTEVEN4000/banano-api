import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Viaje, ViajeDocument } from './schemas/viaje.schema';
import {
  ViajeInsumos,
  ViajeInsumosDocument,
} from './schemas/viaje-insumos.schema';
import {
  ViajeCargaCajas,
  ViajeCargaCajasDocument,
} from './schemas/viaje-carga-cajas.schema';
import {
  ViajeCombustible,
  ViajeCombustibleDocument,
} from './schemas/viaje-combustible.schema';
import { CrearViajeDto } from './dto/crear-viaje.dto';
import { RegistrarInsumosViajeDto } from './dto/insumos-viaje.dto';
import { AgregarCargaCajasDto } from './dto/carga-cajas.dto';
import { AgregarCombustibleDto } from './dto/combustible.dto';
import { EntregarViajeDto } from './dto/entregar-viaje.dto';
import { EstadoViaje, TipoDestino, TipoViaje } from './tipos/viaje.enums';

@Injectable()
export class ViajesService {
  constructor(
    @InjectModel(Viaje.name) private readonly viajeModel: Model<ViajeDocument>,
    @InjectModel(ViajeInsumos.name)
    private readonly insumosModel: Model<ViajeInsumosDocument>,
    @InjectModel(ViajeCargaCajas.name)
    private readonly cargasModel: Model<ViajeCargaCajasDocument>,
    @InjectModel(ViajeCombustible.name)
    private readonly combustibleModel: Model<ViajeCombustibleDocument>,
  ) {}

  private empresaId(user: any) {
    return user?.empresaId ?? 'empresa_001';
  }
  private usuarioId(user: any) {
    return user?.sub ?? 'desconocido';
  }

  async crear(dto: CrearViajeDto, user: any) {
    // Validaciones de destino según tipo
    if (
      dto.destino.tipoDestino === TipoDestino.HACIENDA &&
      !dto.destino.haciendaIdExterno
    ) {
      throw new BadRequestException(
        'destino.haciendaIdExterno es obligatorio cuando tipoDestino=HACIENDA.',
      );
    }

    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    try {
      const doc = new this.viajeModel({
        empresaId,
        idExterno: `via-${dto.fecha}-${Date.now()}`, // puedes enviar idExterno desde app si prefieres
        fecha: dto.fecha,
        tipo: dto.tipo,
        estado: EstadoViaje.CREADO,
        vehiculoIdExterno: dto.vehiculoIdExterno,
        destino: dto.destino,
        notas: dto.notas ?? null,
        activo: true,
        creadoPor: uid,
        actualizadoPor: uid,
      });
      await doc.save();
      return {
        idExterno: doc.idExterno,
        estado: doc.estado,
        tipo: doc.tipo,
        fecha: doc.fecha,
      };
    } catch (e: any) {
      if (e?.code === 11000)
        throw new ConflictException('Viaje duplicado (idExterno ya existe).');
      throw e;
    }
  }

  async listarPorFecha(fecha: string, user: any) {
    const empresaId = this.empresaId(user);
    return this.viajeModel
      .find({ empresaId, fecha, activo: true })
      .sort({ fechaCreacion: -1 })
      .lean();
  }

  async iniciar(viajeIdExterno: string, user: any) {
    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    const viaje = await this.viajeModel.findOne({
      empresaId,
      idExterno: viajeIdExterno,
      activo: true,
    });
    if (!viaje) throw new NotFoundException('Viaje no encontrado.');
    if (viaje.estado === EstadoViaje.ANULADO)
      throw new BadRequestException('No se puede iniciar un viaje ANULADO.');
    if (viaje.estado === EstadoViaje.ENTREGADO)
      throw new BadRequestException('El viaje ya fue ENTREGADO.');
    if (viaje.estado === EstadoViaje.EN_RUTA)
      return { idExterno: viaje.idExterno, estado: viaje.estado };

    viaje.estado = EstadoViaje.EN_RUTA;
    viaje.fechaInicio = new Date();
    viaje.actualizadoPor = uid;
    await viaje.save();
    return {
      idExterno: viaje.idExterno,
      estado: viaje.estado,
      fechaInicio: viaje.fechaInicio,
    };
  }

  async registrarInsumos(
    viajeIdExterno: string,
    dto: RegistrarInsumosViajeDto,
    user: any,
  ) {
    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    const viaje = await this.viajeModel.findOne({
      empresaId,
      idExterno: viajeIdExterno,
      activo: true,
    });
    if (!viaje) throw new NotFoundException('Viaje no encontrado.');
    if (viaje.tipo !== TipoViaje.INSUMOS)
      throw new BadRequestException('Este viaje no es de tipo INSUMOS.');
    if ([EstadoViaje.ANULADO, EstadoViaje.ENTREGADO].includes(viaje.estado)) {
      throw new BadRequestException(
        `No puedes registrar insumos con estado ${viaje.estado}.`,
      );
    }

    // Guardar (1 doc por viaje)
    try {
      const doc = new this.insumosModel({
        empresaId,
        idExterno: dto.idExterno,
        viajeIdExterno,
        haciendaIdExterno: dto.haciendaIdExterno,
        items: dto.items,
        creadoPor: uid,
        actualizadoPor: uid,
      });
      await doc.save();
      return { guardado: true, viajeIdExterno };
    } catch (e: any) {
      if (e?.code === 11000)
        throw new ConflictException('Este viaje ya tiene insumos registrados.');
      throw e;
    }
  }

  async actualizarInsumos(
    viajeIdExterno: string,
    dto: RegistrarInsumosViajeDto,
    user: any,
  ) {
    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    const viaje = await this.viajeModel.findOne({
      empresaId,
      idExterno: viajeIdExterno,
      activo: true,
    });
    if (!viaje) throw new NotFoundException('Viaje no encontrado.');

    let doc = await this.insumosModel.findOne({ empresaId, viajeIdExterno });
    if (!doc) {
      throw new NotFoundException(
        'No existe registro de insumos para este viaje. Usa POST para crear.',
      );
    }

    // Reemplazo completo (opción más simple y predecible)
    doc.items = dto.items;
    doc.haciendaIdExterno = dto.haciendaIdExterno ?? doc.haciendaIdExterno;
    doc.actualizadoPor = uid;
    await doc.save();

    return { actualizado: true, viajeIdExterno, items: doc.items };
  }

  async eliminarInsumos(viajeIdExterno: string, user: any) {
    const empresaId = this.empresaId(user);

    const doc = await this.insumosModel.findOne({ empresaId, viajeIdExterno });
    if (!doc) {
      throw new NotFoundException(
        'No hay insumos para eliminar en este viaje.',
      );
    }

    await doc.deleteOne(); // Borrado físico
    // O borrado lógico: doc.activo = false; await doc.save();

    return { eliminado: true, viajeIdExterno };
  }

  async agregarCargaCajas(
    viajeIdExterno: string,
    dto: AgregarCargaCajasDto,
    user: any,
  ) {
    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    const viaje = await this.viajeModel.findOne({
      empresaId,
      idExterno: viajeIdExterno,
      activo: true,
    });
    if (!viaje) throw new NotFoundException('Viaje no encontrado.');
    if (viaje.tipo !== TipoViaje.CAJAS)
      throw new BadRequestException('Este viaje no es de tipo CAJAS.');
    if ([EstadoViaje.ANULADO, EstadoViaje.ENTREGADO].includes(viaje.estado)) {
      throw new BadRequestException(
        `No puedes agregar cargas con estado ${viaje.estado}.`,
      );
    }

    const totalCompra = +(dto.cantidadCajas * dto.costoCompraUnitario).toFixed(
      2,
    );

    let totalVenta: number | null = null;
    let utilidad: number | null = null;

    if (dto.precioVentaUnitario != null) {
      totalVenta = +(dto.cantidadCajas * dto.precioVentaUnitario).toFixed(2);
      utilidad = +(totalVenta - totalCompra).toFixed(2);
    }

    try {
      const doc = new this.cargasModel({
        empresaId,
        idExterno: dto.idExterno,
        viajeIdExterno,
        proveedorIdExterno: dto.proveedorIdExterno,
        haciendaIdExterno: dto.haciendaIdExterno,
        cantidadCajas: dto.cantidadCajas,
        costoCompraUnitario: dto.costoCompraUnitario,
        moneda: 'USD',
        totalCompra,
        clienteIdExterno: dto.clienteIdExterno ?? null,
        precioVentaUnitario: dto.precioVentaUnitario ?? null,
        totalVenta,
        utilidadBruta: utilidad,
        creadoPor: uid,
        actualizadoPor: uid,
      });
      await doc.save();
      return {
        agregado: true,
        totalCompra,
        totalVenta,
        utilidadBruta: utilidad,
      };
    } catch (e: any) {
      if (e?.code === 11000)
        throw new ConflictException('Carga duplicada (idExterno ya existe).');
      throw e;
    }
  }

  async agregarCombustible(
    viajeIdExterno: string,
    dto: AgregarCombustibleDto,
    user: any,
  ) {
    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    const viaje = await this.viajeModel.findOne({
      empresaId,
      idExterno: viajeIdExterno,
      activo: true,
    });
    if (!viaje) throw new NotFoundException('Viaje no encontrado.');
    if ([EstadoViaje.ANULADO, EstadoViaje.ENTREGADO].includes(viaje.estado)) {
      throw new BadRequestException(
        `No puedes registrar combustible con estado ${viaje.estado}.`,
      );
    }

    const doc = new this.combustibleModel({
      empresaId,
      idExterno: dto.idExterno,
      viajeIdExterno,
      fechaHora: new Date(dto.fechaHora),
      montoUSD: dto.montoUSD,
      litros: dto.litros ?? null,
      detalle: dto.detalle ?? null,
      creadoPor: uid,
      actualizadoPor: uid,
    });

    try {
      await doc.save();
      return { agregado: true };
    } catch (e: any) {
      if (e?.code === 11000)
        throw new ConflictException(
          'Registro de combustible duplicado (idExterno).',
        );
      throw e;
    }
  }

  async entregar(viajeIdExterno: string, dto: EntregarViajeDto, user: any) {
    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    const viaje = await this.viajeModel.findOne({
      empresaId,
      idExterno: viajeIdExterno,
      activo: true,
    });
    if (!viaje) throw new NotFoundException('Viaje no encontrado.');
    if (viaje.estado !== EstadoViaje.EN_RUTA) {
      throw new BadRequestException(
        'Para entregar, el viaje debe estar EN_RUTA.',
      );
    }

    // Reglas mínimas para cerrar:
    if (viaje.tipo === TipoViaje.INSUMOS) {
      const ins = await this.insumosModel
        .findOne({ empresaId, viajeIdExterno })
        .lean();
      if (!ins)
        throw new BadRequestException(
          'No puedes ENTREGAR: falta registrar insumos del viaje.',
        );
      if (!ins.items?.length)
        throw new BadRequestException(
          'No puedes ENTREGAR: items de insumos vacíos.',
        );
    }

    if (viaje.tipo === TipoViaje.CAJAS) {
      const count = await this.cargasModel.countDocuments({
        empresaId,
        viajeIdExterno,
      });
      if (count <= 0)
        throw new BadRequestException(
          'No puedes ENTREGAR: no hay cargas de cajas registradas.',
        );
    }

    viaje.estado = EstadoViaje.ENTREGADO;
    viaje.fechaFin = new Date();
    viaje.notas = dto.observacion
      ? `${viaje.notas ?? ''}\n[ENTREGA] ${dto.observacion}`.trim()
      : viaje.notas;
    viaje.actualizadoPor = uid;
    await viaje.save();

    return {
      idExterno: viaje.idExterno,
      estado: viaje.estado,
      fechaFin: viaje.fechaFin,
    };
  }

  async resumenPorFecha(fecha: string, user: any) {
    const empresaId = this.empresaId(user);

    // Trae viajes del día + vehiculo + insumos + combustible + cargas + hacienda
    const viajes = await this.viajeModel.aggregate([
      { $match: { empresaId, fecha, activo: true } },

      // Vehículo
      {
        $lookup: {
          from: 'vehiculos',
          let: { veh: '$vehiculoIdExterno', emp: '$empresaId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$empresaId', '$$emp'] },
                    { $eq: ['$idExterno', '$$veh'] },
                  ],
                },
              },
            },
            { $project: { _id: 0, idExterno: 1, nombre: 1, placa: 1 } },
          ],
          as: 'vehiculo',
        },
      },
      {
        $addFields: {
          vehiculo: { $ifNull: [{ $arrayElemAt: ['$vehiculo', 0] }, null] },
        },
      },

      // Insumos (1 doc por viaje)
      {
        $lookup: {
          from: 'viaje_insumos',
          let: { vid: '$idExterno', emp: '$empresaId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$empresaId', '$$emp'] },
                    { $eq: ['$viajeIdExterno', '$$vid'] },
                  ],
                },
              },
            },
            { $project: { _id: 0, items: 1 } },
          ],
          as: 'insumosDoc',
        },
      },
      { $addFields: { insumosDoc: { $arrayElemAt: ['$insumosDoc', 0] } } },

      // Combustible
      {
        $lookup: {
          from: 'viaje_combustible',
          let: { vid: '$idExterno', emp: '$empresaId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$empresaId', '$$emp'] },
                    { $eq: ['$viajeIdExterno', '$$vid'] },
                  ],
                },
              },
            },
            { $project: { _id: 0, montoUSD: 1 } },
          ],
          as: 'comb',
        },
      },
      {
        $addFields: {
          combustible: {
            recargas: { $size: '$comb' },
            totalUSD: { $round: [{ $sum: '$comb.montoUSD' }, 2] },
          },
        },
      },

      // Cargas de cajas
      {
        $lookup: {
          from: 'viaje_cargas_cajas',
          let: { vid: '$idExterno', emp: '$empresaId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$empresaId', '$$emp'] },
                    { $eq: ['$viajeIdExterno', '$$vid'] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                haciendaIdExterno: 1,
                cantidadCajas: 1,
                totalCompra: 1,
                totalVenta: 1,
                utilidadBruta: 1,
              },
            },
          ],
          as: 'cargas',
        },
      },

      // Traer nombres de haciendas para el desglose
      {
        $lookup: {
          from: 'haciendas',
          let: { emp: '$empresaId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$empresaId', '$$emp'] } } },
            { $project: { _id: 0, idExterno: 1, nombre: 1 } },
          ],
          as: 'haciendasCatalogo',
        },
      },

      { $project: { _id: 0, empresaId: 0, activo: 0, __v: 0 } },
    ]);

    // Formatear para Flutter
    const viajesBonitos = viajes.map((v: any) => {
      const ins = v.insumosDoc?.items ?? null;
      const insumos = ins
        ? ins.reduce((acc: any, it: any) => {
            acc[it.insumo] = it.cantidad;
            return acc;
          }, {})
        : null;

      const cargas = v.cargas ?? [];
      const porHacienda = cargas.map((c: any) => {
        const hac = (v.haciendasCatalogo ?? []).find(
          (h: any) => h.idExterno === c.haciendaIdExterno,
        );
        return {
          haciendaIdExterno: c.haciendaIdExterno,
          haciendaNombre: hac?.nombre ?? c.haciendaIdExterno,
          cajas: c.cantidadCajas,
          compraUSD: Number(
            (c.totalCompra ?? 0).toFixed?.(2) ?? c.totalCompra ?? 0,
          ),
          ventaUSD: c.totalVenta ?? 0,
          utilidadUSD: c.utilidadBruta ?? 0,
        };
      });

      const totalCajas = cargas.reduce(
        (s: number, c: any) => s + (c.cantidadCajas ?? 0),
        0,
      );
      const compraUSD = Number(
        cargas
          .reduce((s: number, c: any) => s + (c.totalCompra ?? 0), 0)
          .toFixed(2),
      );
      const ventaUSD = Number(
        cargas
          .reduce((s: number, c: any) => s + (c.totalVenta ?? 0), 0)
          .toFixed(2),
      );
      const utilidadBrutaUSD = Number(
        cargas
          .reduce((s: number, c: any) => s + (c.utilidadBruta ?? 0), 0)
          .toFixed(2),
      );

      return {
        idExterno: v.idExterno,
        fecha: v.fecha,
        tipo: v.tipo,
        estado: v.estado,
        vehiculo: v.vehiculo,
        combustible: v.combustible,
        insumos,
        cajas:
          v.tipo === 'CAJAS'
            ? { totalCajas, compraUSD, ventaUSD, utilidadBrutaUSD, porHacienda }
            : null,
      };
    });

    // Totales del día
    const totalesDia = viajesBonitos.reduce(
      (acc: any, x: any) => {
        acc.viajes += 1;
        acc.recargas += x.combustible?.recargas ?? 0;
        acc.combustibleUSD += x.combustible?.totalUSD ?? 0;

        if (x.cajas) {
          acc.cajas += x.cajas.totalCajas;
          acc.compraUSD += x.cajas.compraUSD;
          acc.ventaUSD += x.cajas.ventaUSD;
          acc.utilidadBrutaUSD += x.cajas.utilidadBrutaUSD;
        }
        return acc;
      },
      {
        viajes: 0,
        recargas: 0,
        combustibleUSD: 0,
        cajas: 0,
        compraUSD: 0,
        ventaUSD: 0,
        utilidadBrutaUSD: 0,
      },
    );

    totalesDia.combustibleUSD = Number(totalesDia.combustibleUSD.toFixed(2));
    totalesDia.compraUSD = Number(totalesDia.compraUSD.toFixed(2));
    totalesDia.ventaUSD = Number(totalesDia.ventaUSD.toFixed(2));
    totalesDia.utilidadBrutaUSD = Number(
      totalesDia.utilidadBrutaUSD.toFixed(2),
    );

    return { fecha, totalesDia, viajes: viajesBonitos };
  }


  // ... imports y clase ...

async getInsumos(viajeIdExterno: string, user: any) {
  const empresaId = this.empresaId(user);

  const doc = await this.insumosModel
    .findOne({ empresaId, viajeIdExterno })
    .lean();

  if (!doc) {
    return null; // o throw new NotFoundException() si prefieres error 404
  }

  return {
    idExterno: doc.idExterno,
    viajeIdExterno: doc.viajeIdExterno,
    haciendaIdExterno: doc.haciendaIdExterno,
    items: doc.items,
    creadoPor: doc.creadoPor,
    actualizadoPor: doc.actualizadoPor
  };
}

async getCombustible(viajeIdExterno: string, user: any) {
  const empresaId = this.empresaId(user);

  const registros = await this.combustibleModel
    .find({ empresaId, viajeIdExterno })
    .sort({ fechaHora: -1 }) // orden descendente por fecha
    .lean();

  return registros.map((r) => ({
    idExterno: r.idExterno,
    viajeIdExterno: r.viajeIdExterno,
    fechaHora: r.fechaHora,
    montoUSD: r.montoUSD,
    litros: r.litros,
    detalle: r.detalle,
    creadoPor: r.creadoPor,
    actualizadoPor: r.actualizadoPor,
  }));
}
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyBulkWriteOperation, Model } from 'mongoose';
import { InsumoTipo } from '../viajes/tipos/viaje.enums';
import { Insumo, InsumoDocument } from './schema/insumo.schema';
import { MovimientoInsumo, MovimientoInsumoDocument, TipoMovimiento } from './schema/movimiento-insumo.schema';
import { CrearInsumoDto } from './dto/crear-insumo.dto';
import { ActualizarInsumoDto } from './dto/actualizar-insumo.dto';
import { RegistrarEntradaDto } from './dto/registrar-entrada.dto';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto';

@Injectable()
export class InsumosService {
  constructor(
    @InjectModel(Insumo.name) private insumoModel: Model<InsumoDocument>,
    @InjectModel(MovimientoInsumo.name)
    private movimientoModel: Model<MovimientoInsumoDocument>,
  ) {}

  private empresaId(user: any) {
    return user?.empresaId ?? 'empresa_001';
  }

  private usuarioId(user: any) {
    return user?.sub ?? 'desconocido';
  }

  // ── CRUD Catálogo ──────────────────────────────────────────────────────

  async crearInsumo(dto: CrearInsumoDto, user: any) {
    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    const existe = await this.insumoModel.findOne({
      empresaId,
      tipo: dto.tipo,
    });

    if (existe) {
      throw new ConflictException(`Ya existe un insumo del tipo ${dto.tipo}`);
    }

    const idExterno = `INS-${dto.tipo}-${Date.now().toString(36).toUpperCase()}`;

    const insumo = new this.insumoModel({
      empresaId,
      idExterno,
      tipo: dto.tipo,
      descripcion: dto.descripcion,
      unidad: dto.unidad ?? 'unidad',
      stockActual: dto.stockInicial ?? 0,
      costoPromedioUSD: dto.costoPromedioUSD ?? 0,
      creadoPor: uid,
      actualizadoPor: uid,
    });

    await insumo.save();
    return insumo;
  }

  async listarInsumos(filtros: { tipo?: string; conStockBajo?: boolean }) {
    const query: any = {};

    if (filtros.tipo) query.tipo = filtros.tipo;
    if (filtros.conStockBajo) query.stockActual = { $lt: 50 }; // umbral configurable

    return this.insumoModel.find(query).sort({ tipo: 1 }).lean();
  }

  async obtenerInsumo(idExterno: string, user: any) {
    const empresaId = this.empresaId(user);
    const insumo = await this.insumoModel
      .findOne({ empresaId, idExterno })
      .lean();
    if (!insumo) throw new NotFoundException('Insumo no encontrado');
    return insumo;
  }

  async actualizarInsumo(
    idExterno: string,
    dto: ActualizarInsumoDto,
    user: any,
  ) {
    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    const insumo = await this.insumoModel.findOne({ empresaId, idExterno });
    if (!insumo) throw new NotFoundException('Insumo no encontrado');

    Object.assign(insumo, dto);
    insumo.actualizadoPor = uid;
    await insumo.save();

    return insumo;
  }

  // ── Registrar Entrada (proveedor / compra semanal) ─────────────────────

  async registrarEntrada(dto: RegistrarEntradaDto, user: any) {
    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    const operaciones: AnyBulkWriteOperation[] = [];
    let totalCosto = 0;

    for (const item of dto.items) {
      const insumo = await this.insumoModel.findOne({
        empresaId,
        tipo: item.tipo,
      });

      if (!insumo) {
        throw new BadRequestException(
          `Insumo ${item.tipo} no encontrado en catálogo`,
        );
      }

      const nuevoStock = insumo.stockActual + item.cantidad;
      const costoItem =
        (item.costoUnitarioUSD ?? insumo.costoPromedioUSD) * item.cantidad;
      totalCosto += costoItem;

      // Actualizar stock y costo promedio (simple ponderado)
      const nuevoCostoPromedio =
        item.costoUnitarioUSD && insumo.stockActual > 0
          ? (insumo.stockActual * insumo.costoPromedioUSD +
              item.cantidad * item.costoUnitarioUSD) /
            nuevoStock
          : insumo.costoPromedioUSD;

      operaciones.push({
        updateOne: {
          filter: { _id: insumo._id },
          update: {
            $set: {
              stockActual: nuevoStock,
              costoPromedioUSD: nuevoCostoPromedio,
              actualizadoPor: uid,
            },
          },
        },
      });

      // Registrar movimiento
      operaciones.push({
        insertOne: {
          document: {
            empresaId,
            idExterno: `MOV-ENT-${Date.now().toString(36)}`,
            tipo: TipoMovimiento.ENTRADA,
            insumoTipo: item.tipo,
            cantidad: item.cantidad,
            costoUnitarioUSD: item.costoUnitarioUSD,
            totalUSD: costoItem,
            referenciaIdExterno: dto.idExterno,
            creadoPor: uid,
          },
        },
      });
    }

    await this.movimientoModel.bulkWrite(operaciones);

    return {
      guardado: true,
      idExterno: dto.idExterno,
      totalItems: dto.items.length,
      totalCostoEstimado: Number(totalCosto.toFixed(2)),
    };
  }

  // ── Ajustes manuales ───────────────────────────────────────────────────

  async registrarAjuste(dto: RegistrarAjusteDto, user: any) {
    const empresaId = this.empresaId(user);
    const uid = this.usuarioId(user);

    const insumo = await this.insumoModel.findOne({
      empresaId,
      tipo: dto.tipo,
    });

    if (!insumo)
      throw new NotFoundException(`Insumo ${dto.tipo} no encontrado`);

    const nuevoStock = insumo.stockActual + dto.diferencia;

    if (nuevoStock < 0) {
      throw new BadRequestException('El ajuste dejaría stock negativo');
    }

    insumo.stockActual = nuevoStock;
    insumo.actualizadoPor = uid;
    await insumo.save();

    // Registrar movimiento
    const movimiento = new this.movimientoModel({
      empresaId,
      idExterno: `MOV-AJ-${Date.now().toString(36)}`,
      tipo: TipoMovimiento.AJUSTE,
      insumoTipo: dto.tipo,
      cantidad: Math.abs(dto.diferencia),
      motivo: dto.motivo,
      referenciaIdExterno: dto.motivo, // o algún id de conteo físico
      creadoPor: uid,
    });

    await movimiento.save();

    return {
      tipo: dto.tipo,
      diferencia: dto.diferencia,
      nuevoStock: nuevoStock,
      motivo: dto.motivo,
    };
  }

  // ── Movimientos / Kardex ───────────────────────────────────────────────

  async obtenerMovimientosPorInsumo(
    idExterno: string,
    filtros: { desde?: string; hasta?: string },
  ) {
    const insumo = await this.insumoModel.findOne({ idExterno });
    if (!insumo) throw new NotFoundException('Insumo no encontrado');

    const query: any = {
      insumoTipo: insumo.tipo,
    };

    if (filtros.desde) query.fechaCreacion = { $gte: new Date(filtros.desde) };
    if (filtros.hasta) {
      query.fechaCreacion = query.fechaCreacion || {};
      query.fechaCreacion.$lte = new Date(filtros.hasta);
    }

    return this.movimientoModel.find(query).sort({ fechaCreacion: -1 }).lean();
  }

  async obtenerResumenStock() {
    return this.insumoModel
      .find()
      .sort({ stockActual: 1 }) // primero los más bajos
      .select('tipo stockActual unidad costoPromedioUSD')
      .lean();
  }

  // Método auxiliar para ser llamado desde ViajesService.entregar()
  async registrarSalidaPorViaje(
    empresaId: string,
    viajeIdExterno: string,
    items: { insumo: InsumoTipo; cantidad: number }[],
    uid: string,
  ) {
    const operaciones: AnyBulkWriteOperation[] = [];

    for (const item of items) {
      const insumo = await this.insumoModel.findOne({
        empresaId,
        tipo: item.insumo,
      });

      if (!insumo || insumo.stockActual < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente de ${item.insumo}. Disponible: ${insumo?.stockActual ?? 0}`,
        );
      }

      operaciones.push({
        updateOne: {
          filter: { _id: insumo._id },
          update: {
            $inc: { stockActual: -item.cantidad },
            $set: { actualizadoPor: uid },
          },
        },
      });

      operaciones.push({
        insertOne: {
          document: {
            empresaId,
            idExterno: `MOV-SALVIAJE-${Date.now().toString(36)}`,
            tipo: TipoMovimiento.SALIDA_VIAJE,
            insumoTipo: item.insumo,
            cantidad: item.cantidad,
            referenciaIdExterno: viajeIdExterno,
            creadoPor: uid,
          },
        },
      });
    }

    await this.movimientoModel.bulkWrite(operaciones);
  }
}

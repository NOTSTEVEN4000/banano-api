import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { InsumoTipo } from '../../viajes/tipos/viaje.enums';

export type MovimientoInsumoDocument = HydratedDocument<MovimientoInsumo>;

export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA_VIAJE = 'SALIDA_VIAJE',
  AJUSTE = 'AJUSTE',
  DEVOLUCION = 'DEVOLUCION',
}

@Schema({ collection: 'movimientos_insumos', timestamps: { createdAt: 'fechaCreacion' } })
export class MovimientoInsumo {
  @Prop({ type: String, required: true }) empresaId: string;
  @Prop({ type: String, required: true }) idExterno: string;

  @Prop({ type: String, required: true, enum: Object.values(TipoMovimiento) })
  tipo: TipoMovimiento;

  @Prop({ type: String, required: true, enum: Object.values(InsumoTipo) })
  insumoTipo: InsumoTipo;

  @Prop({ type: Number, required: true }) cantidad: number; // siempre positiva

  @Prop({ type: Number }) costoUnitarioUSD?: number;
  @Prop({ type: Number }) totalUSD?: number;

  @Prop({ type: String }) referenciaIdExterno?: string; // viajeIdExterno, entradaIdExterno, etc.
  @Prop({ type: String }) motivo?: string;

  @Prop({ type: String, default: null }) creadoPor?: string | null;
}

export const MovimientoInsumoSchema = SchemaFactory.createForClass(MovimientoInsumo);
MovimientoInsumoSchema.index({ empresaId: 1, insumoTipo: 1, fechaCreacion: -1 });
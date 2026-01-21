import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { InsumoTipo } from '../../viajes/tipos/viaje.enums';

export type InsumoDocument = HydratedDocument<Insumo>;

@Schema({ collection: 'insumos', timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } })
export class Insumo {
  @Prop({ type: String, required: true }) empresaId: string;
  @Prop({ type: String, required: true, unique: true }) idExterno: string; // ej: INS-CARTON-001

  @Prop({ type: String, required: true, enum: Object.values(InsumoTipo) })
  tipo: InsumoTipo;

  @Prop({ type: String }) descripcion?: string;
  @Prop({ type: String, default: 'unidad' }) unidad: string;

  @Prop({ type: Number, default: 0, min: 0 }) stockActual: number;

  @Prop({ type: Number, default: 0 }) costoPromedioUSD: number;

  @Prop({ type: String, default: null }) creadoPor?: string | null;
  @Prop({ type: String, default: null }) actualizadoPor?: string | null;
}

export const InsumoSchema = SchemaFactory.createForClass(Insumo);
InsumoSchema.index({ empresaId: 1, idExterno: 1 }, { unique: true });
InsumoSchema.index({ empresaId: 1, tipo: 1 });
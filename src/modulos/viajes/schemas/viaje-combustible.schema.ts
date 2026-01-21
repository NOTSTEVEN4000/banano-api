import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ViajeCombustibleDocument = HydratedDocument<ViajeCombustible>;

@Schema({ collection: 'viaje_combustible', timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } })
export class ViajeCombustible {
  @Prop({ type: String, required: true }) empresaId: string;
  @Prop({ type: String, required: true }) idExterno: string;

  @Prop({ type: String, required: true }) viajeIdExterno: string;

  @Prop({ type: Date, required: true }) fechaHora: Date;
  @Prop({ type: Number, required: true, min: 0 }) montoUSD: number;
  @Prop({ type: Number, default: null }) litros?: number | null;
  @Prop({ type: String, default: null }) detalle?: string | null;

  @Prop({ type: String, default: null }) creadoPor?: string | null;
  @Prop({ type: String, default: null }) actualizadoPor?: string | null;
}

export const ViajeCombustibleSchema = SchemaFactory.createForClass(ViajeCombustible);
ViajeCombustibleSchema.index({ empresaId: 1, idExterno: 1 }, { unique: true });
ViajeCombustibleSchema.index({ empresaId: 1, viajeIdExterno: 1 });

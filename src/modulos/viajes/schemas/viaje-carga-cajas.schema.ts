import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ViajeCargaCajasDocument = HydratedDocument<ViajeCargaCajas>;

@Schema({ collection: 'viaje_cargas_cajas', timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } })
export class ViajeCargaCajas {
  @Prop({ type: String, required: true }) empresaId: string;
  @Prop({ type: String, required: true }) idExterno: string;

  @Prop({ type: String, required: true }) viajeIdExterno: string;

  @Prop({ type: String, required: true }) proveedorIdExterno: string;
  @Prop({ type: String, required: true }) haciendaIdExterno: string;

  @Prop({ type: Number, required: true, min: 0 }) cantidadCajas: number;

  @Prop({ type: Number, required: true, min: 0 }) costoCompraUnitario: number;
  @Prop({ type: String, default: 'USD' }) moneda: 'USD';

  @Prop({ type: Number, required: true, min: 0 }) totalCompra: number;

  // Opcional: si vendes directo
  @Prop({ type: String, default: null }) clienteIdExterno?: string | null;
  @Prop({ type: Number, default: null }) precioVentaUnitario?: number | null;
  @Prop({ type: Number, default: null }) totalVenta?: number | null;
  @Prop({ type: Number, default: null }) utilidadBruta?: number | null;

  @Prop({ type: String, default: null }) creadoPor?: string | null;
  @Prop({ type: String, default: null }) actualizadoPor?: string | null;
}

export const ViajeCargaCajasSchema = SchemaFactory.createForClass(ViajeCargaCajas);
ViajeCargaCajasSchema.index({ empresaId: 1, idExterno: 1 }, { unique: true });
ViajeCargaCajasSchema.index({ empresaId: 1, viajeIdExterno: 1 });
ViajeCargaCajasSchema.index({ empresaId: 1, haciendaIdExterno: 1 });

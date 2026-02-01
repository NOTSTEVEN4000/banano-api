import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PagoDocument = HydratedDocument<Pago>;

@Schema({ collection: 'pagos', timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } })
export class Pago {
  @Prop({ required: true }) empresaId: string;
  
  // ID Externo del documento de viaje_cargas_cajas
  @Prop({ required: true }) viajeCargaIdExterno: string;

  @Prop({ required: true, enum: ['PAGO_PROVEEDOR', 'COBRO_CLIENTE'] }) tipo: string;

  @Prop({ required: true, min: 0 }) monto: number;

  @Prop({ default: 'USD' }) moneda: string;

  @Prop({ type: String, enum: ['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE'], default: 'EFECTIVO' }) 
  metodoPago: string;

  @Prop() notas?: string;
}

export const PagoSchema = SchemaFactory.createForClass(Pago);
PagoSchema.index({ empresaId: 1, viajeCargaIdExterno: 1 });
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EstadoViaje, TipoDestino, TipoViaje } from '../tipos/viaje.enums';

export type ViajeDocument = HydratedDocument<Viaje>;

@Schema({ collection: 'viajes', timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } })
export class Viaje {
  @Prop({ type: String, required: true }) empresaId: string;
  @Prop({ type: String, required: true }) idExterno: string;

  @Prop({ type: String, required: true }) fecha: string; // YYYY-MM-DD
  @Prop({ type: String, required: true, enum: Object.values(TipoViaje) }) tipo: TipoViaje;
  @Prop({ type: String, required: true, enum: Object.values(EstadoViaje), default: EstadoViaje.CREADO })
  estado: EstadoViaje;

  @Prop({ type: String, required: true }) vehiculoIdExterno: string;

  @Prop({
    type: {
      tipoDestino: { type: String, required: true, enum: Object.values(TipoDestino) },
      haciendaIdExterno: { type: String, default: null },
      clienteIdExterno: { type: String, default: null },
      descripcion: { type: String, default: null },
    },
    required: true,
  })
  destino: any;

  @Prop({ type: Date, default: null }) fechaInicio?: Date | null;
  @Prop({ type: Date, default: null }) fechaFin?: Date | null;

  @Prop({ type: String, default: null }) notas?: string | null;

  @Prop({ type: Boolean, default: true }) activo: boolean;
  @Prop({ type: String, default: null }) creadoPor?: string | null;
  @Prop({ type: String, default: null }) actualizadoPor?: string | null;
}

export const ViajeSchema = SchemaFactory.createForClass(Viaje);
ViajeSchema.index({ empresaId: 1, idExterno: 1 }, { unique: true });
ViajeSchema.index({ empresaId: 1, fecha: 1 });
ViajeSchema.index({ empresaId: 1, estado: 1 });

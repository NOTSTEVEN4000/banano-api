import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HaciendaDocument = HydratedDocument<Hacienda>;

@Schema({ collection: 'haciendas', timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } })
export class Hacienda {
  @Prop({ type: String, required: true }) empresaId: string;
  @Prop({ type: String, required: true }) idExterno: string;

  @Prop({ type: String, required: true }) proveedorIdExterno: string;
  @Prop({ type: String, required: true }) nombre: string;

  @Prop({
    type: { referencia: String, parroquia: String, canton: String },
    default: { referencia: null, parroquia: null, canton: null },
  })
  ubicacion?: any;

  @Prop({ type: Boolean, default: true }) activo: boolean;
  @Prop({ type: String, default: null }) creadoPor?: string | null;
  @Prop({ type: String, default: null }) actualizadoPor?: string | null;
}

export const HaciendaSchema = SchemaFactory.createForClass(Hacienda);
HaciendaSchema.index({ empresaId: 1, idExterno: 1 }, { unique: true });
HaciendaSchema.index({ empresaId: 1, proveedorIdExterno: 1 });
HaciendaSchema.index({ empresaId: 1, nombre: 1 });

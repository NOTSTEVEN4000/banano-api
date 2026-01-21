import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { InsumoTipo } from '../tipos/viaje.enums';

export type ViajeInsumosDocument = HydratedDocument<ViajeInsumos>;

@Schema({ collection: 'viaje_insumos', timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } })
export class ViajeInsumos {
  @Prop({ type: String, required: true }) empresaId: string;
  @Prop({ type: String, required: true }) idExterno: string;

  @Prop({ type: String, required: true }) viajeIdExterno: string;
  @Prop({ type: String, required: true }) haciendaIdExterno: string;

  @Prop({
    type: [
      {
        insumo: { type: String, enum: Object.values(InsumoTipo) },
        cantidad: { type: Number, min: 0 },
      },
    ],
    default: [],
  })
  items: Array<{ insumo: InsumoTipo; cantidad: number }>;

  @Prop({ type: String, default: null }) creadoPor?: string | null;
  @Prop({ type: String, default: null }) actualizadoPor?: string | null;
}

export const ViajeInsumosSchema = SchemaFactory.createForClass(ViajeInsumos);
ViajeInsumosSchema.index({ empresaId: 1, idExterno: 1 }, { unique: true });
ViajeInsumosSchema.index({ empresaId: 1, viajeIdExterno: 1 }, { unique: true }); // 1 entrega de insumos por viaje

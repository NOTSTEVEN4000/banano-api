import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'logs_acceso',
  timestamps: { createdAt: 'fechaCreacion', updatedAt: false },
})
export class LogAcceso extends Document {
  @Prop({ type: String, required: true, default: 'empresa_001' })
  empresaId: string;

  @Prop({ type: String, default: null })
  usuarioId?: string;

  @Prop({ type: String, default: null })
  usuarioEntrada?: string;

  @Prop({ type: String, required: true, enum: ['OK', 'FAIL', 'BLOQUEADO'] })
  resultado: 'OK' | 'FAIL' | 'BLOQUEADO';

  @Prop({ type: String, default: null })
  motivo?: string;

  @Prop({ type: String, default: null })
  ip?: string;

  @Prop({ type: String, default: null })
  userAgent?: string;
}

export const LogAccesoSchema = SchemaFactory.createForClass(LogAcceso);
LogAccesoSchema.index({ empresaId: 1, fechaCreacion: -1 });
LogAccesoSchema.index({ usuarioId: 1, fechaCreacion: -1 });

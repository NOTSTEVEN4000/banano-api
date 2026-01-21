// schemas/cliente.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({
  collection: 'clientes',
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
})
export class Cliente extends Document {
  @Prop({ required: true })
  empresaId: string;

  @Prop({ required: true, unique: true })
  idExterno: string;

  @Prop({ required: true, uppercase: true, trim: true })
  nombre: string;

  @Prop()
  rucCi?: string;

  // Objetos anidados: usar type: Object o SchemaTypes.Mixed
  @Prop({ type: SchemaTypes.Mixed, required: true })
  contacto: {
    nombre: string;
    telefono: string;
    correo?: string;
  };

  @Prop({ type: SchemaTypes.Mixed, required: true })
  direccion: {
    provincia: string;
    ciudad: string;
    detalle: string;
  };

  @Prop({ type: SchemaTypes.Mixed, required: true })
  precio: {
    precioActual: number;
    moneda: string;
    historialPrecios: Array<{
      precio: number;
      desde: Date;
      hasta?: Date;
      motivo?: string;
      registradoPor?: string;
    }>;
  };

  @Prop({ type: SchemaTypes.Mixed })
  saldo?: {
    totalPorCobrar: number;
    totalCobrado: number;
    ultimaActualizacion?: Date;
  };

  @Prop({ default: 'Activo', enum: ['Activo', 'Inactivo'] })
  estado: 'Activo' | 'Inactivo';

  @Prop({ default: true })
  activo: boolean;

  @Prop()
  observaciones?: string;

  // Auditoría
  @Prop({ required: true })
  creadoPor: string;

  @Prop({ required: true })
  creadoPorCorreo: string;

  @Prop({ required: true })
  actualizadoPor: string;

  @Prop({ required: true })
  actualizadoPorCorreo: string;

  @Prop()
  eliminadoPor?: string;

  @Prop()
  eliminadoPorCorreo?: string;

  @Prop()
  fechaEliminacion?: Date;

  // Fechas automáticas (no las declares, timestamps las crea)
  fechaCreacion!: Date;
  fechaActualizacion!: Date;
}

export const ClienteSchema = SchemaFactory.createForClass(Cliente);

// Índices
ClienteSchema.index({ empresaId: 1, idExterno: 1 }, { unique: true });
ClienteSchema.index({ empresaId: 1, rucCi: 1 }, { 
  unique: true, 
  partialFilterExpression: { rucCi: { $exists: true, $ne: null } } 
});
ClienteSchema.index({ empresaId: 1, activo: 1 });
ClienteSchema.index({ empresaId: 1, nombre: 1 });
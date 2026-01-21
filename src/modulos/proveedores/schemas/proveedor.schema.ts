import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({
  collection: 'proveedores',
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
})
export class Proveedor extends Document {
  @Prop({ required: true })
  empresaId: string;

  @Prop({ required: true, unique: true })
  idExterno: string;

  @Prop({ required: true, uppercase: true, trim: true })
  nombre: string; // Ej: "HACIENDA CLOTILDE"

  @Prop({ default: 'HACIENDA' })
  tipo: 'HACIENDA' | 'OTRO';

  @Prop()
  rucCi?: string;

  // Contacto
  @Prop({ type: SchemaTypes.Mixed, required: true })
  contacto: {
    nombre: string;
    telefono: string;
    correo?: string;
  };

  // Dirección
  @Prop({ type: SchemaTypes.Mixed, required: true })
  direccion: {
    provincia: string;
    ciudad: string;
    detalle: string;
  };

  // Precio
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

  // Saldo
  @Prop({ type: SchemaTypes.Mixed })
  saldo?: {
    totalPorPagar: number;
    totalPagado: number;
    ultimaActualizacion?: Date;
  };

  // Condiciones
  @Prop({ type: SchemaTypes.Mixed })
  condiciones?: {
    formaPago: 'CONTADO' | 'CREDITO' | 'MIXTO';
    diasCredito?: number;
    moneda: string;
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
}

export const ProveedorSchema = SchemaFactory.createForClass(Proveedor);

// Índices para rendimiento
ProveedorSchema.index({ empresaId: 1, idExterno: 1 }, { unique: true });
ProveedorSchema.index({ empresaId: 1, activo: 1 });
ProveedorSchema.index({ empresaId: 1, nombre: 1 });
ProveedorSchema.index({ empresaId: 1, rucCi: 1 }, { 
  unique: true, 
  partialFilterExpression: { rucCi: { $exists: true, $ne: null } } 
});
ProveedorSchema.index({ empresaId: 1, 'precio.precioActual': 1 });
ProveedorSchema.index({ empresaId: 1, 'saldo.totalPorPagar': 1 });
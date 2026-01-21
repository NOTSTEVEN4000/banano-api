import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
})

export class Vehiculo extends Document {

  @Prop({ required: true })
  empresaId: string;

  @Prop({ required: true })
  idExterno: string;

  @Prop({ required: true, uppercase: true, trim: true })
  placa: string;

  @Prop({ required: true })
  nombre: string;

  @Prop({ type: Number, default: null })
  capacidadCajas: number | null;

    // Nuevos recomendados
  @Prop({ required: true })
  tipo: string;

  @Prop({ required: true })
  marca: string;

  @Prop({ required: true })
  modelo: string;

  @Prop({ type: Number })
  anio?: number;

  @Prop()
  color?: string;

  @Prop({ type: Number, default: 0 })
  kilometrajeActual?: number;

  @Prop()
  conductorAsignado?: string;

  @Prop()
  estado?: string; // Operativo, Mantenimiento, etc.

  @Prop({ default: true })
  activo: boolean;

  @Prop()
  conductorAsignadoNombre?: string;

  // Auditoría creación y actualización
  @Prop({ required: true })
  creadoPor: string;

  @Prop({ default: '' })
  creadoPorCorreo?: string;

  @Prop({ required: true })
  actualizadoPor: string;

  @Prop({ default: '' })
  actualizadoPorCorreo?: string;

  // Auditoría eliminación lógica
  @Prop()
  eliminadoPor?: string;

  @Prop()
  eliminadoPorCorreo?: string;

  @Prop({ type: Date })
  fechaEliminacion?: Date;

  @Prop()
  motivoEliminacion?: string;
}

export const VehiculoSchema = SchemaFactory.createForClass(Vehiculo);

// Índice único SIEMPRE (incluso inactivos)
VehiculoSchema.index(
  { empresaId: 1, placa: 1 },
  { unique: true }
);

// Índice único para idExterno
VehiculoSchema.index(
  { empresaId: 1, idExterno: 1 },
  { unique: true }
);
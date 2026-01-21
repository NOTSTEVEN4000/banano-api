import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RolUsuario } from '../../../comunes/tipos/roles.enum';

@Schema({ collection: 'usuarios', timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' } })
export class Usuario extends Document {
    @Prop({ required: true, unique: true })
    usuario: string;

    @Prop({ required: true, unique: true })
    correo: string;

    @Prop({ required: true })
    nombreCompleto: string;

    @Prop({ required: true })
    claveHash: string;

    @Prop({ type: [String], enum: Object.values(RolUsuario), default: [RolUsuario.LECTOR] })
    roles: RolUsuario[];

    @Prop({ default: true })
    activo: boolean;

    @Prop({ default: 'empresa_001' })
    empresaId: string;

    @Prop({ type: Number, default: 0 })
    intentosFallidos: number;

    @Prop({ type: Date, default: null })
    bloqueadoHasta: Date | null;

    @Prop({ type: Date, default: null })
    ultimoAcceso: Date | null;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

// Índices recomendados (extra, por seguridad)
UsuarioSchema.index({ usuario: 1 }, { unique: true });
UsuarioSchema.index({ correo: 1 }, { unique: true });
UsuarioSchema.index({ empresaId: 1, activo: 1 });

// src/proveedores/dto/crear-proveedor.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDate, IsArray, IsObject } from 'class-validator';

export class CrearProveedorDto {
  @IsString()
  @IsNotEmpty()
  idExterno: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum(['HACIENDA', 'OTRO'])
  @IsOptional()
  tipo?: 'HACIENDA' | 'OTRO' = 'HACIENDA';

  @IsString()
  @IsOptional()
  rucCi?: string;

  @IsObject()
  @IsNotEmpty()
  contacto: {
    nombre: string;
    telefono: string;
    correo?: string;
  };

  @IsObject()
  @IsNotEmpty()
  direccion: {
    provincia: string;
    ciudad: string;
    detalle: string;
  };

  @IsObject()
  @IsNotEmpty()
  precio: {
    precioActual: number;
    moneda: string;
    historialPrecios?: Array<{
      precio: number;
      desde: Date;
      hasta?: Date;
      motivo?: string;
      registradoPor?: string;
    }>;
  };

  @IsObject()
  @IsOptional()
  saldo?: {
    totalPorPagar: number;
    totalPagado: number;
    ultimaActualizacion?: Date;
  };

  @IsObject()
  @IsOptional()
  condiciones?: {
    formaPago: 'CONTADO' | 'CREDITO' | 'MIXTO';
    diasCredito?: number;
    moneda: string;
  };

  @IsEnum(['Activo', 'Inactivo'])
  @IsOptional()
  estado?: 'Activo' | 'Inactivo' = 'Activo';

  @IsOptional()
  activo?: boolean = true;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
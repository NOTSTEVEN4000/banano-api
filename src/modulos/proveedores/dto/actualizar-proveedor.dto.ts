// src/proveedores/dto/actualizar-proveedor.dto.ts

import { IsEnum, IsOptional, IsString, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ContactoUpdateDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  correo?: string;
}

class DireccionUpdateDto {
  @IsString()
  @IsOptional()
  provincia?: string;

  @IsString()
  @IsOptional()
  ciudad?: string;

  @IsString()
  @IsOptional()
  detalle?: string;
}

class PrecioUpdateDto {
  @IsNumber()
  @IsOptional()
  precioActual?: number;

  @IsString()
  @IsOptional()
  moneda?: string;

  // Si quieres permitir agregar al historial
  @IsOptional()
  historialPrecios?: Array<{
    precio: number;
    desde: Date;
    hasta?: Date;
    motivo?: string;
    registradoPor?: string;
  }>;
}

class SaldoUpdateDto {
  @IsNumber()
  @IsOptional()
  totalPorPagar?: number;

  @IsNumber()
  @IsOptional()
  totalPagado?: number;
}

class CondicionesUpdateDto {
  @IsEnum(['CONTADO', 'CREDITO', 'MIXTO'])
  @IsOptional()
  formaPago?: 'CONTADO' | 'CREDITO' | 'MIXTO';

  @IsNumber()
  @IsOptional()
  diasCredito?: number;

  @IsString()
  @IsOptional()
  moneda?: string;
}

export class ActualizarProveedorDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsEnum(['HACIENDA', 'OTRO'])
  @IsOptional()
  tipo?: 'HACIENDA' | 'OTRO';

  @IsString()
  @IsOptional()
  rucCi?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => ContactoUpdateDto)
  contacto?: ContactoUpdateDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => DireccionUpdateDto)
  direccion?: DireccionUpdateDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => PrecioUpdateDto)
  precio?: PrecioUpdateDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => SaldoUpdateDto)
  saldo?: SaldoUpdateDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => CondicionesUpdateDto)
  condiciones?: CondicionesUpdateDto;

  @IsEnum(['Activo', 'Inactivo'])
  @IsOptional()
  estado?: 'Activo' | 'Inactivo';

  @IsString()
  @IsOptional()
  observaciones?: string;
}
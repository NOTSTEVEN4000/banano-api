import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
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

export class ActualizarClienteDto {
  @IsString()
  @IsOptional()
  nombre?: string;

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

  @IsNumber()
  @IsOptional()
  precioActual?: number;

  @IsString()
  @IsOptional()
  moneda?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
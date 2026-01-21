import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ContactoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsOptional()
  correo?: string;
}

class DireccionDto {
  @IsString()
  @IsNotEmpty()
  provincia: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsNotEmpty()
  detalle: string;
}

export class CrearClienteDto {
  @IsString()
  @IsNotEmpty()
  idExterno: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  rucCi?: string;

  @ValidateNested()
  @Type(() => ContactoDto)
  contacto: ContactoDto;

  @ValidateNested()
  @Type(() => DireccionDto)
  direccion: DireccionDto;

  @IsNumber()
  precioActual: number;

  @IsString()
  @IsOptional()
  moneda?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
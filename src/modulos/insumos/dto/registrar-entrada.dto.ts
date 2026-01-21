import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InsumoTipo } from '../../viajes/tipos/viaje.enums';

class ItemEntradaDto {
  @IsNotEmpty()
  @IsEnum(InsumoTipo)
  tipo: InsumoTipo;

  @IsNumber()
  @Min(0)
  cantidad: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costoUnitarioUSD?: number;
}

export class RegistrarEntradaDto {
  @IsString()
  @IsNotEmpty()
  idExterno: string;

  @IsString()
  @IsOptional()
  proveedor?: string;

  @IsString()
  @IsOptional()
  numeroFactura?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemEntradaDto)
  items: ItemEntradaDto[];

  @IsString()
  @IsOptional()
  notas?: string;
}
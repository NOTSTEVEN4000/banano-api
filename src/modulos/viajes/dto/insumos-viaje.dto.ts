import { IsArray, IsEnum, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InsumoTipo } from '../tipos/viaje.enums';

class ItemInsumoDto {
  @IsEnum(InsumoTipo) insumo: InsumoTipo;
  @IsInt() @Min(0) cantidad: number;
}

export class RegistrarInsumosViajeDto {
  @IsString() @IsNotEmpty()
  idExterno: string; // id del documento viaje_insumos

  @IsString() @IsNotEmpty()
  haciendaIdExterno: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemInsumoDto)
  items: ItemInsumoDto[];
}

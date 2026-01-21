import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AgregarCombustibleDto {
  @IsString() @IsNotEmpty()
  idExterno: string;

  @IsDateString()
  fechaHora: string;

  @IsNumber() @Min(0)
  montoUSD: number;

  @IsOptional() @IsNumber() @Min(0)
  litros?: number;

  @IsOptional() @IsString()
  detalle?: string;
}

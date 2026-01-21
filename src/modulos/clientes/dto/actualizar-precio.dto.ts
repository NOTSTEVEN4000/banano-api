import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ActualizarPrecioDto {
  @IsNumber() @Min(0)
  precio: number;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsString()
  desdeIso?: string; // opcional, si quieres fecha
}

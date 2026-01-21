import { IsOptional, IsString } from 'class-validator';

export class EntregarViajeDto {
  @IsOptional() @IsString()
  observacion?: string;
}

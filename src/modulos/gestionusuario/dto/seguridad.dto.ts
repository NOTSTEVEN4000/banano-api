import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class SolicitarCodigoDto {
  @IsEmail() correo: string;
}

export class RestablecerConCodigoDto {
  @IsEmail() correo: string;
  @IsString() codigo: string;
  @IsString() @MinLength(6) nuevaClave: string;
}

export class CambiarClaveInternaDto {
  @IsString() claveAnterior: string;
  @IsString() nuevaClave: string;
}

export class AdminUpdateDto {
  @IsOptional() @IsString() nombreCompleto?: string;
  @IsOptional() @IsString() clave?: string;
  @IsOptional() roles?: string[];
  @IsOptional() activo?: boolean;
}
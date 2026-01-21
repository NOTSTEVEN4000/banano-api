import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  entrada: string; // usuario o correo

  @IsString()
  @IsNotEmpty()
  clave: string;
}

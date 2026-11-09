import { IsString, IsNotEmpty, IsEmail, IsOptional, MaxLength, Matches } from 'class-validator';

const NO_XSS_REGEX = /^[^<>]*$/;

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(NO_XSS_REGEX, { message: 'El nombre contiene caracteres o etiquetas HTML no permitidas.' })
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(120)
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Matches(NO_XSS_REGEX, { message: 'Tipo de consulta inválido.' })
  type?: string; // 'general' | 'commission' | 'inquiry'

  @IsString()
  @IsNotEmpty()
  @MaxLength(1500)
  @Matches(NO_XSS_REGEX, { message: 'El mensaje no puede contener etiquetas HTML ni scripts.' })
  message: string;
}

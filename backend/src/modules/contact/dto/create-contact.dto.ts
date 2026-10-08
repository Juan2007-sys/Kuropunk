import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  type?: string; // 'general' | 'commission' | 'inquiry'

  @IsString()
  @IsNotEmpty()
  message: string;
}

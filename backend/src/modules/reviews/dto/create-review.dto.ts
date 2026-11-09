import { IsString, IsNotEmpty, IsInt, Min, Max, MaxLength, Matches } from 'class-validator';

const NO_XSS_REGEX = /^[^<>]*$/;

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(NO_XSS_REGEX, { message: 'ID de producto inválido.' })
  productId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(NO_XSS_REGEX, { message: 'El nombre del autor no puede contener etiquetas HTML ni scripts.' })
  author: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  @Matches(NO_XSS_REGEX, { message: 'El comentario no puede contener etiquetas HTML ni scripts.' })
  comment: string;
}

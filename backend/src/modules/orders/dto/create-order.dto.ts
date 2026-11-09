import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsEmail,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsOptional,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// Rechaza etiquetas HTML / vectores XSS (<script>, <img onerror=...>, <svg>, etc.) sin penalización ReDoS
const NO_XSS_REGEX = /^[^<>]*$/;

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(NO_XSS_REGEX, { message: 'El ID del producto contiene caracteres no válidos.' })
  productId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(NO_XSS_REGEX, { message: 'El título del producto contiene caracteres no válidos.' })
  title: string;

  @IsNumber()
  @Min(0)
  @Max(50000000)
  price: number;

  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad mínima por pieza es 1.' })
  @Max(10, { message: 'Máximo 10 unidades por referencia.' })
  quantity: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(NO_XSS_REGEX)
  color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(NO_XSS_REGEX)
  size?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Matches(NO_XSS_REGEX)
  image?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Matches(NO_XSS_REGEX)
  tier?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  @MaxLength(60)
  @Matches(NO_XSS_REGEX)
  id?: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  @MaxLength(120)
  @Matches(NO_XSS_REGEX, { message: 'El nombre del cliente no puede contener etiquetas HTML ni scripts.' })
  customerName: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @MaxLength(150)
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Matches(NO_XSS_REGEX, { message: 'El teléfono contiene caracteres inválidos.' })
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección de entrega es obligatoria' })
  @MaxLength(300)
  @Matches(NO_XSS_REGEX, { message: 'La dirección no puede contener etiquetas HTML ni scripts.' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'La ciudad o municipio es obligatorio' })
  @MaxLength(100)
  @Matches(NO_XSS_REGEX, { message: 'La ciudad contiene caracteres inválidos.' })
  city: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(NO_XSS_REGEX)
  department?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  @Matches(NO_XSS_REGEX)
  neighborhood?: string;

  @IsString()
  @IsOptional()
  @MaxLength(400)
  @Matches(NO_XSS_REGEX, { message: 'Las notas de entrega no pueden contener etiquetas HTML ni scripts.' })
  deliveryNotes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  @Matches(NO_XSS_REGEX)
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  @Matches(NO_XSS_REGEX)
  country?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  shippingCost?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  total?: number;
}

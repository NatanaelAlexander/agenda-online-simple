import { ApiProperty } from '@nestjs/swagger';
import type { AuthSurface } from '../../types/auth.types.js';

export class AuthUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'admin@agenda.local' })
  email!: string;

  @ApiProperty({ example: 'Admin' })
  firstName!: string;

  @ApiProperty({ example: 'Sistema' })
  lastName!: string;

  @ApiProperty({ example: '+56912345678', nullable: true })
  phoneNumber!: string | null;

  @ApiProperty({ example: ['admin'], isArray: true })
  roles!: string[];

  @ApiProperty({
    example: ['internal'],
    isArray: true,
    description: 'Superficie HTTP: internal (panel)',
  })
  surfaces!: AuthSurface[];

  @ApiProperty({
    example: ['appointments:read', 'clients:read'],
    isArray: true,
  })
  permissions!: string[];

  @ApiProperty({ example: 1 })
  permVersion!: number;
}

export class AuthMeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ nullable: true })
  phoneNumber!: string | null;
}

export class AuthTokensResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 86400 })
  expiresIn!: number;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: 'Bearer';

  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;
}

export class AuthOkResponseDto {
  @ApiProperty({ example: true })
  ok!: true;
}

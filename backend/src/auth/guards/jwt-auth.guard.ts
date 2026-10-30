
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

type JwtPayload = {
  sub: number;
  role: 'USER' | 'ADMIN';
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: JwtPayload }
    >();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        'Authentication token is required',
      );
    }

    const [type, token, extra] = authorization.split(' ');

    if (type !== 'Bearer' || !token || extra) {
      throw new UnauthorizedException(
        'Invalid authorization header',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(
          token,
        );

      if (
        !Number.isInteger(payload.sub) ||
        !['USER', 'ADMIN'].includes(payload.role)
      ) {
        throw new UnauthorizedException('Invalid token payload');
      }

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired token',
      );
    }
  }
}

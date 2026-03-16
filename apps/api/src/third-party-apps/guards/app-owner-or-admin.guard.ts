import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AppOwnerOrAdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const appId = request.params.id;

    // Admin can access any app
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check if user owns the app
    const app = await this.prisma.thirdPartyApp.findFirst({
      where: {
        id: appId,
        ownerId: user.id,
      },
    });

    return !!app;
  }
}

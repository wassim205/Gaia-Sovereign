import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(userData: {
    username: string;
    email: string;
    password: string;
    encryptedMasterKey: string;
  }) {
    return this.prisma.user.create({
      data: userData,
    });
  }

  /**
   * Get all active (non-revoked) access tokens for a user
   * GS-126: List active accesses with app details
   */
  async getActiveAccesses(userId: string) {
    const tokens = await this.prisma.accessToken.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      select: {
        id: true,
        appId: true,
        approvedFields: true,
        expiresAt: true,
        createdAt: true,
        app: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add calculated properties
    return tokens.map((token) => ({
      ...token,
      isExpired: new Date() > token.expiresAt,
      appName: token.app?.name || 'Unknown App',
      appStatus: token.app?.status || 'UNKNOWN',
    }));
  }
}

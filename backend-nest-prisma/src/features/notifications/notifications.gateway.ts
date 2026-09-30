import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/database';
import type { UserPayload } from '@app/common';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const rawToken =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization;

      if (!rawToken) {
        this.logger.debug(`Anonymous client connected: ${client.id}`);
        return;
      }

      const token = rawToken.startsWith('Bearer ')
        ? rawToken.slice(7)
        : rawToken;

      const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
      const payload = this.jwtService.verify<UserPayload>(token, { secret });

      if (!payload?.userId) {
        client.disconnect();
        return;
      }

      client.data.user = payload;
      const userRoom = `user:${payload.userId}`;
      await client.join(userRoom);

      // Auto-join all followed mosque rooms for instant emergency & schedule broadcasts
      const followed = await this.prisma.mosqueFollower.findMany({
        where: { userId: payload.userId },
        select: { mosqueId: true },
      });

      for (const item of followed) {
        await client.join(`mosque:${item.mosqueId}`);
      }

      this.logger.log(
        `Authenticated socket connected: user ${payload.userId} (socket ${client.id}) joined ${followed.length} mosque rooms`,
      );
    } catch (err: any) {
      this.logger.warn(`Socket auth handshake failed (${client.id}): ${err?.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Socket disconnected: ${client.id}`);
  }

  sendToUser(userId: string, event: string, payload: any) {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  sendToMosque(mosqueId: string, event: string, payload: any) {
    if (!this.server) return;
    this.server.to(`mosque:${mosqueId}`).emit(event, payload);
  }
}

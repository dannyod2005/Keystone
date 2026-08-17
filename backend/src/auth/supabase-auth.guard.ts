// src/auth/supabase-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env for SupabaseAuthGuard to work',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        transport: ws as any,
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const token = authHeader?.split(' ')[1]; // "Bearer <token>"

    if (!token) throw new UnauthorizedException('No token provided');

    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid token');

    request.user = data.user;
    return true;
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { RequireTrainerGuard } from '../auth/require-trainer.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Provider, Profile])],
  controllers: [ProvidersController],
  providers: [ProvidersService, RequireTrainerGuard],
})
export class ProvidersModule {}

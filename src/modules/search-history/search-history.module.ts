import { Module, forwardRef } from '@nestjs/common';
import { SearchHistoryService } from './search-history.service';
import { SearchHistoryController } from './search-history.controller';
import { RedisCacheModule } from '../cache/cache.module';
import { UsersModule } from '../users/users.module';
import { SearchHistoryRepository } from './repositories/search-history.repository';

@Module({
  imports: [RedisCacheModule, forwardRef(() => UsersModule)],
  controllers: [SearchHistoryController],
  providers: [SearchHistoryService, SearchHistoryRepository],
  exports: [SearchHistoryService],
})
export class SearchHistoryModule {}

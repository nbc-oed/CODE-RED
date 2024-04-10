import { Module } from '@nestjs/common';
import { Crawling } from './news-crawling.service';

@Module({
  imports: [],
  providers: [Crawling],
  exports: [Crawling],
})
export class CrawlingModule {}

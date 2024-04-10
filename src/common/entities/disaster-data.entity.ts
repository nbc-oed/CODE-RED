import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseModel } from './base-model.entity';
import { DisasterAlertLevel } from '../types/disaster-alert-level.type';
import { DisasterLargeCategory } from '../types/disaster-large-category.type';
import { DisasterSmallCategory } from '../types/disaster-small-category.type';
import { NotificationMessages } from './notification-messages.entity';

@Entity({ name: 'disaster_data' })
export class DisasterData extends BaseModel {
  @Column({ type: 'text', nullable: false })
  locationName: string;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'varchar', nullable: false })
  send_platform: string;

  @Column({ type: 'timestamp', nullable: false })
  send_datetime: Date;

  // disaster_data_id  // true
  @OneToMany(() => NotificationMessages, (message) => message.disaster, {
    onDelete: 'CASCADE',
  })
  messages: NotificationMessages[];
}

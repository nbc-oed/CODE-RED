import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationCategory } from '../types/notification-messages-category.type';
import { Users } from './users.entity';
import { EmergencyData } from './emergency-data.entity';
import { DisasterData } from './disaster-data.entity';

@Entity({ name: 'notification_messages' })
export class NotificationMessages {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  message: string;

  @Column({ type: 'timestamptz', nullable: false })
  send_datetime: Date;

  @Column({ type: 'enum', enum: NotificationCategory, nullable: false })
  category: NotificationCategory;

  // user_id
  @Column({ name: 'user_id', type: 'int', nullable: false })
  user_id: number;

  @ManyToOne(() => Users, (user) => user.messages)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @CreateDateColumn()
  created_at: Date;

  // emergency_data_id
  @Column({ name: 'emergency_data_id', type: 'int', nullable: true })
  emergency_data_id: number;

  @ManyToOne(() => EmergencyData, (emergency) => emergency.messages)
  @JoinColumn({ name: 'emergency_data_id' })
  emergency: EmergencyData;

  // disaster_data_id

  @Column({ name: 'disaster_data_id', type: 'int', nullable: true })
  disaster_data_id: number;

  @ManyToOne(() => DisasterData, (disaster) => disaster.messages)
  @JoinColumn({ name: 'disaster_data_id' })
  disaster: DisasterData;
}

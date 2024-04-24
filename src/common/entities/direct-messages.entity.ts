import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'direct_messages' })
export class DirectMessages {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  room_name: string;

  @Column({ type: 'varchar', nullable: false })
  message: string;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @CreateDateColumn()
  created_at: Date;
}

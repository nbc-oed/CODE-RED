import {
  Column,
  Entity,
  Point,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'location' })
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  userId: number;

  @Column({ type: 'double', nullable: false })
  latitude: number;

  @Column({ type: 'double', nullable: false })
  longitude: number;

  @Column({ type: 'point', nullable: false })
  location: Point;

  @UpdateDateColumn()
  timeStamp: Date;
}

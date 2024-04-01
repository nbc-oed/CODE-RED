import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "./base-model.entity";
import { DisasterAlertLevel } from "../types/disaster-alert-level.type";
import { DisasterLargeCategory } from "../types/disaster-large-category.type";
import { DisasterSmallCategory } from "../types/disaster-small-category.type";
import { NotificationMessages } from "./notification-messages.entity";


  @Entity({ name: "disaster_data" })
  export class DisasterData extends BaseModel {

    @Column({ type: 'varchar', nullable: false })
    title: string;

    @Column({ type: 'varchar', nullable: false })
    message: string;

    @Column({ type: "enum", enum: DisasterLargeCategory, nullable: false })
    large_category: DisasterLargeCategory;

    @Column({ type: "enum", enum: DisasterSmallCategory, nullable: false })
    small_category: DisasterSmallCategory;

    @Column({ type: "enum", enum: DisasterAlertLevel, nullable: false })
    alert_level: DisasterAlertLevel;

    @Column({ type: 'varchar', nullable: false })
    send_platform: string;

    @Column({ type: 'date', nullable: false })
    send_datetime: Date;

    @Column({ type: 'int', nullable: false })
    receive_location_id: number;

    @Column({ type: 'varchar', nullable: false })
    receive_location_name: string;

    @DeleteDateColumn()
    deleted_at: Date;

    // disaster_data_id  // true
    @OneToMany(() => NotificationMessages, (message) => message.disaster, { onDelete: "CASCADE"})
    messages: NotificationMessages[];

  }
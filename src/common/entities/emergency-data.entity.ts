import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "./base-model.entity";
import { EmergencyLargeCategory } from "../types/emergency-large-category.type";
import { EmergencySmallCategory } from "../types/emergency-small-category.type";
import { EmergencyAlertLevel } from "../types/emergency-alert-level.type";
import { NotificationMessages } from "./notification-messages.entity";

  @Entity({ name: "emergency_data" })
  export class EmergencyData extends BaseModel{

    @Column({ type: 'varchar', nullable: false })
    title: string;

    @Column({ type: 'varchar', nullable: false })
    message: string;

    @Column({ type: "enum", enum: EmergencyLargeCategory, nullable: false })
    large_category: EmergencyLargeCategory;

    @Column({ type: "enum", enum: EmergencySmallCategory, nullable: false })
    small_category: EmergencySmallCategory;

    @Column({ type: "enum", enum: EmergencyAlertLevel, nullable: false })
    alert_level: EmergencyAlertLevel;

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

    // emergency_data_id // true
    @OneToMany(() => NotificationMessages, (message) => message.emergency, { onDelete: "CASCADE"})
    messages: NotificationMessages[];
  }
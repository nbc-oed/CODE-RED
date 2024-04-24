import { Column, Entity } from "typeorm";
import { BaseModel } from "./base-model.entity";

@Entity ({ name : 'destination'})
export class Destination extends BaseModel {
    @Column({ type : 'varchar', nullable : false })
    area_name : string

    @Column({ type : 'varchar', nullable : false })
    area_code : string

    @Column({ type : 'decimal', nullable : false })
    longitude : number

    @Column({ type : 'decimal', nullable : false })
    latitude : number
}
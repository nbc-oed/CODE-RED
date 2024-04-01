import { Column, Entity } from "typeorm";
import { BaseModel } from "./base-model.entity";

  @Entity({ name: "shelters" })
  export class Shelters extends BaseModel{
    // 대피소 등록일 필요할 것 같아서 BaseModel 상속 시킴

    @Column({ type: 'varchar', nullable: false })
    address: string;

    @Column({ type: 'varchar', nullable: false })
    facility_name: string;

    // 평수면 string, 수용 가능인원이면 number 타입이 좋을듯.
    @Column({ type: 'varchar', nullable: false })
    facility_area: string;

    @Column({ type: 'decimal', nullable: false })
    longitude: number;

    @Column({ type: 'decimal', nullable: false })
    latitude: number;

    @Column({ type: 'int', nullable: false })
    department_number: number;

  }
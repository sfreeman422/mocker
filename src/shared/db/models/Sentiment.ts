import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Sentiment {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  public userId!: string;

  @Column()
  public teamId!: string;

  @Column()
  public sentiment!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt!: Date;
}

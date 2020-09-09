import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SlackUser } from './SlackUser';
import { Item } from './Item';

@Entity()
export class UsedItem {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  @OneToMany(
    _type => SlackUser,
    slackUser => slackUser.id,
  )
  public usingUser!: number;

  @Column()
  @OneToMany(
    _type => SlackUser,
    slackUser => slackUser.id,
  )
  public usedOnUser!: number;

  @Column()
  @OneToMany(
    _type => Item,
    item => item.id,
  )
  public item!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt!: Date;
}
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  @Column({ type: 'text', default: 'learner' })
  role: string; // learner | trainer

  @Column({ type: 'text', nullable: true })
  goal: string | null;

  @Column({ type: 'int', default: 0 })
  streak: number;

  @Column({ name: 'daily_goal_min', type: 'int', default: 30 })
  dailyGoalMin: number;
}
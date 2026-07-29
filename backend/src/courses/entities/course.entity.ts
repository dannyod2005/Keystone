import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Course {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column()
  provider!: string;

  @Column()
  category!: string;

  @Column()
  level!: string;

  @Column()
  hours!: number;

  @Column()
  projects!: number;

  @Column('float')
  rating!: number;

  @Column()
  learners!: number;

  @Column()
  color!: string;

  @Column()
  blurb!: string;

  // Postgres array of plain strings — maps directly to a JS string[].
  @Column('text', { array: true })
  agenda!: string[];

  @Column()
  modules!: number;

  @Column('text', { array: true })
  credits!: string[];

  // Optional fields (added for trainer-authored video/FAQ content).
  // 'simple-json' stores this as a JSON blob in a single column — the
  // easiest option for now rather than creating separate related tables.
  @Column('simple-json', { nullable: true })
  videoUrls?: string[];

  @Column('simple-json', { nullable: true })
  faq?: { q: string; a: string }[];
}
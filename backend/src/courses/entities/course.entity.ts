import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CourseModule } from './course-module.entity';
import { CourseCredit } from './course-credit.entity';
import { CourseFaq } from './course-faq.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  provider: string;

  @Column()
  category: string; // Technical | Business | Leadership

  @Column()
  level: string; // Beginner | Intermediate | Advanced

  // #297 — was a whole-hour int; trainers authoring a short course (e.g. 5
  // modules of ~20min video each) had no way to enter anything between 1h
  // and 2h, so the estimate suggestion below always rounded away from the
  // real figure. `real` (not `decimal`/`numeric`) deliberately: TypeORM
  // returns decimal/numeric columns as strings to avoid float-precision
  // loss on values that need it, but every consumer of this field
  // (EnrollmentsService's points calc, CourseAnalyticsService's pace calc)
  // does plain arithmetic on it and expects a JS number — `real` maps
  // straight to one. See AllowFractionalCourseHours migration.
  //
  // #306 — "no meaningful precision loss to guard against" above turned
  // out wrong: `real` is single-precision float, and only exact binary
  // fractions (quarter-hours: 0.25, 0.5, 0.75, ...) round-trip through it
  // cleanly. A value like 8.1 or 4.33 — which nothing stops a trainer
  // from typing directly into the Hours field, since the 0.25 step is a
  // frontend nudge, not a hard constraint, and the backend only validates
  // maxDecimalPlaces: 2 — comes back as 8.100000381469727 or
  // 4.329999923706055, and was displayed exactly that way (Catalogue,
  // Course Info, learning-path detail, Home, Trainer Studio's course
  // list all render this field with no rounding). The transformer below
  // rounds to 2dp on every read, fixing it at the one place every one of
  // those display sites (and every points/pace-calc consumer) actually
  // gets the value from — no frontend changes needed.
  @Column({
    type: 'real',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: number) => Math.round(Number(value) * 100) / 100,
    },
  })
  hours: number;

  @Column({ type: 'decimal', nullable: true })
  rating: number | null;

  @Column({ type: 'int', default: 0 })
  learners: number;

  @Column()
  color: string; // ink | gold | success | coral

  @Column({ type: 'text', nullable: true })
  blurb: string | null;

  // #226 — free-text skill tags ("Git", "SQL", "Negotiation"), a finer
  // classification than the 3 broad categories above. `simple-array`
  // stores this as a single comma-joined text column and TypeORM
  // transparently joins/splits it into a real string[] on save/read —
  // see the migration comment for why a plain column rather than a
  // separate table. Trainer-settable via the course editor's tag input;
  // never populated any other way.
  @Column({ type: 'simple-array', default: '' })
  skills: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Deliberately a plain column, not @DeleteDateColumn — see the migration
  // comment for why: TypeORM's built-in soft-delete auto-filters this
  // entity out of every join, which would hide an already-enrolled
  // learner's course from their own dashboard. Filtering is applied
  // explicitly in CoursesService instead, only where it belongs.
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  // #137 — the trainer who created this course. Nullable only because
  // seeded/mock courses (src/seeds/seed-courses.ts, #109) predate
  // ownership tracking and have no real owner to backfill; every course
  // created via CoursesService.create always has this stamped
  // server-side. NULL is treated as "legacy, exempt from the ownership
  // check" by RequireCourseOwnerGuard, never as "unowned and therefore
  // editable by no one".
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  // #137 — optional group ownership. When set, any profile sharing this
  // providerId also gets edit rights on top of ownerId. Purely an opt-in
  // upgrade: creating a course never requires belonging to a provider.
  @Column({ name: 'provider_id', type: 'uuid', nullable: true })
  providerId: string | null;

  @OneToMany(() => CourseModule, (m) => m.course, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  modules: CourseModule[];

  @OneToMany(() => CourseCredit, (c) => c.course, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  credits: CourseCredit[];

  @OneToMany(() => CourseFaq, (f) => f.course, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  faqs: CourseFaq[];
}

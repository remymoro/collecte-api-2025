// src/modules/collectes/entities/collecte.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, Unique, Index,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn
} from 'typeorm';
import { CollecteStatus } from '../enums/collecte-status.enum';

@Entity('collectes')
@Unique('UQ_collecte_year', ['year'])
export class Collecte {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  year: number; // ex: 2025

  @Column({ length: 160, nullable: true })
  title?: string ;

  @Column({ length: 180, nullable: true, unique: true })
  slug?: string ;

  // Fenêtre par défaut (mars)
  @Column({ type: 'datetime', nullable: true }) defaultStartAt?: Date | null;
  @Column({ type: 'datetime', nullable: true }) defaultEndAt?: Date | null;

  // Saisie tardive autorisée jusqu’à…
  @Column({ type: 'datetime', nullable: true }) graceUntil?: Date | null;

  // Verrou technique (aucune saisie après)
  @Column({ type: 'datetime', nullable: true }) lockedAt?: Date | null;

  @Column({ type: 'varchar', length: 16, default: CollecteStatus.SCHEDULED })
  status: CollecteStatus;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn({ nullable: true }) deletedAt?: Date | null;
}

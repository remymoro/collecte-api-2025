// src/modules/collectes/entities/collecte-magasin.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn,
  RelationId, CreateDateColumn, UpdateDateColumn, Check, Index
} from 'typeorm';
import { Collecte } from './collecte.entity';
import { Magasin } from '../../magasins/entities/magasin.entity';

@Entity('collecte_magasins')
@Unique('UQ_collecte_magasin', ['collecte', 'magasin'])
@Check(`"startAt" IS NULL OR "endAt" IS NULL OR "startAt" <= "endAt"`)
export class CollecteMagasin {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Collecte, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'collecteId' })
  collecte: Collecte;


  
  @RelationId((cm: CollecteMagasin) => cm.collecte)
  collecteId: number;

  @ManyToOne(() => Magasin, m => m.collectes, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'magasinId' })
  magasin: Magasin;

  @RelationId((cm: CollecteMagasin) => cm.magasin)
  magasinId: number;

  // Opt-in
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  // Overrides locaux (sinon on prend defaultStart/End de la Collecte)
  @Column({ type: 'datetime', nullable: true }) startAt?: Date | null;
  @Column({ type: 'datetime', nullable: true }) endAt?: Date | null;
  @Column({ type: 'datetime', nullable: true }) graceUntil?: Date | null;

  // Validation finale pour ce magasin
  @Column({ type: 'datetime', nullable: true }) validatedAt?: Date | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

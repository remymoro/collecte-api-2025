import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, ManyToOne, JoinColumn, RelationId, Unique, OneToMany } from 'typeorm';
import { Centre } from '../../centres/entities/centre.entity';
import { Exclude } from 'class-transformer';
import { CollecteMagasin } from 'src/modules/collecte/entities/collecte-magasin.entity';

@Entity('magasins')
@Unique('UQ_magasin_centre_address', ['centre', 'address']) // adresse unique pour un centre donné
export class Magasin {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ length: 120 })
  name: string;

  @Column({ length: 255 })
  address: string;

  @Column({ nullable: true, length: 30 })
  phone?: string;

  @Column({ nullable: true, unique: true, length: 180 })
  email?: string;

  @Column({ nullable: true, unique: true, length: 100 })
  externalRef?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => CollecteMagasin, cm => cm.magasin)
  collectes: CollecteMagasin[];

  @ManyToOne(() => Centre, (centre) => centre.magasins, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'centreId' })
  @Exclude() // ne pas sérialiser l’objet centre
  centre: Centre;

  // Accès direct à l’id du centre (pratique côté DTO/réponses)
  @RelationId((m: Magasin) => m.centre)
  centreId: number;

  
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Unique, OneToMany } from 'typeorm';
import { Magasin } from '../../magasins/entities/magasin.entity';

// Unicité simple + éventuelle unicité composite (ex: même nom+adresse interdit)
// @Unique(['name', 'address'])
@Entity('centres')
export class Centre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() name: string;
  @Column() address: string;

  @Column({ nullable: true, unique: true }) email?: string;
  @Column({ nullable: true, unique: true }) externalRef?: string;
  @Column({ nullable: true, length: 20 })
  phone?: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn({ nullable: true }) deletedAt?: Date | null;

  @OneToMany(() => Magasin, (magasin) => magasin.centre)
  magasins: Magasin[];
}

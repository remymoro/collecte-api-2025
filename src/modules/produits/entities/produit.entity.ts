import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('produits')
export class Produit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 14 })
  gtin: string; // EAN/GTIN conservé en string

  @Column({ length: 32 })
  family: string; // ex: "PROTIDIQUE"

  @Column({ length: 32 })
  subFamily: string; // ex: "CONSERVE_VIANDE"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date | null;
}
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn
} from 'typeorm';
import { Magasin } from '../../magasins/entities/magasin.entity';
import { Produit } from '../../produits/entities/produit.entity';
import { Centre } from '../../centres/entities/centre.entity';
import { Collecte } from 'src/modules/collecte/entities/collecte.entity';

@Entity('collecte_saisies')
export class CollecteSaisie {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Collecte, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collecteId' })
  collecte: Collecte;
  @Column() collecteId: number;

  @ManyToOne(() => Magasin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'magasinId' })
  magasin: Magasin;
  @Column() magasinId: number;

  @ManyToOne(() => Produit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produitId' })
  produit: Produit;
  @Column() produitId: number;

  @ManyToOne(() => Centre, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'centreId' })
  centre: Centre;
  @Column() centreId: number;

  @Column('float')
  poids: number;

  @CreateDateColumn()
  createdAt: Date;
}

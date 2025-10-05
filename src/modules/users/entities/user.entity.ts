

// Entité User : représente un utilisateur de l'application (admin, centre, bénévole)
// Version avancée avec index, hooks de validation, et sécurité renforcée
import {
  Check, JoinColumn, ManyToOne, Column, Entity, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index,
  BeforeInsert, BeforeUpdate,
} from 'typeorm';
import { Centre } from '../../centres/entities/centre.entity';


/**
 * @Check : contrainte d'intégrité sur le rôle et le centre associé
 * - Un ADMIN ne doit pas être rattaché à un centre (centreId NULL)
 * - Un CENTRE ou VOLUNTEER doit obligatoirement être rattaché à un centre (centreId NOT NULL)
 */

/**
 * Contraintes et index avancés pour garantir la cohérence et la performance :
 * - @Check : cohérence rôle/centre (ADMIN sans centre, autres avec centre)
 * - @Index : unicité du login parmi les utilisateurs non supprimés (soft delete)
 * - Index sur centreId, role, deletedAt, isActive pour accélérer les requêtes fréquentes
 */
@Check(
  'chk_users_role_centre',
  `(
     role = 'ADMIN' AND centreId IS NULL
   ) OR (
     role IN ('CENTRE','VOLUNTEER') AND centreId IS NOT NULL
   )`
)
@Index('uq_users_login_deleted', ['login', 'deletedAt'], { unique: true })
@Index('ix_users_centre', ['centreId'])
@Index('ix_users_role', ['role'])
@Index('ix_users_deleted', ['deletedAt'])
@Index('ix_users_active', ['isActive'])
@Entity('users')
export class User {
  /**
   * Identifiant unique auto-incrémenté (clé primaire)
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Login de l'utilisateur (nom d'utilisateur, unique parmi les non supprimés)
   * - Plus de unique: true, on passe par l'index composite pour gérer le soft delete
   */
  @Column({ type: 'varchar', length: 120 })
  login: string;

  /**
   * Hash du mot de passe (jamais le mot de passe en clair !)
   * - select: false => jamais exposé par défaut dans les requêtes
   */
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  /**
   * Rôle de l'utilisateur :
   * - ADMIN : administrateur global
   * - CENTRE : responsable de centre
   * - VOLUNTEER : bénévole rattaché à un centre
   */
  @Column({ type: 'enum', enum: ['ADMIN', 'CENTRE', 'VOLUNTEER'], default: 'VOLUNTEER' })
  role: 'ADMIN' | 'CENTRE' | 'VOLUNTEER';

  /**
   * Identifiant du centre auquel l'utilisateur est rattaché (nullable pour ADMIN)
   */
  @Column({ type: 'int', nullable: true })
  centreId: number | null;

  /**
   * Relation ManyToOne avec l'entité Centre
   * - Un utilisateur peut être rattaché à un centre (sauf ADMIN)
   * - On restreint la suppression d'un centre si des users y sont rattachés
   */
  @ManyToOne(() => Centre, { nullable: true, onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'centreId' })
  centre?: Centre | null;

  /**
   * Statut actif/inactif de l'utilisateur (soft delete, suspension, etc.)
   */
  @Column({ type: 'tinyint', default: true })
  isActive: boolean;

  /**
   * Date/heure de dernière connexion (pour audit, statistiques, etc.)
   */
  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date | null;

  /**
   * Date de création de l'utilisateur (gérée automatiquement par TypeORM)
   */
  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt: Date;

  /**
   * Date de dernière modification (gérée automatiquement par TypeORM)
   */
  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt: Date;

  /**
   * Date de suppression logique (soft delete)
   * - Utilise DeleteDateColumn pour la compatibilité avec les méthodes soft-remove de TypeORM
   */
  @DeleteDateColumn({ type: 'datetime', precision: 6, nullable: true })
  deletedAt: Date | null;

  // ---------- garde-fous applicatifs (100% ORM) ----------

  /**
   * Hook TypeORM : avant insertion ou update, normalise le login et vérifie la cohérence rôle/centre
   * - login : trim et minuscule pour éviter les doublons cachés
   * - ADMIN ne doit pas avoir de centre
   * - CENTRE/VOLUNTEER doivent avoir un centre
   * - Lève une erreur explicite si incohérence
   */
  @BeforeInsert()
  @BeforeUpdate()
  normalizeAndGuard() {
    if (this.login) this.login = this.login.trim().toLowerCase();

    const needsCentre = this.role === 'CENTRE' || this.role === 'VOLUNTEER';
    if (this.role === 'ADMIN' && this.centreId !== null && this.centreId !== undefined) {
      throw new Error('ADMIN must not be attached to a centre');
    }
    if (needsCentre && (this.centreId === null || this.centreId === undefined)) {
      throw new Error(`${this.role} must be attached to a centre`);
    }
  }
}

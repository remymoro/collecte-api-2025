import { MagasinResponse } from 'src/modules/magasins/interfaces/centre-response.interface';
import { CentreResponse } from './centre-response.interface';

/**
 * Interface enrichie représentant un centre et tous ses magasins associés.
 * Hérite de CentreResponse pour réutiliser les champs communs.
 */
export interface CentreWithMagasins extends CentreResponse {
  magasins: MagasinResponse[];
}

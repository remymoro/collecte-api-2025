export interface PaginationQuery {
  page?: number;      // numéro de page (défaut: 1)
  limit?: number;     // nombre d'items par page (défaut: 20)
  search?: string;    // recherche texte optionnelle
  sort?: string;      // champ de tri
  order?: 'ASC' | 'DESC'; // ordre de tri
  [key: string]: any; // autres filtres dynamiques
}
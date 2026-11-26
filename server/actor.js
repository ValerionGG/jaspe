// Qui agit ? Module pur (partagé avec la version statique dans le navigateur).
// Par défaut : le personnage de démonstration. Le serveur en mode comptes branche une source
// qui renvoie le nom de l’utilisateur connecté pour la requête en cours (ou « Jaspe » pour les routines).
let source = () => 'Claire Delmas'
export const actor = () => source() || 'Claire Delmas'
export const setActorSource = (fn) => { source = fn }

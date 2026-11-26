import { useMe } from './store'
import { me as DEMO_ME } from './mock'

/**
 * Qui est connecté. En mode comptes, l’identité vient du serveur (/api/me) et `real` vaut true :
 * les écrans n’affichent alors ni personnes, ni chiffres, ni dates de démonstration.
 * En démo (sans JASPE_AUTH) ou en version statique, on garde le personnage de démo.
 */
export type Identity = {
  real: boolean
  userId: string
  name: string
  firstName: string
  role: string
  photo?: string
  orgName: string
  /** Ligne sous le nom de l’agence (réseau en démo, pays ou formule en compte réel). */
  orgSub: string
  country: 'FR' | 'PT'
}

export function useIdentity(): Identity {
  const acc = useMe()
  if (acc?.mode === 'auth') {
    const name = acc.user.name || acc.user.email
    return {
      real: true,
      userId: acc.user.id,
      name,
      firstName: name.split(/\s+/)[0],
      role: acc.user.role === 'owner' ? 'Responsable d’agence' : 'Conseiller',
      orgName: acc.org.name,
      orgSub: `${acc.org.country === 'PT' ? 'Portugal' : 'France'} · ${acc.plan.label}`,
      country: acc.org.country === 'PT' ? 'PT' : 'FR',
    }
  }
  return {
    real: false,
    userId: DEMO_ME.id,
    name: DEMO_ME.name,
    firstName: DEMO_ME.name.split(' ')[0],
    role: DEMO_ME.role,
    photo: DEMO_ME.photo,
    orgName: 'Antibes Vieille-Ville',
    orgSub: '',
    country: 'FR',
  }
}

/** Initiales pour un avatar sans photo. */
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

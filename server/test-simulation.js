// Bêta-test simulé : 6 conseillers virtuels (FR et PT) font tout le parcours sans aucune erreur.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('simulation : parcours complet de 6 conseillers sans erreur, sans NaN ni undefined', () => {
  const out = execFileSync(process.execPath, ['--no-warnings', 'simulate-beta.js', '6'], { cwd: import.meta.dirname, encoding: 'utf8', timeout: 120000 })
  assert.match(out, /Aucun : tous les parcours sont allés au bout sans erreur/, out.split('## Problèmes')[1])
  assert.match(out, /Gain net moyen : \*\*\d+ h \d\d/)
})

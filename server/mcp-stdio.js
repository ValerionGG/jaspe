#!/usr/bin/env node
// Serveur MCP Jaspe en stdio (Claude Desktop, Claude Code…) : `node server/mcp-stdio.js`.
// Base : démo (server/data/jaspe.sqlite), celle d'une agence avec JASPE_ORG=org_xxx, ou un fichier avec JASPE_DB.
// stdout est réservé au protocole : aucun console.log ici, les messages vont sur stderr.
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { openDb } from './db.js'
import { createEngine } from './engine.js'
import { orgPaths } from './auth.js'
import { createMcpServer } from './mcp.js'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.JASPE_DATA ?? join(here, 'data')
const org = process.env.JASPE_ORG
const dbPath = process.env.JASPE_DB ?? (org ? orgPaths(dataDir, join(dataDir, 'files'), org).dbPath : join(dataDir, 'jaspe.sqlite'))

const db = openDb(dbPath)
// Pas de tick : les routines tournent dans le serveur web, pas ici.
const engine = createEngine(db, () => {})
const server = createMcpServer({ engine, db, user: { name: 'MCP · poste local' } })
await server.connect(new StdioServerTransport())
console.error(`Jaspe MCP (stdio) prêt · base ${org ? `agence ${org}` : dbPath}`)

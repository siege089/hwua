import pg from 'pg'
import { v4 as uuidv4 } from 'uuid';


const { Pool } = pg

const {
    randomBytes,
    createHmac
} = await import('crypto');

import dotenv from 'dotenv'
dotenv.config()

const SALT_LEN = 16

const poolConfig = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST_DOCKER || process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
}
const pool = new Pool(poolConfig)

let playersCache = []

const generateSalt = () => {
    return randomBytes(Math.ceil(SALT_LEN / 2)).toString('hex').slice(0, SALT_LEN)
}

const hashPassword = (password, salt) => {
    let hash = createHmac('sha512', salt)
    hash.update(password)
    return hash.digest('hex')
}

const playerMapping = (player) => {
    return {
        player_id: player.player_id,
        username: player.username,
        salt: player.salt,
        password: player.password,
        created_at: player.created_at
    }
}

const gameMapping = async (game) => {
    return {
        game_id: game.game_id,
        player_id: game.player_id,
        complete: game.complete,
        properties: game.properties,
        created_at: game.created_at,
        moves: await findMoves(game.game_id),
        creator: await findPlayer(game.player_id),
        players: await Promise.all(game.properties.players.map(async player_id => await findPlayer(player_id))),
        winner: await findPlayer(game.properties.winner)
    }
}

const gameMappingSimple = async (game) => {
    return {
        game_id: game.game_id,
        player_id: game.player_id,
        complete: game.complete,
        properties: game.properties,
        created_at: game.created_at,
        creator: await findPlayer(game.player_id)
    }
}

const moveMapping = async (move) => {
    return {
        move_id: move.move_id,
        game_id: move.game_id,
        player_id: move.player_id,
        position_x: move.position_x,
        position_y: move.position_y,
        created_at: move.created_at,
        player: await findPlayer(move.player_id)
    }
}

export async function reloadPlayers() {
    const { rows } = await pool.query('SELECT * FROM player')
    if (rows.length === 0)
        playersCache = []
    playersCache = rows.map(row => playerMapping(row))
}

export async function findUser(username) {
    return playersCache.find(player => player.username === username)
}

export async function findPlayer(player_id) {
    return playersCache.find(player => player.player_id === player_id)
}

export async function createUser(username, password) {
    const player_id = uuidv4()
    const salt = generateSalt()
    const hashedPassword = hashPassword(password, salt)
    await pool.query('INSERT INTO player(player_id, username, salt, password) VALUES ($1, $2, $3, $4)', [player_id, username, salt, hashedPassword])
    await reloadPlayers()
    return player_id
}

export async function signinUser(username, password) {
    const user = await findUser(username)
    if (user === undefined)
        return undefined
    const hashedPassword = hashPassword(password, user.salt)
    if (user.password === hashedPassword)
        return user
    return undefined
}

export async function getIncompleteGames(player_id) {
    const { rows } = await pool.query('SELECT * FROM game WHERE complete = false AND player_id = $1', [player_id])
    if (rows.length === 0)
        return undefined
    return await Promise.all(rows.map(async row => await gameMapping(row)))
}

export async function createGame(player_id) {
    const game_id = uuidv4()
    const properties = {
        players: [player_id]
    }
    await pool.query('INSERT INTO game(game_id, player_id, properties) VALUES ($1, $2, $3)', [game_id, player_id, properties])
    return game_id
}

export async function findGame(game_id) {
    const { rows } = await pool.query('SELECT * FROM game WHERE game_id = $1', [game_id])
    if (rows.length === 0)
        return undefined
    return await gameMapping(rows[0])
}

export async function findMoves(game_id) {
    const { rows } = await pool.query('SELECT * FROM move WHERE game_id = $1 ORDER BY created_at asc', [game_id])
    if (rows.length === 0)
        return []
    return await Promise.all(rows.map(async row => await moveMapping(row)))
}

export async function saveGame(game) {
    await pool.query('UPDATE game SET complete = $2, properties = $3 WHERE game_id = $1', [game.game_id, game.complete, game.properties])
}

export async function saveMove(game_id, player_id, position_x, position_y) {
    const move_id = uuidv4()
    await pool.query('INSERT INTO move(move_id, game_id, player_id, position_x, position_y) VALUES ($1, $2, $3, $4, $5)', [move_id, game_id, player_id, position_x, position_y])
    return move_id
}

export async function findMove(move_id) {
    const { rows } = await pool.query('SELECT * FROM move WHERE move_id = $1', [move_id])
    if (rows.length === 0)
        return undefined
    return await moveMapping(rows[0])
}

export async function getOpenGames() {
    const { rows } = await pool.query(`WITH cte_num_players (game_id, num_players) AS (
        SELECT game_id, json_array_length(json(properties->>'players')) from game
      )
      SELECT g.* FROM game g JOIN cte_num_players n ON g.game_id = n.game_id
      WHERE num_players = 1`)
    if (rows.length === 0)
        return []
    return await Promise.all(rows.map(async row => await gameMappingSimple(row)))
}
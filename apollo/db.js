import pg from 'pg'
import { v4 as uuidv4 } from 'uuid';

import dotenv from 'dotenv'

const { Pool } = pg

const {
    randomBytes,
    createHmac
} = await import('crypto');

dotenv.config()

const SALT_LEN = 16

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST_DOCKER || process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT
})

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
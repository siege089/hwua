import { ApolloServer } from 'apollo-server'
import { importSchema } from 'graphql-import'
import { resolvers } from './resolvers.js'
import jsonwebtoken from 'jsonwebtoken'
const { decode } = jsonwebtoken


import dotenv from 'dotenv'
dotenv.config()

const typeDefs = importSchema('schema.gql')

import * as DB from "./db.js";
await DB.reloadPlayers()

const getPayload = (token) => {
    if (token === undefined || !token.startsWith('Bearer '))
        throw new Error('invalid token')
    token = token.substring('Bearer '.length)
    return decode(token, process.env.JWT_SECRET)
}

const context = async ({ req, res }) => {
    let user = undefined
    try {
        const payload = getPayload(req.headers.authentication)
        user = await DB.findPlayer(payload.id);
    } catch { }

    let game = undefined
    try {
        const payload = getPayload(req.headers.authorization)
        game = await DB.findGame(payload.game_id);
    } catch { }

    return { user, game };
}

const server = new ApolloServer({ typeDefs, resolvers, context });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
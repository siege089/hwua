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

const context = ({ req, res }) => {
    let user = null
    try {
        let token = req.headers.authentication || '';
        token = token.substring('Bearer '.length)
        user = DB.findPlayer(token);
    } catch { }

    return { user };
}

const server = new ApolloServer({ typeDefs, resolvers, context });

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
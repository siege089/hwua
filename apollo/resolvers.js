import { ApolloError } from 'apollo-server'
import jsonwebtoken from 'jsonwebtoken'
const { sign } = jsonwebtoken
import * as DB from "./db.js";

export const resolvers = {
  Query: {
    loginUser: async (root, args) => {
      const user = await DB.signinUser(args.player.username, args.player.password)
      if (user === undefined)
        return {
          status: false,
          token: null
        }
      return {
        status: true,
        token: sign({
          id: user.player_id,
          username: user.username
        }, process.env.JWT_SECRET,
          {
            expiresIn: '1h'
          }),
        player: user
      }
    }
  },
  Mutation: {
    registerPlayer: async (root, args) => {
      const { username, password, confirm_password } = args.new_player
      if (password !== confirm_password)
        return new ApolloError("Passwords do not match")
      const user = await DB.findUser(username)
      if (user !== undefined)
        return new ApolloError("Username already exists")
      await DB.createUser(username, password)
      return await DB.findUser(username)
    }
  }
};
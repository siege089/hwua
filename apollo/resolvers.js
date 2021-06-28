import { ApolloError } from 'apollo-server'
import jsonwebtoken from 'jsonwebtoken'
const { sign } = jsonwebtoken
import * as DB from "./db.js";

const requiresUser = (context) => {
  if (context.user === undefined)
    throw new ApolloError("Forbidden", "403")
  return context.user.player_id
}

const requiresGame = (context) => {
  if (context.game === undefined)
    throw new ApolloError("Unauthorized", "401")
  return context.game.game_id
}

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
    },
    registerGame: async (root, args, context) => {
      const player_id = requiresUser(context)
      const incompleteGames = await DB.getIncompleteGames(player_id)
      if (incompleteGames !== undefined)
        return {
          ...incompleteGames[0],
          token: sign({
            game_id: incompleteGames[0].game_id,
          }, process.env.JWT_SECRET)
        }
      const game_id = await DB.createGame(player_id)
      return {
        ...await DB.findGame(game_id),
        token: sign({
          game_id: game_id,
        }, process.env.JWT_SECRET)
      }
    }
  }
};
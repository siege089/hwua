import { ApolloError } from 'apollo-server'
import jsonwebtoken from 'jsonwebtoken'
const { sign } = jsonwebtoken
import * as DB from "./db.js";

const requiresUser = (context) => {
  if (context.user === undefined)
    throw new ApolloError("Forbidden", "403")
  return context.user
}

const requiresGame = (context) => {
  if (context.game === undefined)
    throw new ApolloError("Unauthorized", "401")
  return context.game
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
      const { player_id } = requiresUser(context)
      const incompleteGames = await DB.getIncompleteGames(player_id)
      if (incompleteGames !== undefined)
        return {
          game: incompleteGames[0],
          token: sign({
            game_id: incompleteGames[0].game_id,
          }, process.env.JWT_SECRET)
        }
      const game_id = await DB.createGame(player_id)
      return {
        game: await DB.findGame(game_id),
        token: sign({
          game_id: game_id,
        }, process.env.JWT_SECRET)
      }
    },
    joinGame: async (root, args, context) => {
      const { player_id } = requiresUser(context)
      const game = requiresGame(context)
      if (game.properties.players.length === 2)
        throw new ApolloError('Game Full')
      if (game.properties.players.includes(player_id))
        throw new ApolloError('Already Joined Game')
      game.properties.players.push(player_id)
      await DB.saveGame(game)
      return {
        game: await DB.findGame(game.game_id),
        token: sign({
          game_id: game.game_id,
        }, process.env.JWT_SECRET)
      }
    },
    saveMove: async (root, args, context) => {
      const { player_id } = requiresUser(context)
      const game = requiresGame(context)
      const {position_x, position_y} = args.move
      const existingMove = game.moves.find(move => move.position_x === position_x && move.position_y == position_y)
      if(existingMove !== undefined)
        throw new ApolloError('Position Taken')
      if(game.moves.length === 0 && game.creator.player_id !== player_id)
        throw new ApolloError('Game creator goes first')
      if(game.complete)
        throw new ApolloError('Game Over')
      if (game.moves[game.moves.length - 1].player_id === player_id)
        throw new ApolloError('Not your turn')
      const move_id = await DB.saveMove(game.game_id, player_id, position_x, position_y)
      return await DB.findMove(move_id)
    }
  }
};
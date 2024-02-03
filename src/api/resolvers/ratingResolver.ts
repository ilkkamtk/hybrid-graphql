import {GraphQLError} from 'graphql';
import {MyContext} from '../../local-types';
import {
  deleteRating,
  fetchAllRatings,
  fetchAverageRatingByMediaId,
  fetchRatingsByMediaId,
  postRating,
} from '../models/ratingModel';

export default {
  MediaItem: {
    ratings: async (parent: {media_id: string}) => {
      return await fetchRatingsByMediaId(Number(parent.media_id));
    },
    average_rating: async (parent: {media_id: string}) => {
      return await fetchAverageRatingByMediaId(Number(parent.media_id));
    },
  },
  Query: {
    ratings: async () => {
      return await fetchAllRatings();
    },
  },
  Mutation: {
    deleteRating: async (
      _parent: undefined,
      args: {input: string},
      context: MyContext,
    ) => {
      if (!context.user || !context.user.user_id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      const user_id = context.user.user_id;
      return await deleteRating(
        Number(args.input),
        user_id,
        context.user.level_name,
      );
    },
    createRating: async (
      _parent: undefined,
      args: {media_id: string; rating_value: string},
      context: MyContext,
    ) => {
      if (!context.user || !context.user.user_id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      const user_id = context.user.user_id;
      return await postRating(
        Number(args.media_id),
        user_id,
        Number(args.rating_value),
        context.user.level_name,
      );
    },
  },
};

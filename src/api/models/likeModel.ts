import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {Like} from '@sharedTypes/DBTypes';
import promisePool from '../../lib/db';
import {MessageResponse} from '@sharedTypes/MessageTypes';
import {GraphQLError} from 'graphql';

// Request a list of likes
const fetchAllLikes = async (): Promise<Like[] | null> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & Like[]>(
      'SELECT * FROM Likes',
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchAllLikes error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Request a list of likes by media item id
const fetchLikesByMediaId = async (id: number): Promise<Like[] | null> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & Like[]>(
      'SELECT * FROM Likes WHERE media_id = ?',
      [id],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchLikesByMediaId error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Request a list of likes by user id
const fetchLikesByUserId = async (id: number): Promise<Like[] | null> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & Like[]>(
      'SELECT * FROM Likes WHERE user_id = ?',
      [id],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchLikesByUserId error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Post a new like
const postLike = async (
  media_id: number,
  user_id: number,
): Promise<Like | null> => {
  try {
    // check if like already exists
    const [likeExists] = await promisePool.execute<RowDataPacket[] & Like[]>(
      'SELECT * FROM Likes WHERE media_id = ? AND user_id = ?',
      [media_id, user_id],
    );
    if (likeExists.length !== 0) {
      throw new GraphQLError('Like already exists');
    }

    const [likeResult] = await promisePool.execute<ResultSetHeader>(
      'INSERT INTO Likes (user_id, media_id) VALUES (?, ?)',
      [user_id, media_id],
    );
    if (likeResult.affectedRows === 0) {
      return null;
    }

    const [newLike] = await promisePool.execute<RowDataPacket[] & Like[]>(
      'SELECT * FROM Likes WHERE like_id = ?',
      [likeResult.insertId],
    );
    return newLike[0];
  } catch (e) {
    console.error('postLike error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Delete a like
const deleteLike = async (
  like_id: number,
  user_id: number,
): Promise<MessageResponse | null> => {
  try {
    const [likeResult] = await promisePool.execute<ResultSetHeader>(
      'DELETE FROM Likes WHERE like_id = ? AND user_id = ?',
      [like_id, user_id],
    );
    if (likeResult.affectedRows === 0) {
      return null;
    }
    return {message: 'Like deleted'};
  } catch (e) {
    console.error('deleteLike error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

const deleteLikeAsAdmin = async (
  like_id: number,
): Promise<MessageResponse | null> => {
  try {
    const [likeResult] = await promisePool.execute<ResultSetHeader>(
      'DELETE FROM Likes WHERE like_id = ?',
      [like_id],
    );
    if (likeResult.affectedRows === 0) {
      return null;
    }
    return {message: 'Like deleted'};
  } catch (e) {
    console.error('deleteLike error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

export {
  fetchAllLikes,
  fetchLikesByMediaId,
  fetchLikesByUserId,
  postLike,
  deleteLike,
  deleteLikeAsAdmin,
};

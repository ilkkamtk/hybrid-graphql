import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {Rating} from '@sharedTypes/DBTypes';
import promisePool from '../../lib/db';
import {MessageResponse} from '@sharedTypes/MessageTypes';

// Request a list of ratings
const fetchAllRatings = async (): Promise<Rating[] | null> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & Rating[]>(
      'SELECT * FROM Ratings',
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchAllRatings error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Request a list of ratings by media item id
const fetchRatingsByMediaId = async (
  media_id: number,
): Promise<Rating[] | null> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & Rating[]>(
      'SELECT * FROM Ratings WHERE media_id = ?',
      [media_id],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchRatingsByMediaId error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

const fetchAverageRatingByMediaId = async (
  media_id: number,
): Promise<number | null> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & Rating[]>(
      'SELECT AVG(rating_value) as averageRating FROM Ratings WHERE media_id = ?',
      [media_id],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0].averageRating;
  } catch (e) {
    console.error('fetchRatingsByMediaId error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Request a list of ratings by user id
const fetchRatingsByUserId = async (
  media_id: number,
): Promise<Rating[] | null> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & Rating[]>(
      'SELECT * FROM Ratings WHERE user_id = ?',
      [media_id],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchRatingsByUserId error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Post a new rating
const postRating = async (
  media_id: number,
  user_id: number,
  rating_value: number,
): Promise<Rating | null> => {
  try {
    // check if rating already exists, if so delete it because of foreign key constraints
    const [ratingExists] = await promisePool.execute<
      RowDataPacket[] & Rating[]
    >('SELECT * FROM Ratings WHERE media_id = ? AND user_id = ?', [
      media_id,
      user_id,
    ]);

    if (ratingExists.length > 0) {
      await deleteRating(ratingExists[0].rating_id, user_id);
    }

    const [ratingResult] = await promisePool.execute<ResultSetHeader>(
      'INSERT INTO Ratings (media_id, user_id, rating_value) VALUES (?, ?, ?)',
      [media_id, user_id, rating_value],
    );
    if (ratingResult.affectedRows === 0) {
      return null;
    }

    const [rows] = await promisePool.execute<RowDataPacket[] & Rating[]>(
      'SELECT * FROM Ratings WHERE rating_id = ?',
      [ratingResult.insertId],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  } catch (e) {
    console.error('postRating error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Delete a rating
const deleteRating = async (
  media_id: number,
  user_id: number,
): Promise<MessageResponse | null> => {
  try {
    const [ratingResult] = await promisePool.execute<ResultSetHeader>(
      'DELETE FROM Ratings WHERE rating_id = ? AND user_id = ?',
      [media_id, user_id],
    );
    if (ratingResult.affectedRows === 0) {
      return null;
    }
    return {message: 'Rating deleted'};
  } catch (e) {
    console.error('deleteRating error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Delete a rating as admin
const deleteRatingAsAdmin = async (
  media_id: number,
): Promise<MessageResponse | null> => {
  try {
    const [ratingResult] = await promisePool.execute<ResultSetHeader>(
      'DELETE FROM Ratings WHERE rating_id = ?',
      [media_id],
    );
    if (ratingResult.affectedRows === 0) {
      return null;
    }
    return {message: 'Rating deleted'};
  } catch (e) {
    console.error('deleteRatingAsAdmin error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

export {
  fetchAllRatings,
  fetchRatingsByMediaId,
  fetchRatingsByUserId,
  fetchAverageRatingByMediaId,
  postRating,
  deleteRating,
  deleteRatingAsAdmin,
};

/**
 * Lambda function to calculate SM-2 spaced repetition algorithm
 * and update flashcard in DynamoDB
 */

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME || 'aws-study-notes-flashcards';

// SM-2 Algorithm
function calculateSM2(quality, repetitions, easeFactor, interval) {
  // Quality: 0-5 (0-2 = fail, 3-5 = pass)
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval;
  let newReps;

  if (quality < 3) {
    // Failed - reset
    newReps = 0;
    newInterval = 1;
  } else {
    // Passed
    newReps = repetitions + 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
    nextReviewDate: nextReviewDate.toISOString(),
  };
}

exports.handler = async (event) => {
  const { cardId, quality, userId } = event.arguments || event;

  try {
    // Get current flashcard
    const getParams = {
      TableName: TABLE_NAME,
      Key: {
        PK: userId,
        SK: `CARD#${cardId}`,
      },
    };

    const cardData = await dynamodb.get(getParams).promise();

    if (!cardData.Item) {
      throw new Error('Flashcard not found');
    }

    const card = cardData.Item;

    // Calculate new values using SM-2
    const sm2Result = calculateSM2(
      quality,
      card.repetitions || 0,
      card.easeFactor || 2.5,
      card.interval || 0
    );

    // Update flashcard
    const updateParams = {
      TableName: TABLE_NAME,
      Key: {
        PK: userId,
        SK: `CARD#${cardId}`,
      },
      UpdateExpression: 'SET easeFactor = :ef, #interval = :interval, repetitions = :reps, nextReviewDate = :nextDate',
      ExpressionAttributeNames: {
        '#interval': 'interval',
      },
      ExpressionAttributeValues: {
        ':ef': sm2Result.easeFactor,
        ':interval': sm2Result.interval,
        ':reps': sm2Result.repetitions,
        ':nextDate': sm2Result.nextReviewDate,
      },
      ReturnValues: 'ALL_NEW',
    };

    const updatedCard = await dynamodb.update(updateParams).promise();

    return {
      cardId: updatedCard.Attributes.cardId,
      deckId: updatedCard.Attributes.deckId,
      front: updatedCard.Attributes.front,
      back: updatedCard.Attributes.back,
      noteId: updatedCard.Attributes.noteId,
      easeFactor: updatedCard.Attributes.easeFactor,
      interval: updatedCard.Attributes.interval,
      repetitions: updatedCard.Attributes.repetitions,
      nextReviewDate: updatedCard.Attributes.nextReviewDate,
      createdAt: updatedCard.Attributes.createdAt,
    };
  } catch (error) {
    console.error('Error reviewing flashcard:', error);
    throw error;
  }
};


import { db } from '../src/firebaseConfig.js';
import { QUESTIONS } from '../src/data.js';
import { collection, doc, writeBatch } from 'firebase/firestore';

const uploadQuestions = async () => {
  const batch = writeBatch(db);
  const questionsCollection = collection(db, 'questions');

  for (const category in QUESTIONS) {
    if (QUESTIONS.hasOwnProperty(category)) {
      const categoryDocRef = doc(questionsCollection, category);
      batch.set(categoryDocRef, { questions: QUESTIONS[category] });
    }
  }

  try {
    await batch.commit();
    console.log('Successfully uploaded questions to Firestore!');
  } catch (error) {
    console.error('Error uploading questions: ', error);
  }
};

uploadQuestions();

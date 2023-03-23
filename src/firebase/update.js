import toast from 'react-hot-toast';
import firebase from './clientApp';
import { cleanData, TODOS, USERS } from './utility';

async function update(path, data) {
  const db = firebase.firestore();
  const auth = firebase.auth();

  if (!path || !data) {
    throw new ReferenceError('No path or data provided');
  }

  // Remove any empty values
  const newData = cleanData(data);

  const documentRef = db.doc(path);
  const updatedAt = Date.now();
  const updatedBy = auth.currentUser ? auth.currentUser.uid : null;

  const finalData = {
    updatedAt,
    updatedBy,
    ...newData,
  };

  await documentRef.update(finalData);
  return documentRef.id;
}

export async function updateTodo(id, data) {
  const path = `${TODOS}/${id}`;
  update(path, data)
    .then((docId) => {
      console.log(`Document updated at ${path}`);
      toast.success('Item updated');
      return docId;
    })
    .catch((error) => {
      console.error(error);
      toast.error('Error updating item');
    });
}

export async function updateUser(uid, data) {
  const path = `${USERS}/${uid}`;

  update(path, data)
    .then((userId) => {
      console.log(`User updated at ${path}`);
      toast.success('Profile updated!');
      return userId;
    })
    .catch((error) => {
      console.error(error);
      toast.error('Error updating profile');
    });
}

require('dotenv');
const assert = require('assert');
const firebase = require('@firebase/testing');
const fs = require('fs');

const MY_PROJECT_ID = 'emulator-rules';
const myId = 'user_abc';
const theirId = 'user_xyz';
const myAuth = { uid: myId, email: 'abc@gmail.com' };

// Enforce firestore rules hot update in emulators
before(async () => {
  await firebase.loadFirestoreRules({
    projectId: MY_PROJECT_ID,
    rules: fs.readFileSync('./firestore.rules', 'utf8'),
  });
});

function getFirestore(auth) {
  return firebase
    .initializeTestApp({ projectId: MY_PROJECT_ID, auth })
    .firestore();
}

function getAdminFirestore() {
  return firebase.initializeAdminApp({ projectId: MY_PROJECT_ID }).firestore();
}

// Clear firestore before each test
beforeEach(async () => {
  await firebase.clearFirestoreData({ projectId: MY_PROJECT_ID });
});

describe('Setup', () => {
  it('Understands basic addition, sanity check mocha working', () => {
    assert.equal(2 + 2, 4);
  });

  // Test firestore rules
  it('Allow a user to edit their own document', async () => {
    const docId = 'form123';
    const admin = getAdminFirestore();
    await admin
      .collection('test_documents')
      .doc(docId)
      .set({ content: 'before', authorId: myId });

    const db = getFirestore(myAuth);
    const testDoc = db.collection('test_documents').doc(docId);
    await firebase.assertSucceeds(testDoc.update({ content: 'after' }));
  });

  it("Don't allow a user to edit somebody else's document", async () => {
    const docId = 'doc123';
    const admin = getAdminFirestore();
    await admin
      .collection('test_documents')
      .doc(docId)
      .set({ content: 'before', authorId: theirId });

    const db = getFirestore(myAuth);
    const testDoc = db.collection('test_documents').doc(docId);
    await firebase.assertFails(testDoc.update({ content: 'after' }));
  });

  // todos

  it('A signed in user can read their own todos', async () => {
    const db = getFirestore(myAuth);
    const testDoc = db.collection('todos').where('uid', '==', myId);
    await firebase.assertSucceeds(testDoc.get());
  });

  it('A signed in user cannot read other users todos', async () => {
    const other = getFirestore({ uid: theirId, email: 'hi@test.com' });
    await other
      .collection('todos')
      .doc('hydrate')
      .set({ foo: 'bar', uid: theirId, name: 'hi' });

    const db = getFirestore(myAuth);
    const testDoc = db.collection('todos').doc('hydrate');
    await firebase.assertFails(testDoc.get());
  });

  it('Allows a signed in user to update their own todos', async () => {
    const db = getFirestore(myAuth);
    await db
      .collection('todos')
      .doc('test')
      .set({ foo: 'bar', uid: myId, name: 'hi' });
    const testDoc = db.collection('todos').doc('test');
    await firebase.assertSucceeds(
      testDoc.update({ foo: 'baz', uid: myId, name: 'hi' })
    );
  });

  it('Cannot update another users todo', async () => {
    // use admin to create todo with their id
    const admin = getAdminFirestore();
    await admin
      .collection('todos')
      .doc('test1')
      .set({ foo: 'bar', uid: theirId });
    const db = getFirestore(myAuth);
    const testDoc = db.collection('todos').doc('test1');
    await firebase.assertFails(testDoc.update({ foo: 'baz', uid: myId }));
  });

  it('Users can delete todos that belong to them', async () => {
    const db = getFirestore(myAuth);
    await db
      .collection('todos')
      .doc('delete')
      .set({ foo: 'bar', uid: myId, name: 'hi' });
    const deleteDoc = db.collection('todos').doc('delete');
    await firebase.assertSucceeds(deleteDoc.delete());
  });

  it("users cannot delete todos that don't belong to them", async () => {
    // use admin to create todo with their id
    const admin = getAdminFirestore();
    await admin.collection('todos').doc('NO').set({ foo: 'bar', uid: theirId });
    const db = getFirestore(myAuth);
    const noDel = db.collection('todos').doc('NO');
    await firebase.assertFails(noDel.delete());
  });

  it('Allows a signed in user to create a new todo', async () => {
    const db = getFirestore(myAuth);
    const testDoc = db.collection('todos').doc('long walk');
    await firebase.assertSucceeds(
      testDoc.set({ foo: 'bar', uid: myId, name: 'hi' })
    );
  });

  /*   
  Test removed as security rule is not implemented, see comment in security rules...

  it('Does not Allow a signed in user to create a new empty todo', async () => {
    const db = getFirestore(myAuth);
    const testDoc = db.collection('todos').doc('long walk');
    await firebase.assertFails(
      testDoc.set({ foo: 'bar', uid: myId, name: '' })
    );
  }); */

  it("Doesn't allow a signed in user to create another users new todo", async () => {
    const db = getFirestore(myAuth);
    const testDoc = db.collection('todos').doc('long walk');
    await firebase.assertFails(testDoc.set({ foo: 'bar', uid: theirId }));
  });

  // users
  it('A signed in user can view users collection', async () => {
    const db = getFirestore(myAuth);
    const testDoc = db.collection('users');
    await firebase.assertSucceeds(testDoc.get());
  });

  it('A not signed in user cannot view users collection', async () => {
    const db = getFirestore(null);
    const testDoc = db.collection('users');
    await firebase.assertFails(testDoc.get());
  });

  it('A admin user can update any user profile', async () => {
    const db = getFirestore(myAuth);
    await db.collection('users').doc('new').set({ foo: 'bar', no: 'no' });
    const admin = getAdminFirestore();
    const adminUser = admin.collection('users').doc('new');
    await firebase.assertSucceeds(adminUser.update({ foo: 'baz', no: 'yes' }));
  });

  it('Users can create another user', async () => {
    const db = getFirestore(myAuth);
    await db.collection('users').doc('new').set({ foo: 'new' });
    const testUser = db.collection('users').doc('new');
    await firebase.assertSucceeds(testUser.get());
  });

  it('Only admins can update a user to admin', async () => {
    const db = getFirestore(myAuth);
    await db.collection('users').doc('new').set({ isAdmin: 'false' });
    const admin = getAdminFirestore();
    const testUser = admin.collection('users').doc('new');
    await firebase.assertSucceeds(testUser.update({ isAdmin: 'true' }));
  });

  it('A non admin user cannot update a user to admin', async () => {
    const db = getFirestore(myAuth);
    await db.collection('users').doc('new').set({ isAdmin: 'false' });
    const testUser = db.collection('users').doc('new');
    await firebase.assertFails(testUser.update({ isAdmin: 'true' }));
  });
});

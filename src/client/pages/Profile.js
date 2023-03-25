import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { useDocumentData } from 'react-firebase-hooks/firestore';
import { USERS, updateUser } from '../../firebase/index';
import firebase from '../../firebase/clientApp';

import { useUser } from '../components/user-context';
import LoadingError from '../components/LoadingError';
import Card from '../components/Card';
import ProfileForm from '../components/ProfileForm';

const Profile = () => {
  const { user } = useUser();
  const { uid } = useParams();

  const db = firebase.firestore();

  const [userDoc, loading, error] = useDocumentData(
    db.collection(USERS).doc(uid),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  // Check if current user is an admin
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    if (user) {
      db.collection(USERS)
        .doc(user.uid)
        .get()
        .then((currentUser) => setAdminMode(currentUser.data().isAdmin));
    }
  }, []);

  const handleAdminChange = () => {
    updateUser(userDoc.uid, { isAdmin: !userDoc.isAdmin });
  };
  return (
    <main>
      <Card>
        <h1 className="text-2xl leading-6 font-medium text-gray-900">
          {`Edit ${userDoc?.uid === user.uid ? 'your' : 'user'} profile`}
        </h1>
      </Card>

      <LoadingError data={userDoc} loading={loading} error={error}>
        {userDoc && (
          <>
            <Card>
              <ProfileForm
                userDoc={userDoc}
                isCurrentUser={userDoc.uid === user.uid}
                adminMode={adminMode}
              />
            </Card>
          </>
        )}
      </LoadingError>
      {/* Make admin */}
      {adminMode && userDoc?.uid !== user.uid && (
        <section>
          <Card>
            <div className="flex flex-col justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {' '}
                Admin Status
              </h3>
              {userDoc?.isAdmin ? (
                <span className="mt-1 text-sm text-gray-500">
                  User {userDoc?.displayName} is an <strong>Admin.</strong>
                </span>
              ) : (
                <span className="mt-1 text-sm text-gray-500">
                  User {userDoc?.displayName} is <strong> not an Admin.</strong>
                </span>
              )}
              <span className="mt-1 text-sm text-gray-500">Change status?</span>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className={`py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  userDoc?.isAdmin
                    ? `bg-red-600 hover:bg-red-700 focus:ring-red-500`
                    : `bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`
                }
              focus:outline-none focus:ring-2 focus:ring-offset-2`}
                onClick={() => handleAdminChange()}
              >
                Yes !
              </button>
            </div>
          </Card>
        </section>
      )}
    </main>
  );
};

export default Profile;

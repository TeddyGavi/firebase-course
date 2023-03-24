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
        <section className="transition-all ">
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex flex-col justify-between ">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {' '}
                  Make Admin
                </h3>
                <span className="mt-1 text-sm text-gray-500">
                  {!userDoc?.isAdmin
                    ? `This action cannot be undone.`
                    : `User ${userDoc?.displayName} is an Admin.`}
                </span>
              </div>
              {!userDoc?.isAdmin && (
                <button
                  type="button"
                  className="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 
              focus:outline-none focus:ring-2 focus:ring-offset-2"
                  onClick={() => handleAdminChange()}
                >
                  Yes !
                </button>
              )}
            </div>
          </Card>
        </section>
      )}
    </main>
  );
};

export default Profile;

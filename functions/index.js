const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const ADMIN_EMAIL = 'toni@kauppinen.info';

function assertAdmin(context) {
  const email = context?.auth?.token?.email;
  if (!context?.auth || !email) {
    throw new functions.https.HttpsError('unauthenticated', 'Kirjautuminen vaaditaan.');
  }
  if (String(email).toLowerCase() !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError('permission-denied', 'Vain ylläpitäjä.');
  }
}

exports.adminListUsers = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    assertAdmin(context);

    const limit = Math.min(200, Math.max(1, Number(data?.limit || 100)));
    const pageToken = data?.pageToken || undefined;

    const res = await admin.auth().listUsers(limit, pageToken);

    return {
      users: (res.users || []).map((u) => ({
        uid: u.uid,
        email: u.email || '',
        displayName: u.displayName || '',
        disabled: !!u.disabled,
        creationTime: u.metadata?.creationTime || '',
        lastSignInTime: u.metadata?.lastSignInTime || '',
      })),
      nextPageToken: res.pageToken || null,
    };
  });

exports.adminSetUserBlocked = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    assertAdmin(context);

    const uid = String(data?.uid || '');
    const blocked = !!data?.blocked;

    if (!uid) {
      throw new functions.https.HttpsError('invalid-argument', 'uid puuttuu.');
    }

    await admin.auth().updateUser(uid, { disabled: blocked });

    // Optional: keep a lightweight mirror in Firestore
    await admin
      .firestore()
      .collection('users')
      .doc(uid)
      .set(
        {
          uid,
          status: blocked ? 'blocked' : 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return { ok: true };
  });

exports.adminDeleteUser = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    assertAdmin(context);

    const uid = String(data?.uid || '');
    if (!uid) {
      throw new functions.https.HttpsError('invalid-argument', 'uid puuttuu.');
    }

    await admin.auth().deleteUser(uid);

    // Best-effort cleanup
    try {
      await admin.firestore().collection('users').doc(uid).delete();
    } catch (e) {
      // ignore
    }

    return { ok: true };
  });

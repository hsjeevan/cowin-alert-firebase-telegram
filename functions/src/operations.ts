import * as admin from 'firebase-admin';

admin.initializeApp()
const db = admin.firestore()

export const writeToDb = function (sessionDetails: any) {
    return db.collection('CoWin').doc('CowinSessions').set(sessionDetails).catch(e => console.log(e));
}

export const FetchFromDB = function () {
    return db.collection('CoWin').doc('CowinSessions').get().then(d=> d.data()).catch(e => console.log(e))
}
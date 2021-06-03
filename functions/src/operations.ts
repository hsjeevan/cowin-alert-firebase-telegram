import * as admin from 'firebase-admin';

admin.initializeApp()
const db = admin.firestore()

export const writeToDb = function (sessionDetails: any, date: string) {
    return db.collection('CoWin').doc(date).set(sessionDetails, { merge: true }).catch(e => console.log(e));
}

export const FetchFromDB = function (date: string) {
    return db.collection('CoWin').doc(date).get().then(d => d.data()).catch(e => console.log(e))
}
import * as functions from "firebase-functions";
import axios from 'axios';
const moment = require('moment');
const operations = require('./operations');
const { triggerNotification } = require('./notify');

interface cowinCenter {
    center_id: number;
    name: string;
    address: string;
    district_name: string;
    pincode: number;
    date: string;
    min_age_limit: number;

    session_id: number;

    vaccine: string;
    fee_type: string;
    vaccine_fees: string;

    available_capacity: number;
    available_capacity_dose1: number;
    available_capacity_dose2: number;

    slots: string;
    pattern: string

}
const runtimeOpts = {
    timeoutSeconds: 540,
}
exports.CoWinCronJob = functions.region('asia-south1').runWith(runtimeOpts).pubsub.schedule('*/10 5-19 * * *').timeZone('Asia/Kolkata').onRun(async () => {
    const now = moment();
    const minutes = now.minutes();
    const hour = now.hour();
    let date = getDate(now, minutes);
    if (hour >= 18 && minutes > 30 && date === now.format('DD-MM-YYYY')) {
        return // Do not send today's notifications post 6.30PM
    }


    // const district_id = 265; // urban
    const district_id = 294; // BBMP
    const headers = {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
    }
    // https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=265&date=29-05-2021
    const url = `${'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=' + district_id + '&date=' + date}`
    await axios.get(url, {
        headers: headers
    }).then(async (response) => {
        let data = response.data;
        let sessionDetailsObj: any = {};

        const centers = data.centers.filter((a: any) => a.sessions.some((b: any) => b.available_capacity))
        let DB_Data = await operations.FetchFromDB(date) || {};
        const messagesArr = [];

        for (const center of centers) {
            let messageData = <cowinCenter>{};
            messageData.center_id = center.center_id;
            messageData.name = center.name;
            messageData.address = center.address;
            messageData.district_name = center.district_name;
            messageData.pincode = center.pincode;
            messageData.fee_type = center.fee_type;
            // messageData.vaccine_fees = center.vaccine_fees[0].fee || 'Null';


            for (const session of center.sessions) {
                if (!session.available_capacity || session.date !== date) {
                    continue;
                }
                messageData.session_id = session.session_id;
                messageData.date = session.date;
                messageData.min_age_limit = session.min_age_limit;
                messageData.vaccine = session.vaccine;
                messageData.available_capacity = session.available_capacity;
                messageData.available_capacity_dose1 = session.available_capacity_dose1;
                messageData.available_capacity_dose2 = session.available_capacity_dose2;

                messageData.slots = '\n'
                session.slots.forEach((slot: string, index: number) => {
                    messageData.slots += index + 1 + ') ' + slot + (session.slots.length !== index ? '\n' : '');
                });
                sessionDetailsObj[`${messageData.session_id}`] = session.available_capacity;

                if (!DB_Data[messageData.session_id] || DB_Data[messageData.session_id] < session.available_capacity) {
                    messageData.pattern = '\n';
                    if (session.available_capacity_dose1)
                        messageData.pattern += session.min_age_limit + session.vaccine + center.pincode + 'Dose1\n'
                    if (session.available_capacity_dose2)
                        messageData.pattern += session.min_age_limit + session.vaccine + center.pincode + 'Dose2'
                    messagesArr.push(messageData)
                }
            }
        }
        await operations.writeToDb(sessionDetailsObj, date);
        if (messagesArr.length) {
            await triggerNotification(messagesArr);
        }
        return
    }).catch((error) => {
        console.log(error);
        return
    })
});


function getDate(now: any, minutes: any) {
    let date = '';

    switch (true) {
        case ((minutes > 0 && minutes <= 10) || (minutes > 20 && minutes <= 30) || (minutes > 40 && minutes <= 50)):
            date = now.format('DD-MM-YYYY');
            break;
        case (minutes <= 20):
            date = moment(now, "DD-MM-YYYY").add(1, 'days').format('DD-MM-YYYY');
            break;
        case (minutes <= 40):
            date = moment(now, "DD-MM-YYYY").add(2, 'days').format('DD-MM-YYYY');
            break;
        case (minutes <= 60):
            date = moment(now, "DD-MM-YYYY").add(3, 'days').format('DD-MM-YYYY');
            break;
        default:
            date = now.format('DD-MM-YYYY');
            break;
    }
    return date;
}
import * as functions from "firebase-functions";
import axios from 'axios';
const moment = require('moment');
const operations = require('./operations');
const { sendNotification } = require('./notify');

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
}

exports.CoWinCronJob = functions.region('asia-south1').pubsub.schedule('every minute').timeZone('Asia/Kolkata').onRun(async () => {
    const now = moment().format('DD-MM-YYYY');
    const district_id = 265;

    const headers = {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
    }
    // https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=265&date=29-05-2021
    const url = `${'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=' + district_id + '&date=' + now}`
    await axios.get(url, {
        headers: headers
    }).then(async (response) => {
        let data = response.data;
        let sessionDetailsObj: any = {};

        const centers = data.centers.filter((a: any) => a.sessions.some((b: any) => b.available_capacity))
        let DB_Data = await operations.FetchFromDB();

        for (const center of centers) {
            let messageData = <cowinCenter>{};
            messageData.center_id = center.center_id;
            messageData.name = center.name;
            messageData.address = center.address;
            messageData.district_name = center.district_name;
            messageData.pincode = center.pincode;
            messageData.fee_type = center.fee_type;
            messageData.vaccine_fees = center.vaccine_fees[0].fee || 'Null';


            for (const session of center.sessions) {
                if (!session.available_capacity) {
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

                if (!DB_Data[messageData.session_id] || DB_Data[messageData.session_id] < session.available_capacity ){
                    await sendNotification(messageData);
                }
            }
        }
        await operations.writeToDb(sessionDetailsObj);
        return
    })
        .catch((error) => {
            console.log(error);
            return
        })
});



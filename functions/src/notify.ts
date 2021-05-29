import axios from 'axios';
const firebase = require('firebase-functions');

const config = firebase.config().config;
const accessToken = config.access_token;
const channel = config.channel;

export const sendNotification = function (messageData: any) {
    const message = `<b>${messageData.name}</b>\n${messageData.address}\n${messageData.district_name}\nPincode: ${messageData.pincode}\n\n<b>Age Limit: ${messageData.min_age_limit}</b>\n\n<b>Date: ${messageData.date}</b>\n\nVaccine: <b>${messageData.vaccine}</b>\n${messageData.fee_type} - <b>${messageData.vaccine_fees}</b>\n\nTotal Available Doses: ${messageData.available_capacity}\nDose 1: ${messageData.available_capacity_dose1}\nDose 2: ${messageData.available_capacity_dose2}\n\n<b>Slots:</b> ${messageData.slots}`;
    const url = `https://api.telegram.org/bot${accessToken}/sendMessage?chat_id=${channel}&text=${message}&parse_mode=html`
    return axios.post(url).catch(error => {
        console.log(error);
    });
}

export const deleteMessage = function (MID: string) {
    const url = `https://api.telegram.org/bot${accessToken}/deleteMessage?chat_id=${channel}&message_id=${MID}`
    axios.post(url).catch(error => {
        console.log(error);
    });
}
# cowin-alert-firebase-telegram

A **firebase cloud function** based on nodejs runtime.
Get notified on any telegram bot about the availability of vaccicnes in any district by changing the district_id.

Current version makes use of two telegram bots to publish vaccine availability messages on to the telegram channel.
Click to recive notification for **[@cowin_bengaluru](https://t.me/cowin_bengaluru)** 

## Deployment Notes
####  Deploy
``npm run build``

#### Set envirnoment variables 
``firebase functions:config:set config.access_token_one="Access token 1" config.access_token_two="Access token 1" config.channel="channel_ID"``
*Generate access tokens by using [@BotFather](https://t.me/botfather)*

####  Deploy
``firebase deploy --only functions:CoWinCronJob``

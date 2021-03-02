const client = require('twilio')(process.env.accountSid, process.env.authToken);
import shorten from '../url/shorten';

export default async function main(event, context) {
	console.log(event);
	const data = JSON.parse(event.body);
  const dealInfo = data.dealInfo;
  const twilioNumber = data.twilioNumber;
  const subscribers = data.subscribers;

  for (const mobileNumber in subscribers) subscribers[mobileNumber].subscribed ? sendMessage(mobileNumber, dealInfo, twilioNumber) : null;
	return event;
}

async function sendMessage(mobileNumber, content, twilioNumber) {
	let messageBody = '';
	const longUrl = `${process.env.longUrlDomain}/?a=${mobileNumber}`;

	let shortUrl = await shorten(longUrl, process.env.shortUrlDomain);

	if (shortUrl != '') {
		let messageLink = `Redeem here: ${shortUrl}`;

		messageBody = `${content} ${messageLink} HELP 4, STOP 2 Unsub.`;

	} else{
		//we couldnt generate a link, send just the message instead.
		console.log("Failed to get token for this message");
		// client.messages.create({
		// 	body: `MESSAGE-SEND::Failed to get a token for short url`,
		// 	from: "+17633249713",
		// 	to: "+16124812069"
		// });
		messageBody = `${content} HELP 4 help, STOP 2 Unsub.`;
		return;
	}

	const  twilioData = {
		body: messageBody,
		from: twilioNumber,
		to: mobileNumber,
	};
	client.messages.create(twilioData);
}
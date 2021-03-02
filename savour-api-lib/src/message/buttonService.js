import * as dynamoDbLib from "../common/dynamodb-lib";
import shorten from "../url/shorten";
const client = require('twilio')(process.env.accountSid, process.env.authToken);


export default async function main(event, context) {
  console.log(event);
	const timestamp = new Date().toISOString();

	//get data from message request
	var clickType, buttonID;
	if (event.deviceEvent && event.deviceInfo){
		clickType = event.deviceEvent.buttonClicked.clickType;
		buttonID = event.deviceInfo.deviceId;
	}else{
		clickType = event.clickType;
		buttonID = event.serialNumber;
	}

	//see if this button is registered by looking businesses up by btn_id
	const params = {
    TableName: process.env.businessTable,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'btn_id': button id registered to a single business
    IndexName: "btn_id-index",
    KeyConditionExpression: "btn_id = :id",
    ExpressionAttributeValues: {
      ":id": buttonID
    }
  };

  try {
    const result = await dynamoDbLib.call("query", params);
		if (result.Items.length > 0) {
			//This button is registered. Continue!
			const uuid = await createPushTableLog(buttonID, timestamp, clickType);
			if (uuid !== "") {
				//we created the push event successfully!
				const businessData = result.Items[0];
				const content = getDealString(clickType, businessData);
				if (content !== "") {
					const message = `${businessData.business_name}: Check it out! You just got a coupon for ${content}! \u{1f354}\u{1f354}\u{1f60b}`;
					var sentCount = 0;
					for (var mobileNumber in businessData.subscriber_dict) {
						if (businessData.subscriber_dict[mobileNumber].subscribed){
							await sendMessage(mobileNumber, message, businessData.twilio_number, uuid, timestamp);
							sentCount++;
						}
					}
					//TODO: update stripe with sentCount
					console.log(`${sentCount} deals sent...`);
				}else{
					console.log(`MESSAGE-SERVICE::LAMBDA_HANDLER : Unknown message origin!`);
				}
			}else{
				// something went wrong setting up event.
				console.log("Failed to generate uuid for push event");
				// client.messages.create({
				// 	body: `MESSAGE-SEND::Failed to generate uuid for push event`,
				// 	from: "+17633249713",
				// 	to: "+16124812069"
				// });
			}
    } else {
			//button was not registered to anyone. Put it in unclaimed table
			const params = {
				TableName: process.env.unclaimedButtonTable,
				Item: {button_id: buttonID}
			};
			try {
				await dynamoDbLib.call("put", params);
			} catch (e) {
				console.log(e);
			}
			console.log(`MESSAGE-SERVICE::LAMBDA_HANDLER : Button ID ${buttonID} not registered.`);
    }
  } catch (e) {
		console.error(e);
	}
	return;
}

async function createPushTableLog(buttonID, timestamp, clickType){
	var attempt = 0;
	var uuid = '';
	while (attempt < 5){
		attempt++;
		uuid = randomString(parseInt(process.env.uuidSize));
		try {
			const params = {
				TableName: process.env.pushMessageTable,
				Item: {
					unique_id: uuid,
					button_id: buttonID,
					timestamp: timestamp,
					click_type: clickType,
				},
				ConditionExpression: 'attribute_not_exists(unique_id)'
			};
			await dynamoDbLib.call("put", params);
			break;
		} catch (e) {
			console.log(e);
			uuid = '';
		}
	}
	return uuid;
}

function getDealString(clickType, businessData){
	//TODO: Case for message passed from business dashboard
	var content = ``;
	if (clickType === "SINGLE"){
		content = `${businessData.single_click_deal}`;
	}else if (clickType === "DOUBLE"){
		content = `${businessData.double_click_deal}`;
	}else if (clickType === "LONG"){
		content = `${businessData.long_click_deal}`;
	}
	//else unknown click type
	return content;
}

async function sendMessage(mobileNumber, content, twilioNumber, uuid, timestamp){
	var messageBody = '';
	const longUrl = `${process.env.longUrlDomain}/?a=${uuid}&b=${mobileNumber}`;

	let shortUrl = await shorten(longUrl, process.env.shortUrlDomain);
	if (shortUrl != ''){
		// we created a link for this message!
		let messageLink = `Redeem here: ${shortUrl}.`;
		messageBody = `${content} ${messageLink} HELP 4 help, STOP 2 Unsub.`;
	}else{
		//we couldnt generate a link, send just the message instead.
		console.log("Failed to get token for this message");
		// client.messages.create({
		// 	body: `MESSAGE-SEND::Failed to get a token for short url`,
		// 	from: "+17633249713",
		// 	to: "+16124812069"
		// });
		messageBody = `${content} HELP 4 help, STOP 2 Unsub.`;
	}

	let twilioData = {
		body: messageBody,
		from: twilioNumber,
		to: mobileNumber,
	};
	client.messages.create(twilioData);

	var params = {
		TableName: process.env.pushMessageTable,
		Key: {'unique_id': uuid},
		UpdateExpression: 'SET #VALUE.#FIELD = :value',
		ExpressionAttributeNames: {
				'#VALUE': 'sent_map',
				'#FIELD': mobileNumber
		},
		ExpressionAttributeValues: {
				':value': {status: 'SENT', timestamp: timestamp}
		},
		ReturnValues: 'UPDATED_NEW'
	};
	try {
    await dynamoDbLib.call("update", params);
  } catch (error) {
    var dict = {};
    dict[mobileNumber] = {status: 'SENT', timestamp: timestamp};
    params = {
      TableName: process.env.pushMessageTable,
			Key: {'unique_id': uuid},
      UpdateExpression: 'SET sent_map = :value',
      ExpressionAttributeValues: {
          ':value': dict
      },
      ReturnValues: 'ALL_NEW'
    };
    await dynamoDbLib.call("update", params);
	}
	return twilioData;
}
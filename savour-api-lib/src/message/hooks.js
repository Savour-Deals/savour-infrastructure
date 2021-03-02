import * as dynamoDbLib from "../common/dynamodb-lib";

const unsubStrings = ["stop", "cancel", "end", "quit", "stopall", "unsubscribe", "unsub"];
const subStrings = ['start', 'unstop', 'subscribe','sub'];

export default async function main(event, context) {
  console.log(event);
  let bNum = event.To.replace("%2B", "+");
  let uNum = event.From.replace("%2B", "+");
  let eventMsg = event.Body;
  var resp = '';
  var respBody = '';
  if (unsubStrings.includes(eventMsg.toLowerCase())){
    await unsubscribeUser(uNum,bNum);
    return resp;
  }
  else if (subStrings.includes(eventMsg.toLowerCase())){
    respBody = await subscribeUser(uNum,bNum);
  }
  else{
    respBody = "Sorry, we don't recognize that command. Text SUB to subscribe and STOP to unsubscribe.";
  }
  console.log(`Response: ${respBody}`);
  resp = `<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Message>${respBody}</Message></Response>`;
  return resp;
}

async function updateSubscription(uNum, bInfo, subscribe){
  const timestamp = new Date().toISOString();
  var bParams = {
    TableName: process.env.businessTable,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'place_id': id identifying business
    Key: {place_id: bInfo.place_id},
    UpdateExpression: 'SET subscriber_dict.#FIELD = :value',
    ExpressionAttributeNames: {
        '#FIELD': uNum,
    },
    ExpressionAttributeValues: {
        ':value': {subscribed: subscribe, timestamp: timestamp}
    },
    ReturnValues: 'ALL_NEW'
  };
  var uParams = {
    TableName: process.env.subscriberUserTable,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'mobile_number': number identifying user
    Key: {mobile_number: uNum},
    UpdateExpression: 'SET subscription_dict.#FIELD = :value',
    ExpressionAttributeNames: {
        '#FIELD':  bInfo.place_id,
    },
    ExpressionAttributeValues: {
      ':value': {subscribed: subscribe, timestamp: timestamp}
    },
    ReturnValues: 'ALL_NEW'
  };
  try {
    await dynamoDbLib.call("update", bParams);
  } catch (error) {
    var dict = {};
    dict[uNum] = {subscribed: subscribe, timestamp: timestamp};
    const bParams = {
      TableName: process.env.businessTable,
      // 'Key' defines the partition key and sort key of the item to be retrieved
      // - 'place_id': id identifying business
      Key: {place_id: bInfo.place_id},
      UpdateExpression: 'SET subscriber_dict = :value',
      ExpressionAttributeValues: {
          ':value': dict
      },
      ReturnValues: 'ALL_NEW'
    };
    await dynamoDbLib.call("update", bParams);
  }
  try {
    await dynamoDbLib.call("update", uParams);
  } catch (error) {
    var dict2 = {};
    dict2[bInfo.place_id] = {subscribed: subscribe, timestamp:timestamp};
    const uParams = {
      TableName: process.env.subscriberUserTable,
      // 'Key' defines the partition key and sort key of the item to be retrieved
      // - 'mobile_number': number identifying user
      Key: {mobile_number: uNum},
      UpdateExpression: 'SET subscription_dict = :value',
      ExpressionAttributeValues: {
        ':value': dict2
      },
      ReturnValues: 'ALL_NEW'
    };
    await dynamoDbLib.call("update", uParams);
  }
}

async function unsubscribeUser(uNum, bNum){
  console.log(`Unsubscribing ${uNum} from ${bNum}`);
  const bParams = {
    TableName: process.env.businessTable,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'twilio_number': number identifying business
    IndexName: "twilio_number-index",
    KeyConditionExpression: "twilio_number = :t",
    ExpressionAttributeValues: {
      ":t": bNum
    }
  };
  const result = await dynamoDbLib.call("query", bParams);
  if (result.Items.length > 0) {
    // business exists, continue
    await updateSubscription(uNum, result.Items[0], false);
  }
  //if the business does not exist then don't worry?
}

async function subscribeUser(uNum, bNum){
  console.log(`Subscribing ${uNum} to ${bNum}`);
  var message = '';
  const bParams = {
    TableName: process.env.businessTable,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'twilio_number': number identifying business
    IndexName: "twilio_number-index",
    KeyConditionExpression: "twilio_number = :t",
    ExpressionAttributeValues: {
      ":t": bNum
    }
  };
  const uParams = {
    TableName: process.env.subscriberUserTable,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'mobile_number': number identifying user
    key: "mobile_number",
    KeyConditionExpression: "mobile_number = :t",
    ExpressionAttributeValues: {
      ":t": uNum
    }
  };
  var businessInfo = await dynamoDbLib.call("query", bParams);
  if (businessInfo.Items.length > 0) {
    // business exists, continue
    businessInfo = businessInfo.Items[0];
    var userInfo = await dynamoDbLib.call("query", uParams);
    if (userInfo.Items.length > 0) {
      // subscriber exists in DB, continue
      var subDict = userInfo.Items[0].subscription_dict;
      if(businessInfo.place_id in Object.keys(subDict)){
        message = `You're already subscribed to our ${businessInfo.business_name} loyalty program! \u{1f923} Reply HELP for help or STOP to unsubscribe. Msg and Data Rates May Apply.`;
      }else{
        await updateSubscription(uNum, businessInfo, true);
        message = `Welcome back to our ${businessInfo.business_name} loyalty program! \u{1f64c} Reply HELP for help or STOP to unsubscribe. Msg and Data Rates May Apply.`;
      }
    }else{
      // subscriber doesn't exist, create user and subscribe them to receive deals from this business
      const params = {
        TableName: process.env.subscriberUserTable,
        Item: {
          mobile_number: uNum,
          subscription_dict: {}
        }
      };
      await dynamoDbLib.call("put", params);
      await updateSubscription(uNum, businessInfo, true);
      message = `Welcome to our ${businessInfo.business_name} loyalty program! \u{1f604} Show us this text today and get ${businessInfo.onboard_deal}!`;
    }
  } else {
    // This is probably not likely? IDK
    message = 'Sorry, this number is not associated with any of our Savour Loyalty Programs. \u{1F62C}';
  }
  return message;
}
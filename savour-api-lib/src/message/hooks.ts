import { SubscriberInfo } from 'src/model/subscriberUser';
import Business from "src/model/business";
import SubscriberUser from "src/model/subscriberUser";
import * as dynamoDbLib from "../common/dynamodb-lib";

const unsubStrings = ["stop", "cancel", "end", "quit", "stopall", "unsubscribe", "unsub"];
const subStrings = ['start', 'unstop', 'subscribe','sub'];

interface HooksLambdaInput {
  To: string,
  From: string,
  Body: string;
}
export default async function main(event: HooksLambdaInput): Promise<string> {
  console.log(event);
  const businessNumber = event.To.replace("%2B", "+");
  const userNumber = event.From.replace("%2B", "+");
  const eventMessage = event.Body;
  
  if (unsubStrings.includes(eventMessage.toLowerCase())){
    return unsubscribeUser(userNumber, businessNumber).then(() => '');
  } else if (subStrings.includes(eventMessage.toLowerCase())) {
    return subscribeUser(userNumber, businessNumber).then((result) => wrapBody(result));
  } 
  return wrapBody("Sorry, we don't recognize that command. Text SUB to subscribe and STOP to unsubscribe.");
}

function wrapBody(body: string): string {
  console.log(`Response: ${body}`);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${body}</Message></Response>`;
}

function updateSubscription(userNumber: string, businessInfo: Business, subscribe: boolean): Promise<any> {
  const timestamp = new Date().toISOString();

  const businessParams = {
    TableName: process.env.businessTable,
    Key: {id: businessInfo.id},
    UpdateExpression: 'SET subscriberMap.#FIELD = :value',
    ExpressionAttributeNames: {
        '#FIELD': userNumber,
    },
    ExpressionAttributeValues: {
        ':value': {subscribed: subscribe, timestamp: timestamp}
    },
    ReturnValues: 'ALL_NEW'
  };
  const userParams = {
    TableName: process.env.subscriberUserTable,
    Key: {mobileNumber: userNumber},
    UpdateExpression: 'SET subscriptionMap.#FIELD = :value',
    ExpressionAttributeNames: {
        '#FIELD':  businessInfo.id,
    },
    ExpressionAttributeValues: {
      ':value': {subscribed: subscribe, timestamp: timestamp}
    },
    ReturnValues: 'ALL_NEW'
  };

  //first ensure both records have subscription maps otherwise update will fail
  return Promise.all([dynamoDbLib.call("update", businessParams), dynamoDbLib.call("update", userParams)])
}

function unsubscribeUser(userNumber: string, businessNumber: string): Promise<void> {
  console.log(`Unsubscribing ${userNumber} from ${businessNumber}`);
  const bParams = {
    TableName: process.env.businessTable,
    IndexName: "messagingNumber-index",
    KeyConditionExpression: "messagingNumber = :t",
    ExpressionAttributeValues: {
      ":t": businessNumber
    }
  };
  return dynamoDbLib.call("query", bParams).then((result) => {
    if (result.Items.length > 0) {
      const business: Business = result.Items[0];
      return updateSubscription(userNumber, business, false)
    }  
    return;//if the business does not exist then don't worry?
  });
}

async function subscribeUser(userNumber: string, businessNumber: string): Promise<string> {
  console.log(`Subscribing ${userNumber} to ${businessNumber}`);
  const bParams = {
    TableName: process.env.businessTable,
    IndexName: "messagingNumber-index",
    KeyConditionExpression: "messagingNumber = :t",
    ExpressionAttributeValues: {
      ":t": businessNumber
    }
  };
  const uParams = {
    TableName: process.env.subscriberUserTable,
    key: "mobileNumber",
    KeyConditionExpression: "mobileNumber = :t",
    ExpressionAttributeValues: {
      ":t": userNumber
    }
  };

  return Promise.all([dynamoDbLib.call("query", bParams), dynamoDbLib.call("query", uParams)])
  .then(([businessResult, userResult]) => {
    if (businessResult.Items.length > 0 && userResult.Items.length > 0){
      const business: Business = businessResult.Items[0];
      const user: SubscriberUser = userResult.Items[0];
      return {
        business,
        user
      };
    } else if (businessResult.Items.length > 0) {
      const business: Business = businessResult.Items[0];
      //ned to create user
      const user: SubscriberUser = dynamoDbLib.call("put", {
        TableName: process.env.subscriberUserTable,
        Item: {
          mobileNumber: userNumber,
          subscriptionMap: {}
        }
      }).then(() => {
        return {
          mobileNumber: userNumber,
          subscriptionMap: new Map<string, SubscriberInfo>()
        };
      });
      return {
        business,
        user
      };
    }
    return {
      message: 'Sorry, this number is not associated with any of our Savour Loyalty Programs. \u{1F62C}'
    };
  }).then((result) => {
    if (result.message) {
      return result.message;
    }
    if (result.business.id in Object.keys(result.user.subscriptionMap)) {
      return `You're already subscribed to our ${result.business.id} loyalty program! \u{1f923} Reply HELP for help or STOP to unsubscribe. Msg and Data Rates May Apply.`;
    } else {
      return updateSubscription(userNumber, result.business, true).then(() => {
        return `Welcome back to our ${result.business.businessName} loyalty program! \u{1f64c} Reply HELP for help or STOP to unsubscribe. Msg and Data Rates May Apply.`;
      });
    }
  });
}
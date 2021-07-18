import { SubscriberInfo } from 'src/model/subscriberUser';
import Business from "src/model/business";
import SubscriberUser from "src/model/subscriberUser";
import subscriberUserDao from 'src/dao/subscriberUserDao';
import businessDao, { BusinessGSIs } from 'src/dao/businessDao';

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

function updateSubscription(userNumber: string, business: Business, subscribe: boolean): Promise<[Business, SubscriberUser]> {
  const timestamp = new Date().toISOString();
  business.subscriberMap[userNumber] = {
    subscribed: subscribe,
    timestamp: timestamp
  };
  return Promise.all([subscriberUserDao.get(userNumber)])
  .then(([subscriber]) => {
    subscriber.subscriptionMap[business.id] = {
      subscribed: subscribe,
      timestamp: timestamp
    };
    return Promise.all([businessDao.update(business.id, business), subscriberUserDao.update(userNumber, subscriber)])
  });
}

function unsubscribeUser(userNumber: string, businessNumber: string): Promise<void> {
  console.log(`Unsubscribing ${userNumber} from ${businessNumber}`);

  return businessDao.queryBy(businessNumber, BusinessGSIs.messagingNumberIndex)
  .then((result) => {
    if (result.length > 0) {
      return updateSubscription(userNumber, result[0], false).then(() => Promise.resolve());
    }  
    return;//if the business does not exist then don't worry?
  });
}

async function subscribeUser(userNumber: string, businessNumber: string): Promise<string> {
  console.log(`Subscribing ${userNumber} to ${businessNumber}`);

  return Promise.all([
    businessDao.queryBy(businessNumber, BusinessGSIs.messagingNumberIndex), 
    subscriberUserDao.get(userNumber)
  ])
  .then(([businesses, user]) => {
    if (businesses.length > 0 && user) {
      return {
        business: businesses[0],
        user: user
      };
    } else if (businesses.length > 0) {
      //need to create user
      return subscriberUserDao.create({
        mobileNumber: userNumber,
        subscriptionMap: new Map<string, SubscriberInfo>()
      }).then((user) => {
        return {
          business: businesses[0],
          user
        };
      });
    }
  }).then((result) => {
    if (result.business && result.user) {
      if (Object.keys(result.user.subscriptionMap).includes(result.business.id)) {
        return `You're already subscribed to ${result.business.businessName}! \u{1f923} Reply HELP for help or STOP to unsubscribe. Msg and Data Rates May Apply.`;
      } else {
        return updateSubscription(userNumber, result.business, true).then(() => {
          return `${result.business.onboardMessage} Reply HELP for help or STOP to unsubscribe. Msg and Data Rates May Apply.`;
        });
      }
    }
    return 'Sorry, this number is not associated with any of our Savour Messaging Programs. \u{1F62C}'
  });
}
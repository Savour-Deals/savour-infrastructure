const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
import * as dynamoDb from "../common/dynamodb-lib";

function randomString(length) {
	let result = '';
	for (let i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
	return result;
}

export default async function main(longUrl, shortUrlDomain) {
	if (!longUrl) return;
	
	let token = '';
	let shortUrl = '';
	let attempt = 0;
	while (attempt < 5){
		attempt++;
		token = randomString(parseInt(process.env.tokenSize));
		shortUrl = `${shortUrlDomain}/${token}`;
		try {
			const params = {
				TableName: process.env.redirectTable,
				Item: {
					id: token,
					destinationUrl: longUrl,
					shortUrl: shortUrl
				},
				ConditionExpression: 'attribute_not_exists(id)'
			};
			await dynamoDb.call("put", params);
			break;
		} catch (e) {
			console.log(e);
			shortUrl = '';
		}
	}
	return shortUrl;
}
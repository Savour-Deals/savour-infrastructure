const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
import * as dynamoDb from "../common/dynamodb-lib";

function randomString(length) {
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
	return result;
}

export default async function main(longUrl, shortUrlDomain) {
	var token = '';
	var shortUrl = '';
	var attempt = 0;
	while (attempt < 5){
		attempt++;
		token = randomString(parseInt(process.env.tokenSize));
		shortUrl = `${shortUrlDomain}/${token}`;
		try {
			const params = {
				TableName: process.env.redirectTable,
				Item: {
					unique_id: token,
					destination_url: longUrl,
					shorturl: shortUrl
				},
				ConditionExpression: 'attribute_not_exists(unique_id)'
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
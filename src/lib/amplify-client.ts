import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: 'ap-southeast-1_4rorcs3Fm', // Dán User Pool ID bạn vừa copy vào đây
            userPoolClientId: '4agtip44bnautkkdng70qr1svs', // Dán Client ID bạn vừa copy vào đây
        }
    },
    API: {
        GraphQL: {
            endpoint: "https://7u2dkfti2ng5xpqug63q6v7rge.appsync-api.ap-southeast-1.amazonaws.com/graphql",
            region: 'ap-southeast-1',
            defaultAuthMode: 'apiKey',
            apiKey: "da2-e72azb7zsrhd7khl5jtmiyytqm",
        }
    }
}, {
    ssr: true,
});

export const client = generateClient();


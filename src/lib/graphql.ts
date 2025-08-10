export const createEvent = `
    mutation CreateEvent ($input: CreateEventInput!){
        CreateEvent(input: $input){
            id
            name
            description
            createdAt
        }
    }
`;

export const createQuestion = `
    mutation CreateQuestion($input: CreateQuestionInput!) {
        CreateQuestion(input: $input) {
            id
            content
            author {
                id
                name
            }
            upvotes
            createdAt
        }
    }
`;

export const upvoteQuestion = /* GraphQL */ `
  mutation UpvoteQuestion($input: UpvoteQuestionInput!) {
    UpvoteQuestion(input: $input) {
      id
      content
      author {
        id
        name
      }
      upvotes
      createdAt
    }
  }
`;

export const getEvent = `
    query GetEvent ($id: ID!, $userId: ID){
        getEvent(id: $id, userId: $userId){
            id
            name
            description
            questions{
                id
                content
                author{
                    id
                    name
                }
                upvotes
                isUpvotedByMe
                createdAt
            }
            polls{
                id
                questionText
                totalVotes
                myVote
                options{
                    text
                    votes
                }
            }
        }
    }
`;

export const listEvents = `
query ListEvents{
    listEvents{
        id
        name
        description
        createdAt
    }
}
`

export const onQuestionUpdated = `
  subscription onQuestionUpdated($eventId: ID!) {
    onQuestionUpdated(eventId: $eventId) {
      id
      eventId
      content
      author {
        id
        name
      }
      upvotes
      createdAt
    }
  }
`;

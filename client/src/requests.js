import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from 'apollo-boost';
import gql from 'graphql-tag';
import { getAccessToken, isLoggedIn } from './auth';
const endpointURL = 'http://localhost:9000/graphql';

const authLink = new ApolloLink((operation, forward) => {
  if (isLoggedIn()) {
    //request.headers["authorization"] = "Bearer " + getAccessToken();
    operation.setContext({
      headers: {
        authorization: 'Bearer ' + getAccessToken(),
      },
    });
  }
  return forward(operation);
});

const client = new ApolloClient({
  link: ApolloLink.from([authLink, new HttpLink({ uri: endpointURL })]),
  cache: new InMemoryCache(),
});

const jobDetailFragment = gql`
  fragment JobDetail on Job {
    id
    title
    company {
      id
      name
    }
    description
  }
`;

const createJobMutation = gql`
  mutation CreateJob($input: CreateJobInput) {
    job: createJob(input: $input) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

const companyQuery = gql`
  query CompanyQuery($id: ID!) {
    company(id: $id) {
      id
      name
      description
      jobs {
        id
        title
      }
    }
  }
`;

let jobQuery = gql`
  query JobQuery($id: ID!) {
    job(id: $id) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

//convert string to obj ,gql function ,tag function
let jobsQuery = gql`
  query JobsQuery {
    jobs {
      id
      title
      company {
        id
        name
      }
    }
  }
`;

// async function graphqlRequest(query, variables = {}) {
//   const request = {
//     method: 'POST',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify({
//       query,
//       variables,
//     }),
//   };

//   if (isLoggedIn()) {
//     request.headers['authorization'] = 'Bearer ' + getAccessToken();
//   }

//   let res = await fetch(endpointURL, request);

//   let { data, errors } = await res.json();
//   if (errors) {
//     throw new Error(errors.map((error) => error.message).join('\n'));
//   }
//   return data;
// }

export async function loadJobs() {
  const {
    data: { jobs },
  } = await client.query({ query: jobsQuery, fetchPolicy: 'no-cache' });
  //const data = await graphqlRequest(query);
  //return data.jobs;

  return jobs;
}

export async function loadCompany(id) {
  const {
    data: { company },
  } = await client.query({ query: companyQuery, variables: { id } });
  //const { company } = await graphqlRequest(query, { id });
  return company;
}

export async function createJob(input) {
  const {
    data: { job },
  } = await client.mutate({
    mutation: createJobMutation,
    variables: { input },
    update: (cache, { data }) => {
      cache.writeQuery({
        query: jobQuery,
        variables: { id: data.job.id },
        data,
      });
    },
  });
  //const { job } = await graphqlRequest(mutation, { input });
  return job;
}

export async function loadJob(id) {
  let query = jobQuery;
  const {
    data: { job },
  } = await client.query({ query, variables: { id } });
  //let { job } = await graphqlRequest(query, { id });
  return job;
}

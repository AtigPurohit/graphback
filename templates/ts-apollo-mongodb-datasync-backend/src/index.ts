// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config()
import path from 'path'
import http from "http"
import { ApolloServer } from "apollo-server-express"
import { loadSchemaSync } from '@graphql-tools/load'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { createDataSyncAPI } from '@graphback/datasync'
// eslint-disable-next-line @typescript-eslint/tslint/config
import cors from "cors"
// eslint-disable-next-line @typescript-eslint/tslint/config
import express from "express"
import { connectDB } from './db'

async function start() {
  const app = express()

  app.use(cors())

  const modelDefs = loadSchemaSync(path.resolve('./model/*.graphql'), {
    loaders: [
      new GraphQLFileLoader()
    ]
  })

  const db = await connectDB()

  const { typeDefs, resolvers, contextCreator } = createDataSyncAPI(modelDefs, { db, conflictConfig: { models: { Comment: { enabled: true } } } });

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: contextCreator
  })

  apolloServer.applyMiddleware({ app })

  const httpServer = http.createServer(app)
  apolloServer.installSubscriptionHandlers(httpServer)

  httpServer.listen({ port: 4000 }, () => {
    console.log(`🚀  Server ready at http://localhost:4000/graphql`)
  })
}

start().catch((err: any) => console.log(err))

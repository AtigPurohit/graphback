---
title: Graphback - Low Code, GraphQL based API suited for your needs
tags: graphql, nodejs, graphback
author: Wojciech Trocki
authorURL: http://twitter.com/typeapi
authorFBID: 2026021350761623
---

> NOTE: This blog post can be also viewed on medium:
https://medium.com/@wtr/graphback-plugin-based-realtime-database-generator-78f4f608b81e

# Graphback- Plugin based Realtime Database Generator

TL:DR -We have done extensive changes in Graphback over the last 3 weeks focused on refactoring to support custom plugins
You can try it now at github.com/aerogear/graphback

<!--truncate-->

The main purpose of Graphback is to provide an autogenerated GraphQL based CRUD API for developers and their various use cases. Graphback differs from other GraphQL based solutions by utilizing code generation and application templates as a quick way to get started. This gives developers the ultimate flexibility that was recognized by our community. The CRUD API can be added to existing projects or function as standalone service.

## Why have we rewritten Graphback?

When working with the community we identified multiple ways people want to add a CRUD API to their applications:

- Generating source code on top of popular application template
- Adding a CRUD layer to their application
- Fully managed GraphQL Enabled RealTime Database

We had implemented those use cases to satisfy the needs of our community but quickly realized that we cannot support so many of them and at the same time actively address feature requests from the community. Our architecture used a single way to build metadata for generating source code for various artifacts like resolvers, client-side documents, etc. This prevented us from satisfying the API use cases that were often excluding each other.

We faced the problem that many open source projects have at some time:

- Do we introduce changes gradually and slowly to not break current community, knowing that we are constrained by our architecture
- Rewrite entire engine and introduce "uber" breaking change to not break clients in the future

## How we approached the problem

After more than 1000 commits and 2 years of continuous maintenance we knew we needed some radical steps to make Graphback valid competitor to other GraphQL based Real-Time Database solutions.
Influenced by discussions with the community and our core contributors, we have made the choice to stop accepting changes to the master branch and rewrite the entire Graphback ecosystem. Amount of changes we have done significantly exceeded our imagination.
Feature branch after refactorTo make refactoring efficient our core team (@craicoverflow and @wtrocki) started working with the concept of micro sprints (1 day of work PR's, demos and planning) which went really well and helped us to get things done in a very short timeframe.
We were really dynamic in terms of the execution and collaborating on the entire codebase without significant conflicts. Constant reviews also kept the entire team in the loop in terms of the goals we wanted to achieve.

![](https://cdn-images-1.medium.com/max/800/1*fcLi7AQV4zCIctYaCISMWw.png)

## Results of the refactor

When doing refactoring we tried to resolve many different issues that we faced to make sure that our architecture will be stable and have less breaking changes in the future.

### Flexibility to extend and create generator plugins

Plugins allow the developer to modify result schema that will be decorated with queries and mutations following CRUD spec. Plugins also allow developers to generate files like resolvers or graphql queries. Graphback Core package provides a common set of helpers that can be used by plugin developers to minimize the amount of work needed for any customizations. Plugins are loaded dynamically from the configuration:

![](https://cdn-images-1.medium.com/max/800/1*gjlXzz5T_iV_fwl--HMGBA.png)

### One size cannot fit all

Thanks to introducing plugins we can now support various different use cases for source generation. Developers can simply change one of the generators like resolvers or clients to satisfy their needs. Graphback comes with its own opinionated plugins that are easy to extend (and maintain :) ).

### Lack of the Standard for CRUD operations in GraphQL
Graphback was using unwritten and undocumented CRUD specification that was driven by Graphback core. We have explored existing specifications like https://www.opencrud.org and decided that we need something more dynamic, but also defined so developers will understand how CRUD API is built. That is why Graphback has its own CRUD specification that is documented and strictly followed in every plugin. Plugin based architecture allows to dynamically extend specification if needed.

### Confusing configuration

Graphback.json configuration file was causing many issues with compatibility. We did not clearly specify that the default migration package relies on the Knex.js Database Migrations. Some of the configuration options led developers to confusion and wrong assumptions that we are supporting only the Postgress database.
That is why our team decided to adopt an industry-standard configuration format: https://graphql-config.com. Using GraphQL-Config not only helped us to standardize our own configuration but also allowed us to merge with the existing ecosystem of the GraphQL-CLI and other tools that integrate with the Config.

### Runtime Layer to swap data layer without code generation
Source code generation has its own advantages and problems. When generating source code for the entire server layer we quickly realized that operating directly on the database queries will lead to possible problems with maintenance. We could not control our API and cater to many different patterns that developers wanted to use. We felt that we need to provide another abstraction on how CRUD API is done to allow developers to dynamically swap implementations without dealing with 'joys of code generation' like unit testing, string concatenation, and source formatting.
Basing on that we have to build Graphback runtime package.

Runtime package gives developers 2 abstractions:
- Service layer for implementing various capabilities like authentication, logging etc.
- DB layer to implement data access and table to model mapping

![](https://cdn-images-1.medium.com/max/800/0*d76z_IPJf84_zgGF.png)

### Ability to use different data sources for model

Thanks to introducing runtime layer developers can dynamically swap the data sources for specific models. Our CRUD interfaces no longer require supplying the table names. Instead, every model will get their own dedicated service that is available as part of the context and used in generated resolvers

![](https://cdn-images-1.medium.com/max/800/1*Nx2hDAoIlKi2h8zO5xKmvA.png)

### GraphQL Annotations instead of directives
Using GraphQL Directives is very beneficial in situations when we want to associate some specific behavior to them when the query is being executed.
In Graphback directives were used as markers to annotate some specific fields or types with additional metadata used in Generation. We have quickly realized that directives are a very bad choice for this use case as they need to be always supplied to the schema or removed before writing schema to the filesystem. After numerous issues, we found out and started using alternative package called graphql-metadata. The metadata package allows us to utilize comment format to specify requirements for the generator engine or even various table or field mappings that normally would require dozens of directives.
Type annotated with modelMetadata is really easy to use and offers simple way of supplying your own markers in plugins. For more info please refer to package docs: https://github.com/aerogear/graphql-metadata

![](https://miro.medium.com/max/241/1*3ExjUftH6QiLV420pifXXA.png)

### Opt-in Schema Type processing

Every model/GraphQL Type needs to be now annotated by model the directive in order to be processed by generators. Developers can adopt Graphback gradually by annotating one or more types by model while having the rest of the schema working with their own resolvers. Generated resolvers can be merged with developer supplied ones by simply merging 2 objects together or using graphql-toolkit to load them from different folders.

### A different way of writing custom resolvers

We found out that custom resolvers generation is not desired by the community especially when Graphback is added to existing GraphQL project that has already implemented resolvers.
Graphback no longer generates custom resolvers (resolvers outside CRUD specification). Developers can merge their own resolvers with generated ones using helpers available in the sample applications and documented in our docs.

## When I can get it released?

We are currently working on documentation and minor improvements. 
Please follow our repository for upcoming releases. In the meantime, you can also try out our sample applications on the Graphback master branch.
## How I can migrate?

If you have been using GraphQL CLI to start your project migration will require only to update `graphqlrc.yaml` file with the new graphback config.
## Will Graphback Support X?

Thanks to plugin-based generators and runtime Graphback can work now with any data source (new or existing). Create or connect to existing databases etc. If you looking to migrate from solutions like AppSync, Prisma or Hasura feel free to create an issue explaining your use case.

## How I can get started with Graphback
Star our repository: https://github.com/aerogear/graphback
Follow our getting started: https://graphback.dev/docs/gettingstarted
# Multi-document Atomicity in Mongoose (MongoDB)

A short example to show how to use MongoDB's v4.x multi-document transactions in `mongoose`.

This was adopted from the official MongoDB example [here](https://www.mongodb.com/blog/post/quick-start-nodejs--mongodb--how-to-implement-transactions) but instead of the native mongo client we use `mongoose`.

## Setup

Follow the instructions [in the "Set Up" section here](https://www.mongodb.com/blog/post/quick-start-nodejs--mongodb--how-to-implement-transactions). Then in your shell:

```bash
yarn
DB_URI='your_mongo_atlas_uri' node init
DB_URI='your_mongo_atlas_uri' node transactions
```

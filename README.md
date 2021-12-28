# Twitch Logger

Twitch Logger is a third-party app built to log user messages in specified channels. Backend is built using Typescript with Express and PostgreSQL. Frontend is made with React.

## Installation

Use Docker to deploy app

```bash
docker-compose up --build
```

## API

## Query a user's chat history in a channel

### Request

`GET /chat/:channel`

### Parameters

| Parameter | Description | Required |
| ----- | ----- | ----- |
| username | Name of user to search | Yes |
| limit | Limit number of messages in response | No |
| skip | Skip a number of messages | No |

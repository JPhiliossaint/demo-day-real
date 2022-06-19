## Installation

1. Clone repo
2. run `npm install`

## Usage

1. run `node server.js`
2. Navigate to `localhost:8080`

## Credit

Modified from Scotch.io's auth tutorial


## TODO LIST

- Create a form on event detail page to add comments:
  - event ID
  - poster ID
  - content
  - date

  - POST /post/:id/comment

- Fetch comments for a given event from active user:
  -

- Swap content from text to audio recording
  - Creation
    - Record audio on client-side in JavaScript (using MediaStream API)
    - Upload Blob to server
    - Store blob in MongoDB
  - Reading
    - Fetch blob from MongoDB and send to client
    - Play blob on client-side (using <audio> tag)# demo-day-real

const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const amqp = require("amqplib")

const historyRouter = require('./routes/historyRouter')
dotenv.config({
    path: ".env.local"
})

const app = express()
const PORT = process.env.PORT

app.use(cors())

app.use("/api/history", historyRouter)
app.use("/", (req, res) => res.status(200).json({status: "OK"}))
app.listen(PORT, () => {
    console.log(`Question history service connected on port ${PORT}`);
});


const RABBIT_MQ_HOST = process.env.RABBIT_MQ_HOST ? process.env.RABBIT_MQ_HOST : 'amqp://guest:guest@localhost:5672'
const queueName = "questionHistoryAddEntry"

async function startConsumer() {
    try {
      // Connect to RabbitMQ
      const connection = await amqp.connect(RABBIT_MQ_HOST);
      const channel = await connection.createChannel();
  
      // Declare a queue (must match the queue you want to consume from)
      await channel.assertQueue(queueName);
  
      // Consume messages from the queue
      channel.consume(queueName, (message) => {
        if (message.content) {
          const messageData = JSON.parse(message.content.toString('utf-8'));

          // TODO verification
          console.log(messageData.user_cookie)

          const foo = message.content.toString('utf-8');

          const tokenBody = foo.split('.')[1]
          let buffer = JSON.parse(atob(tokenBody))
          const user_id = buffer.user_data.user_id
          console.log(user_id)

          console.log(messageData.question)

          console.log(messageData.attempt)
          console.log(messageData.timestamp)

          // console.log(user_id)
          // Process the message as needed
  
          // Acknowledge the message to remove it from the queue
          channel.ack(message);
        }
      });
  
      console.log(`Consumer is listening for messages in the "${queueName}" queue.`);
    } catch (error) {
      console.error('Error starting consumer:', error);
    }
}

startConsumer();
import express from "express";
import axios from "axios";
import logger from "./logger/logger";
import { config } from "dotenv";
config(); // Load environment variables from .env file

const app = express();
const port = 3011;

const numbers = [
  "6282144440522",
  "6282146588675",
  "6281401655354",
  "6282146588675",
  "6281805624785",
  "6287734684276",
  "6281246444053",
  "62818055624785",
  "6282385469534",
  "6285333572332",
  "6281936073771",
  "6289670122223",
  "6281567787229",
  "6219163852740",
  "6281246071765",
  "6281805624785",
  "6285735687578",
  "6281239383003",
  "62895389454328",
  "6282145279102",
  "6287761582395",
  "6281567787229",
  "6285338006528",
  "628133799994",
  "6281376888448",
  "6281936261167",
  "62812386828009",
  "6283109674897",
  "6285693772948",
  "6281997151513",
  "6288214791523",
  "6281237422123",
  "6281338547979",
  "6281338388788",
  "6281338388788",
  "6281338388788",
  "6287760369681",
  "6281288151829",
  "6285941208049",
  "6285257775451",
  "62895420902447",
  "6281529227685",
  "6287761408767",
  "6287789281666",
  "628154729896",
  "6281238595188",
];

// const numberBatch1 = [
//   "6282144440522",
//   "6282146588675",
//   "6281401655354",
//   "6282146588675",
//   "6281805624785",
//   "6287734684276",
//   "6281246444053",
//   "62818055624785",
//   "6282385469534",
//   "6285333572332",
//   "6281936073771",
// ];

// const numberBatch2 = [
//   "6289670122223",
//   "6281567787229",
//   "6219163852740",
//   "6281246071765",
//   "6281805624785",
//   "6285735687578",
//   "6281239383003",
//   "62895389454328",
//   "6282145279102",
//   "6287761582395",
//   "6281567787229",
// ];

// const numberBatch3 = [
//   "6285338006528",
//   "628133799994",
//   "6281376888448",
//   "6281936261167",
//   "62812386828009",
//   "6283109674897",
//   "6285693772948",
//   "6281997151513",
//   "6288214791523",
//   "6281237422123",
// ];

const numberBatch4 = [
  "6281338547979",
  "6281338388788",
  //   "6281338388788",
  //   "6281338388788",
  "6287760369681",
  "6281288151829",
  "6285941208049",
  "6285257775451",
  "62895420902447",
  "6281529227685",
  "6287761408767",
  "6287789281666",
  "628154729896",
  "6281238595188",
];

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/api/send-message", async (req, res) => {
  let successCount = 0;
  let errorCount = 0;

  const username = process.env.USERNAME!;
  const password = process.env.PASSWORD!;
  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  const apiUrl = "http://localhost:3010/send/message";
  const method = "POST";
  const message = `Selamat pagi Bapak/Ibu
Terimakasih sudah menggunakan layanan dari KPU Bali.
Untuk peningkatan pelayanan, mohon kesediaan waktunya untuk mengisi kuesioner pelayanan KPU Bali pada link https://bit.ly/SKMBali_2025
Terimakasih 👏🏼
#KPUMelayani
  `;

  logger.info(`Starting batch processing for ${numberBatch4.length} numbers`);

  for (const number of numberBatch4) {
    // check if number is on the whatsapp
    const checkApiUrl = "http://localhost:3010/user/check";
    try {
      logger.info(`Checking if number ${number} is on WhatsApp...`);

      const response = await axios.get(
        `${checkApiUrl}?phone=${number}@s.whatsapp.net`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      const isOnWhatsApp: boolean = response.data.results.is_on_whatsapp;

      if (isOnWhatsApp) {
        logger.info(`Number ${number} is on WhatsApp, sending message...`);
        // // send message
        const data = {
          phone: `${number}@s.whatsapp.net`,
          message,
          reply_message_id: "3EB089B9D6ADD58153C561",
          is_forwarded: false,
        };

        const response = await axios({
          method: method,
          url: apiUrl,
          data,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        });

        logger.info(
          `Message sent successfully to ${number} data: ${JSON.stringify(
            response.data
          )}`
        );

        successCount++;
      } else {
        logger.warn(`Number ${number} is not on WhatsApp`);

        errorCount++;
      }

      // timeout to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 20000));
    } catch (error) {
      console.log(error);

      res.status(500).json({
        status: "error",
        message: "Number is not on WhatsApp",
      });
    }
  }

  logger.info(
    `Batch processing completed: ${successCount} success, ${errorCount} errors`
  );

  res.status(200).json({
    status: "success",
    message: `Batch processing completed: ${successCount} success, ${errorCount} errors`,
  });
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});

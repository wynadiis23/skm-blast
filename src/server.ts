import express from "express";
import axios from "axios";
import logger from "./logger/logger";
import { config } from "dotenv";
config(); // Load environment variables from .env file

type notOnWhatsapp = {
  no: number;
  nama: string;
  jabatan: string;
  no_handphone: string;
}

const app = express();
const port = 3011;
const waPort = 3012;
const whatsappApiProtocol = process.env.WHATSAPP_API_PROTOCOL ?? "http";
const whatsappApiHost = process.env.WHATSAPP_API_HOST ?? "localhost";
const whatsappApiPort = process.env.WHATSAPP_API_PORT ?? String(waPort);
const whatsappApiBaseUrl = `${whatsappApiProtocol}://${whatsappApiHost}:${whatsappApiPort}`;
const notOnWhatsapp: notOnWhatsapp[] = [];

const filtered_responden = [
  {
        "no": 25,
        "nama": "Ni Mode Claudia F.",
        "jabatan": "FISIP",
        "no_handphone": "6282135268472"
    },
    {
        "no": 32,
        "nama": "Dienyus Fandri Mardini",
        "jabatan": "FISIP",
        "no_handphone": "6282292877535"
    },
    {
        "no": 33,
        "nama": "Gelen Laya Nyanyi",
        "jabatan": "FISIP",
        "no_handphone": "6282350430242"
    },
    {
        "no": 36,
        "nama": "Isti Nury Kurnia Diani",
        "jabatan": "FISIP",
        "no_handphone": "6281296324696"
    },
    {
        "no": 40,
        "nama": "Berta Putri Dewi",
        "jabatan": "FISIP",
        "no_handphone": "6285943423144"
    },
    {
        "no": 68,
        "nama": "Mizmah Prima Novia P.",
        "jabatan": "Mahasiswi Fisip",
        "no_handphone": "6289507158741"
    }
];

const getTimeoutMs = () => {
  const minTimeoutMs = 60000;
  const maxTimeoutMs = 120000;

  return Math.floor(
    Math.random() * (maxTimeoutMs - minTimeoutMs + 1)
  ) + minTimeoutMs;
};
// const filtered_responden = [
//   {
//     "no": 5,
//     "nama": "Sesa Putra",
//     "jabatan": "Mahasiswa FISIP",
//     "no_handphone": "6285739481215"
//   }
// ]

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/api/send-message", async (req, res) => {
  let successCount = 0;
  let errorCount = 0;
  let failedNumbers: string[] = [];

  const username = process.env.USERNAME!;
  const password = process.env.PASSWORD!;
  const deviceId = process.env.DEVICE_ID!;
  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  const apiUrl = `${whatsappApiBaseUrl}/send/message`;
  const method = "POST";
  const commonHeaders = {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
    "X-Device-Id": deviceId,
  };
  const message = `Selamat sore, Bapak/Ibu! 👋

Terima kasih telah menerima kehadiran kami dan berpartisipasi aktif dalam kegiatan Sosialisasi & Pendidikan Pemilih KPU Bali. Kehadiran kami di tengah-tengah Anda adalah komitmen kami untuk mewujudkan pemilih yang cerdas dan cermat.

Agar kami bisa terus berbenah, kami sangat ingin mendengar kesan dan masukan dari Anda. Yuk, luangkan waktu sejenak untuk mengisi kuesioner singkat pada tautan berikut:
🔗 https://bit.ly/KPUBALISKM_LayananPendidikanPemilih

Setiap masukan dari Anda akan sangat berarti bagi kami dalam mengemas program sosialisasi yang lebih menarik, kreatif, dan bermanfaat ke depannya. Matur suksma! 🙏✨

#KPUMelayani #KPUProvinsiBali
  `;

  logger.info(
    `Starting batch processing for ${filtered_responden.length} responden`
  );

  for (const responden of filtered_responden) {
    const name = responden.nama;
    const number = responden.no_handphone;

    // check if number is on the whatsapp
    const checkApiUrl = `${whatsappApiBaseUrl}/user/check`;
    try {
      logger.info(
        `Checking WhatsApp status for name=${name}, number=${number}...`
      );

      const response = await axios.get(
        `${checkApiUrl}?phone=${number}@s.whatsapp.net`,
        {
          headers: commonHeaders,
        }
      );

      const isOnWhatsApp: boolean = response.data.results.is_on_whatsapp;

      if (isOnWhatsApp) {
        logger.info(
          `Number is on WhatsApp, sending message to name=${name}, number=${number}...`
        );
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
          headers: commonHeaders,
        });

        logger.info(
          `Message sent successfully to name=${name}, number=${number}, data=${JSON.stringify(
            response.data
          )}`
        );

        successCount++;
      } else {
        logger.warn(`Number is not on WhatsApp for name=${name}, number=${number}`);

        errorCount++;
        failedNumbers.push(number);
        notOnWhatsapp.push({
          no: responden.no,
          nama: responden.nama,
          jabatan: responden.jabatan,
          no_handphone: responden.no_handphone
        });
      }

      // timeout to avoid rate limiting
      const timeoutMs = getTimeoutMs();
      logger.info(
        `Waiting ${timeoutMs}ms before processing next responden name=${name}, number=${number}`
      );
      await new Promise((resolve) => setTimeout(resolve, timeoutMs));
    } catch (error) {
      console.log(error);
      logger.error(
        `Failed to process message for name=${name}, number=${number}: ${String(
          error
        )}`
      );
      errorCount++;
      failedNumbers.push(number);
    }
  }

  logger.info(
    `Batch processing completed: ${successCount} success, ${errorCount} errors`
  );

  logger.info(`Failed numbers: ${JSON.stringify(failedNumbers)}`);
  logger.info(`Not on WhatsApp: ${JSON.stringify(notOnWhatsapp)}`);

  res.status(200).json({
    status: "success",
    message: `Batch processing completed: ${successCount} success, ${errorCount} errors`,
    failed_numbers: failedNumbers,
    not_on_whatsapp: notOnWhatsapp
  });
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});

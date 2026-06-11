const { formidable } = require("formidable");
const fs = require("fs");

module.exports.config = {
  api: {
    bodyParser: false,
  },
};

const CHAT_IDS = [
  process.env.CHAT_ID,
];

const BOT_TOKEN = process.env.BOT_TOKEN;

async function sendTextToAll(text) {
  for (const chat_id of CHAT_IDS) {
    if (!chat_id) continue;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id,
        text,
      }),
    });
  }
}

async function sendPhotoToAll(formData) {
  for (const chat_id of CHAT_IDS) {
    if (!chat_id) continue;

    const fd = new FormData();
    for (const [k, v] of formData.entries()) {
      fd.append(k, v);
    }
    fd.set("chat_id", chat_id);

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: "POST",
      body: fd,
    });
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST");
  }

  const form = formidable({});

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    try {
      const now = new Date().toLocaleString("ru-RU", {
  timeZone: "Asia/Irkutsk",
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

      if (fields.type === "text") {
        const message = `${now}

https://homupage.vercel.app/

Новое анонимное сообщение: ${fields.text || ""}
        `;

        await sendTextToAll(message);

        return res.status(200).json({ ok: true});
      }

      const fileArr = files.file;
      const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;

      if (!file?.filepath) {
        return res.status(400).json({ error: "No file" });
      }

      const caption = `${now}

https://homupage.vercel.app/

Новое анонимное изображение!`;

      const buffer = fs.readFileSync(file.filepath);

      const formData = new FormData();
      formData.append("photo", new Blob([buffer]), "image.png");
      formData.append("caption", caption);

      await sendPhotoToAll(formData);

      return res.status(200).json({ ok: true});
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  });
};

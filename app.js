// 🔥 Supabase config (تو خودت دادی)
const supabaseUrl = "https://jmnitzgspenxnzdffeku.supabase.co";
const supabaseKey = "sb_publishable_iDTlvh6uyYGmxV-2ubBw7g_mu1QBKTb";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let username = "";

// ورود به چت
async function enterChat() {
  const input = document.getElementById("nameInput").value.trim();
  if (!input) return alert("Enter name!");

  // check user
  const { data, error } = await supabaseClient
    .from("active_users")
    .select("*")
    .eq("name", input)
    .maybeSingle();

  if (error) {
    alert("Error!");
    return;
  }

  username = input;

  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("chatBox").classList.remove("hidden");

  loadMessages();
  subscribeMessages();
}

// ارسال پیام
async function sendMessage() {
  const msgInput = document.getElementById("msgInput");
  const fileInput = document.getElementById("fileInput");

  const sendBtn = document.getElementById("sendBtn");

  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";

  const message = msgInput.value;
  let mediaUrl = null;
  let mediaType = null;

  // اگر فایل هست
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];

    mediaUrl = await uploadMedia(file);

    if (file.type.startsWith("image")) {
      mediaType = "image";
    } else if (file.type.startsWith("video")) {
      mediaType = "video";
    }
  }

  await supabaseClient
    .from("messages")
    .insert([
      {
        name: username,
        message: message,
        media_url: mediaUrl,
        media_type: mediaType
      }
    ]);

  msgInput.value = "";
  fileInput.value = "";

  sendBtn.disabled = false;
  sendBtn.textContent = "Send";
}

// لود پیام‌ها
async function loadMessages() {
  const { data } = await supabaseClient
    .from("messages")
    .select("*")
    .order("id", { ascending: true });

  renderMessages(data);
}

// نمایش پیام‌ها
function renderMessages(messages) {
  const box = document.getElementById("messages");
  box.innerHTML = "";

  messages.forEach(m => {
    const div = document.createElement("div");
    div.className = "msg";

    let mediaHTML = "";

    if (m.media_type === "image") {
      mediaHTML = `<br><img src="${m.media_url}" style="max-width:200px;border-radius:10px;">`;
    }

    if (m.media_type === "video") {
      mediaHTML = `<br><video src="${m.media_url}" controls style="max-width:200px;border-radius:10px;"></video>`;
    }

    div.innerHTML = `
      <span class="name">${m.name}:</span> ${m.message || ""}
      ${mediaHTML}
    `;

    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
}




async function uploadMedia(file) {
  const fileName = `${Date.now()}-${file.name}`;

  const { data, error } = await supabaseClient
    .storage
    .from("chat-media")
    .upload(fileName, file);

  if (error) {
    console.log(error);
    return null;
  }

  const { data: publicUrl } = supabaseClient
    .storage
    .from("chat-media")
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
}




window.addEventListener("beforeunload", async () => {
  if (!username) return;

  await supabaseClient
    .from("active_users")
    .update({
      is_online: false,
      last_seen: new Date()
    })
    .eq("name", username);
});





function fakeProgress() {

  const bar = document.getElementById("uploadBar");
  const container = document.getElementById("uploadContainer");

  container.classList.remove("hidden");

  let progress = 0;

  const interval = setInterval(() => {

    progress += Math.random() * 12;

    if (progress > 90) {
      progress = 90;
    }

    bar.style.width = progress + "%";

  }, 150);

  return {
    finish() {
      clearInterval(interval);
      bar.style.width = "100%";

      setTimeout(() => {
        container.classList.add("hidden");
        bar.style.width = "0%";
      }, 500);
    }
  };
}




// realtime listener
function subscribeMessages() {
  supabaseClient
    .channel("messages-channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages"
      },
      (payload) => {
        loadMessages();
      }
    )
    .subscribe();
}

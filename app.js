// 🔥 Supabase config (تو خودت دادی)
const supabaseUrl = "https://jmnitzgspenxnzdffeku.supabase.co";
const supabaseKey = "sb_publishable_iDTlvh6uyYGmxV-2ubBw7g_mu1QBKTb";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let username = "";

// ورود به چت
function enterChat() {
  const input = document.getElementById("nameInput").value;
  if (!input) return alert("Enter name!");

  username = input;

  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("chatBox").classList.remove("hidden");

  loadMessages();
  subscribeMessages();
}

// ارسال پیام
async function sendMessage() {
  const msgInput = document.getElementById("msgInput");
  const message = msgInput.value;

  if (!message) return;

  await supabaseClient
    .from("messages")
    .insert([
      {
        name: username,
        message: message
      }
    ]);

  msgInput.value = "";
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
    div.innerHTML = `<span class="name">${m.name}:</span> ${m.message}`;
    box.appendChild(div);
  });

  box.scrollTop = box.scrollHeight;
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
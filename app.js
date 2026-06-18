// 🔥 Supabase config (تو خودت دادی)
const supabaseUrl = "https://jmnitzgspenxnzdffeku.supabase.co";
const supabaseKey = "sb_publishable_iDTlvh6uyYGmxV-2ubBw7g_mu1QBKTb";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let username = "";
let ownerId = "";
let replyToId = null;
let replyToText = null;
let replyToName = null;
let unreadMentions = [];
let editingMessageId = null;




function generateUsername() {

  const number =
    Math.floor(
      1000 + Math.random() * 9000
    );

  const letter =
    String.fromCharCode(
      65 +
      Math.floor(
        Math.random() * 26
      )
    );

  return `LM${number}${letter}`;
}






async function generateUniqueUsername() {

  while (true) {

    const candidate =
      "LM" +
      Math.floor(
        1000 +
        Math.random() * 9000
      );

    const { data } =
      await supabaseClient
        .from("active_users")
        .select("name")
        .eq("name", candidate)
        .maybeSingle();

    if (!data) {
      return candidate;
    }
  }
}







// ورود به چت
async function enterChat() {

  let savedName =
    localStorage.getItem(
      "copyright_username"
    );

  if (!savedName) {

    savedName =
      generateUsername();

    localStorage.setItem(
      "copyright_username",
      savedName
    );
  }

  username = savedName;


  let savedOwnerId =
    localStorage.getItem(
      "copyright_owner_id"
    );

  if (!savedOwnerId) {

    savedOwnerId =
      crypto.randomUUID();

    localStorage.setItem(
      "copyright_owner_id",
      savedOwnerId
    );
  }

  ownerId = savedOwnerId;


  document
    .getElementById("loginBox")
    .classList
    .add("hidden");

  document
    .getElementById("chatBox")
    .classList
    .remove("hidden");



  document
    .getElementById("myUsername")
    .textContent =
    `You: ${username}`;

  loadMessages();
  subscribeMessages();
}

// ارسال پیام
async function sendMessage() {

  const msgInput = document.getElementById("msgInput");
  const fileInput = document.getElementById("fileInput");

  const message =
    msgInput.value.trim();

  const sendBtn = document.getElementById("sendBtn");

  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";

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

  if (editingMessageId !== null) {


    console.log(
  "EDITING ID:",
  editingMessageId
);

  const { data, error } =
    await supabaseClient
      .from("messages")
      .update({
        message: message,
        edited: true
      })
      .eq("id", editingMessageId)
      .select();

  console.log("EDIT RESULT:", data);
  console.log("EDIT ERROR:", error);

  if (error) {
    alert(error.message);
    return;
  }

  editingMessageId = null;

  msgInput.value = "";

  sendBtn.disabled = false;
  sendBtn.textContent = "Send";

  loadMessages();

  return;
}


  await supabaseClient
    .from("messages")
    .insert([
      {
        name: username,
        owner_id: ownerId,
        message: message,
        reply_to_id: replyToId,
        reply_to_text: replyToText,
        reply_to_name: replyToName,
        media_url: mediaUrl,
        media_type: mediaType
      }
    ]);

  cancelReply();

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

  const box =
    document.getElementById("messages");

  box.innerHTML = "";

  messages.forEach(m => {

    const div =
      document.createElement("div");

    div.id = `msg-${m.id}`;

    div.className = "msg";

    const isMine =
      m.owner_id === ownerId;



    if (isMine) {
      div.classList.add("self");
    }

    let mediaHTML = "";

    if (m.media_type === "image") {
      mediaHTML =
        `<br><img src="${m.media_url}" style="max-width:200px;border-radius:10px;">`;
    }

    if (m.media_type === "video") {
      mediaHTML =
        `<br><video src="${m.media_url}" controls style="max-width:200px;border-radius:10px;"></video>`;
    }

    // اول ساخته میشه


    let editBtn = "";

    if (isMine) {

      editBtn = `
  <button
    class="editBtn"
    onclick="startEdit(
      ${m.id},
      \`${(m.message || "").replace(/`/g, "\\`")}\`
    )"
  >
    ✏️
  </button>
  `;
    }


    let deleteBtn = "";

    let replyBtn = `
<button
class="replyBtn"
onclick="setReply(
${m.id},
'${(m.message || "").replace(/'/g, "\\'")}',
'${m.name}'
)">
↩
</button>
`;

    if (isMine) {

      deleteBtn = `
      <button
        class="deleteBtn"
        onclick="deleteMessage(${m.id})"
      >
        🗑
      </button>
      `;
    }

    let replyHTML = "";

    if (m.reply_to_id) {

      replyHTML = `
<div
  class="replyPreview clickableReply"
  onclick="jumpToMessage(${m.reply_to_id})"
>

  <b>${m.reply_to_name}</b>

  <br>

  ${m.reply_to_text}

</div>
`;
    }

    let formattedMessage =
      m.message || "";

    formattedMessage =
      formattedMessage.replace(
        /@([a-zA-Z0-9_]+)/g,
        '<span class="mention">@$1</span>'
      );


    // بعد استفاده میشه


    let editedHTML = "";

    if (m.edited) {

      editedHTML =
        `<div class="editedLabel">
     edited
   </div>`;
    }



    div.innerHTML = `
  <div class="msgHeader">

    <span class="name">
      ${m.name}
    </span>

    ${replyBtn}
${editBtn}
${deleteBtn}

  </div>

  ${replyHTML}

  ${formattedMessage}

${mediaHTML}

${editedHTML}
`;


    const mentionTag = `@${username}`;

    if (
      m.message &&
      m.message.includes(mentionTag)
    ) {

      div.classList.add("mentioned");

      if (
        m.owner_id !== ownerId &&
        !unreadMentions.includes(m.id)
      ) {

        unreadMentions.push(m.id);

        updateMentionBadge();
      }
    }


    box.appendChild(div);

  });



  box.scrollTop =
    box.scrollHeight;
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




async function deleteMessage(id) {

  console.log("DELETE CLICKED:", id);

  const ok = confirm("Delete this message?");

  if (!ok) return;

  const { data, error } =
    await supabaseClient
      .from("messages")
      .delete()
      .eq("id", id)
      .select();

  console.log("DELETE RESULT:", data);
  console.log("DELETE ERROR:", error);

  if (error) {
    alert(error.message);
    return;
  }

  loadMessages();
}



function setReply(id, text, name) {

  replyToId = id;

  replyToText = text;

  replyToName = name;

  document
    .getElementById("replyBox")
    .classList
    .remove("hidden");

  document
    .getElementById("replyInfo")
    .innerHTML =
    `<b>${name}</b>: ${text}`;
}

function cancelReply() {

  replyToId = null;
  replyToText = null;
  replyToName = null;

  document
    .getElementById("replyBox")
    .classList
    .add("hidden");
}


function jumpToMessage(id) {

  const target =
    document.getElementById(`msg-${id}`);

  if (!target) return;

  target.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  target.classList.add("highlighted");

  setTimeout(() => {

    target.classList.remove(
      "highlighted"
    );

  }, 2000);

}



function updateMentionBadge() {

  const badge =
    document.getElementById(
      "mentionBadge"
    );

  const count =
    document.getElementById(
      "mentionCount"
    );

  count.textContent =
    unreadMentions.length;

  if (unreadMentions.length > 0) {

    badge.classList.remove(
      "hidden"
    );

  } else {

    badge.classList.add(
      "hidden"
    );
  }
}

document
  .getElementById("mentionBadge")
  .addEventListener(
    "click",
    () => {

      if (
        unreadMentions.length === 0
      ) return;

      const lastMention =
        unreadMentions[
        unreadMentions.length - 1
        ];

      jumpToMessage(
        lastMention
      );

      unreadMentions = [];

      updateMentionBadge();

    }
  );







function startEdit(id, text) {

   console.log("START EDIT ID:", id);

  editingMessageId = id;

  editingMessageId = id;

  document
    .getElementById("msgInput")
    .value = text;

  const sendBtn =
    document.getElementById("sendBtn");

  sendBtn.textContent = "Edit";

  document
    .getElementById("msgInput")
    .focus();
}






// realtime listener
function subscribeMessages() {
  supabaseClient
    .channel("messages-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages"
      },
      () => {
        loadMessages();
      }
    )
    .subscribe();
}

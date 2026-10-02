// ==============================
// Kotaro Money
// ==============================

const STORAGE_KEY = "kotaroMoneyData";

// ==============================
// データ
// ==============================

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  balances: {
    cash: 0,
    olive: 0,
    paypay: 0,
    suica: 0
  },
  transactions: []
};

// ==============================
// 選択状態・編集ID
// ==============================

let selectedType = null;
let selectedAccount = null;
let selectedFrom = null;
let selectedTo = null;
let editingId = null; // 編集中のID（nullなら新規追加）

// ==============================
// 保存
// ==============================

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ==============================
// 金額表示
// ==============================

function formatMoney(amount) {
  return "¥" + Number(amount).toLocaleString("ja-JP");
}

// ==============================
// 残高表示
// ==============================

function updateBalances() {
  document.getElementById("cashBalance").textContent = formatMoney(data.balances.cash);
  document.getElementById("oliveBalance").textContent = formatMoney(data.balances.olive);
  document.getElementById("paypayBalance").textContent = formatMoney(data.balances.paypay);
  document.getElementById("suicaBalance").textContent = formatMoney(data.balances.suica);
}

// ==============================
// 今月の収支
// ==============================

function updateMonthlySummary() {
  const now = new Date();
  let income = 0;
  let expense = 0;

  data.transactions.forEach(transaction => {
    const date = new Date(transaction.date);

    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    ) {
      if (transaction.type === "income") {
        income += transaction.amount;
      }
      if (transaction.type === "expense") {
        expense += transaction.amount;
      }
    }
  });

  document.getElementById("monthlyIncome").textContent = formatMoney(income);
  document.getElementById("monthlyExpense").textContent = formatMoney(expense);
  document.getElementById("monthlyBalance").textContent = formatMoney(income - expense);
}

// ==============================
// 取引一覧
// ==============================

function updateTransactions() {
  const list = document.getElementById("transactionList");
  list.innerHTML = "";

  const transactions = [...data.transactions].reverse();

  transactions.forEach(transaction => {
    const div = document.createElement("div");
    div.className = "transaction";

    const info = document.createElement("div");
    info.className = "transaction-info";

    const title = document.createElement("strong");
    title.textContent = transaction.title;

    const date = document.createElement("span");
    date.className = "transaction-date";
    const dateObject = new Date(transaction.date);
    date.textContent = dateObject.toLocaleString("ja-JP");

    info.appendChild(title);
    info.appendChild(date);

    const right = document.createElement("div");
    const amount = document.createElement("strong");

    if (transaction.type === "income") {
      amount.textContent = "+" + formatMoney(transaction.amount);
      amount.className = "income";
    } else if (transaction.type === "expense") {
      amount.textContent = "-" + formatMoney(transaction.amount);
      amount.className = "expense";
    } else {
      amount.textContent = "移動 " + formatMoney(transaction.amount);
    }

    right.appendChild(amount);

    // 編集ボタン
    const editButton = document.createElement("button");
    editButton.textContent = "編集";
    editButton.onclick = () => editTransaction(transaction.id);

    // 削除ボタン
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "削除";
    deleteButton.onclick = () => deleteTransaction(transaction.id);

    right.appendChild(editButton);
    right.appendChild(deleteButton);

    div.appendChild(info);
    div.appendChild(right);

    list.appendChild(div);
  });
}

// ==============================
// モーダル制御
// ==============================

const modal = document.getElementById("modal");
const addButton = document.getElementById("addButton");
const closeModal = document.getElementById("closeModal");

addButton.addEventListener("click", () => {
  editingId = null; // 新規モード
  document.getElementById("modalTitle").textContent = "取引を追加";
  document.getElementById("saveTransaction").textContent = "追加する";
  openModal();
});

closeModal.addEventListener("click", closeModalWindow);

function openModal() {
  modal.classList.remove("hidden");
  if (editingId === null) {
    resetForm();
  }
}

function closeModalWindow() {
  modal.classList.add("hidden");
}

// ==============================
// フォームリセット
// ==============================

function resetForm() {
  selectedType = null;
  selectedAccount = null;
  selectedFrom = null;
  selectedTo = null;

  document.getElementById("titleInput").value = "";
  document.getElementById("amountInput").value = "";

  document.querySelectorAll(".choice-button").forEach(button => {
    button.classList.remove("selected");
  });

  document.getElementById("accountArea").classList.remove("hidden");
  document.getElementById("transferArea").classList.add("hidden");
}

// ==============================
// 各種選択ボタンのイベント設定
// ==============================

// 種類選択
document.querySelectorAll(".type-button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".type-button").forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    selectedType = button.dataset.type;

    if (selectedType === "transfer") {
      document.getElementById("accountArea").classList.add("hidden");
      document.getElementById("transferArea").classList.remove("hidden");
    } else {
      document.getElementById("accountArea").classList.remove("hidden");
      document.getElementById("transferArea").classList.add("hidden");
    }
  });
});

// 通常の口座選択
document.querySelectorAll(".account-button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".account-button").forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    selectedAccount = button.dataset.account;
  });
});

// 移動元
document.querySelectorAll(".from-button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".from-button").forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    selectedFrom = button.dataset.account;
  });
});

// 移動先
document.querySelectorAll(".to-button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".to-button").forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    selectedTo = button.dataset.account;
  });
});

// ==============================
// 取引追加・編集の保存処理
// ==============================

document.getElementById("saveTransaction").addEventListener("click", saveTransaction);

function saveTransaction() {
  const title = document.getElementById("titleInput").value.trim();
  const amount = Number(document.getElementById("amountInput").value);

  if (!selectedType) { alert("種類を選択してください"); return; }
  if (!title) { alert("タイトルを入力してください"); return; }
  if (!amount || amount <= 0) { alert("正しい金額を入力してください"); return; }

  // 編集中の場合は、まず古い取引の残高反映を巻き戻す
  if (editingId !== null) {
    const oldTx = data.transactions.find(t => t.id === editingId);
    if (oldTx) {
      revertBalance(oldTx);
    }
  }

  // 新規または編集後の残高計算とトランザクション作成
  if (selectedType === "income") {
    if (!selectedAccount) { alert("入金先を選択してください"); restoreIfEditing(); return; }
    data.balances[selectedAccount] += amount;

    if (editingId !== null) {
      updateExistingTransaction("income", title, amount, { account: selectedAccount });
    } else {
      addNewTransaction("income", title, amount, { account: selectedAccount });
    }
  } 
  else if (selectedType === "expense") {
    if (!selectedAccount) { alert("支払い方法を選択してください"); restoreIfEditing(); return; }
    if (data.balances[selectedAccount] < amount) { alert("残高が足りません"); restoreIfEditing(); return; }
    data.balances[selectedAccount] -= amount;

    if (editingId !== null) {
      updateExistingTransaction("expense", title, amount, { account: selectedAccount });
    } else {
      addNewTransaction("expense", title, amount, { account: selectedAccount });
    }
  } 
  else if (selectedType === "transfer") {
    if (!selectedFrom) { alert("移動元を選択してください"); restoreIfEditing(); return; }
    if (!selectedTo) { alert("移動先を選択してください"); restoreIfEditing(); return; }
    if (selectedFrom === selectedTo) { alert("移動元と移動先を別々にしてください"); restoreIfEditing(); return; }
    if (data.balances[selectedFrom] < amount) { alert("移動元の残高が足りません"); restoreIfEditing(); return; }

    data.balances[selectedFrom] -= amount;
    data.balances[selectedTo] += amount;

    if (editingId !== null) {
      updateExistingTransaction("transfer", title, amount, { from: selectedFrom, to: selectedTo });
    } else {
      addNewTransaction("transfer", title, amount, { from: selectedFrom, to: selectedTo });
    }
  }

  saveData();
  updateBalances();
  updateMonthlySummary();
  updateTransactions();
  closeModalWindow();
}

// 編集時にエラーが起きたとき、巻き戻した残高を戻すヘルパー
function restoreIfEditing() {
  if (editingId !== null) {
    const oldTx = data.transactions.find(t => t.id === editingId);
    if (oldTx) { applyBalance(oldTx); }
  }
}

function addNewTransaction(type, title, amount, details) {
  const newTx = {
    id: Date.now(),
    type: type,
    title: title,
    amount: amount,
    date: new Date().toISOString(),
    ...details
  };
  data.transactions.push(newTx);
}

function updateExistingTransaction(type, title, amount, details) {
  const index = data.transactions.findIndex(t => t.id === editingId);
  if (index !== -1) {
    data.transactions[index] = {
      ...data.transactions[index],
      type: type,
      title: title,
      amount: amount,
      ...details
    };
  }
}

// ==============================
// 削除
// ==============================

function deleteTransaction(id) {
  const transaction = data.transactions.find(t => t.id === id);
  if (!transaction) return;

  if (!confirm("この取引を削除しますか？")) return;

  revertBalance(transaction);

  data.transactions = data.transactions.filter(t => t.id !== id);

  saveData();
  updateBalances();
  updateMonthlySummary();
  updateTransactions();
}

// ==============================
// 残高の増減ヘルパー
// ==============================

function revertBalance(tx) {
  if (tx.type === "income") {
    data.balances[tx.account] -= tx.amount;
  } else if (tx.type === "expense") {
    data.balances[tx.account] += tx.amount;
  } else if (tx.type === "transfer") {
    data.balances[tx.from] += tx.amount;
    data.balances[tx.to] -= tx.amount;
  }
}

function applyBalance(tx) {
  if (tx.type === "income") {
    data.balances[tx.account] += tx.amount;
  } else if (tx.type === "expense") {
    data.balances[tx.account] -= tx.amount;
  } else if (tx.type === "transfer") {
    data.balances[tx.from] -= tx.amount;
    data.balances[tx.to] += tx.amount;
  }
}

// ==============================
// 編集（モーダルを開いて値をセット）
// ==============================

function editTransaction(id) {
  const transaction = data.transactions.find(t => t.id === id);
  if (!transaction) return;

  editingId = id;
  document.getElementById("modalTitle").textContent = "取引を編集";
  document.getElementById("saveTransaction").textContent = "変更を保存";

  // フォームに既存の値をセット
  document.getElementById("titleInput").value = transaction.title;
  document.getElementById("amountInput").value = transaction.amount;

  // ボタンの選択状態をリセット
  document.querySelectorAll(".choice-button").forEach(b => b.classList.remove("selected"));

  // 種類のボタンを選択
  const typeBtn = document.querySelector(`.type-button[data-type="${transaction.type}"]`);
  if (typeBtn) {
    typeBtn.classList.add("selected");
    selectedType = transaction.type;
  }

  // エリアの切り替え
  if (transaction.type === "transfer") {
    document.getElementById("accountArea").classList.add("hidden");
    document.getElementById("transferArea").classList.remove("hidden");

    selectedFrom = transaction.from;
    selectedTo = transaction.to;
    selectedAccount = null;

    const fromBtn = document.querySelector(`.from-button[data-account="${transaction.from}"]`);
    if (fromBtn) fromBtn.classList.add("selected");

    const toBtn = document.querySelector(`.to-button[data-account="${transaction.to}"]`);
    if (toBtn) toBtn.classList.add("selected");
  } else {
    document.getElementById("accountArea").classList.remove("hidden");
    document.getElementById("transferArea").classList.add("hidden");

    selectedAccount = transaction.account;
    selectedFrom = null;
    selectedTo = null;

    const accBtn = document.querySelector(`.account-button[data-account="${transaction.account}"]`);
    if (accBtn) accBtn.classList.add("selected");
  }

  // モーダルを開く
  openModal();
}

// ==============================
// アカウントキー・名前変換
// ==============================

function getAccountKey(name) {
  if (name === "現金") return "cash";
  if (name === "Olive") return "olive";
  if (name === "PayPay") return "paypay";
  if (name === "Suica") return "suica";
  return null;
}

function getAccountName(account) {
  if (account === "cash") return "現金";
  if (account === "olive") return "Olive";
  if (account === "paypay") return "PayPay";
  if (account === "suica") return "Suica";
}

// ==============================
// 残高表示 / 非表示
// ==============================

let balanceVisible = true;

document.getElementById("toggleBalance").addEventListener("click", () => {
  balanceVisible = !balanceVisible;

  const balances = document.querySelectorAll(".balance-card strong");

  balances.forEach(element => {
    if (balanceVisible) {
      const account = element.id.replace("Balance", "");
      element.textContent = formatMoney(data.balances[account]);
    } else {
      element.textContent = "••••";
    }
  });

  document.getElementById("toggleBalance").textContent = balanceVisible
    ? "👁 表示"
    : "🙈 非表示";
});

// ==============================
// 初期表示
// ==============================

updateBalances();
updateMonthlySummary();
updateTransactions();
// ==============================
// バックアップ（ファイル書き出し）
// ==============================

document.getElementById("exportButton").addEventListener("click", () => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  
  // ファイル名を日付付きにする（例: kotaro-money-backup-2026-10-02.json）
  const today = new Date().toISOString().split("T")[0];
  a.download = `kotaro-money-backup-${today}.json`;
  
  a.click();
  URL.revokeObjectURL(url);
});

// ==============================
// 復元（ファイル読み込み）
// ==============================

const importButton = document.getElementById("importButton");
const importFile = document.getElementById("importFile");

importButton.addEventListener("click", () => {
  importFile.click(); // 隠してあるファイル選択を開く
});

importFile.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!confirm("既存のデータがバックアップファイルの内容で上書きされますが、よろしいですか？")) {
    importFile.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // 最低限のデータ構造チェック
      if (!importedData.balances || !importedData.transactions) {
        throw new Error("無効なデータ形式です");
      }

      data = importedData;
      saveData();

      updateBalances();
      updateMonthlySummary();
      updateTransactions();

      alert("データを正常に復元しました！");
    } catch (error) {
      alert("ファイルの読み込みに失敗しました。正しいバックアップファイルを選択してください。");
    } finally {
      importFile.value = "";
    }
  };

  reader.readAsText(file);
});
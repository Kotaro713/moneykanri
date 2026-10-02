// =====================
// 初期データ・状態管理
// =====================
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentType = 'expense'; // デフォルトは支出
let selectedAccount = 'cash';
let fromAccount = 'cash';
let toAccount = 'olive';
let editingId = null; // 編集中のID（nullなら新規追加）
let hideBalance = false;

// DOM要素の取得
const cashBalanceEl = document.getElementById('cashBalance');
const oliveBalanceEl = document.getElementById('oliveBalance');
const paypayBalanceEl = document.getElementById('paypayBalance');
const suicaBalanceEl = document.getElementById('suicaBalance');
const monthlyIncomeEl = document.getElementById('monthlyIncome');
const monthlyExpenseEl = document.getElementById('monthlyExpense');
const monthlyBalanceEl = document.getElementById('monthlyBalance');
const transactionListEl = document.getElementById('transactionList');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const addButton = document.getElementById('addButton');
const closeModalButton = document.getElementById('closeModal');
const saveTransactionButton = document.getElementById('saveTransaction');
const toggleBalanceButton = document.getElementById('toggleBalance');

const titleInput = document.getElementById('titleInput');
const amountInput = document.getElementById('amountInput');
const accountArea = document.getElementById('accountArea');
const transferArea = document.getElementById('transferArea');

// =====================
// イベントリスナーの設定
// =====================
addButton.addEventListener('click', () => openModal());
closeModalButton.addEventListener('click', closeModal);
saveTransactionButton.addEventListener('click', saveTransaction);
toggleBalanceButton.addEventListener('click', toggleBalanceVisibility);

// 種類ボタン（収入・支出・口座移動）
document.querySelectorAll('.type-button').forEach(button => {
  button.addEventListener('click', (e) => {
    document.querySelectorAll('.type-button').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    currentType = e.target.dataset.type;
    
    if (currentType === 'transfer') {
      accountArea.classList.add('hidden');
      transferArea.classList.remove('hidden');
    } else {
      accountArea.classList.remove('hidden');
      transferArea.classList.add('hidden');
    }
  });
});

// 口座ボタン（通常）
document.querySelectorAll('.account-button').forEach(button => {
  button.addEventListener('click', (e) => {
    document.querySelectorAll('.account-button').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    selectedAccount = e.target.dataset.account;
  });
});

// 移動元ボタン
document.querySelectorAll('.from-button').forEach(button => {
  button.addEventListener('click', (e) => {
    document.querySelectorAll('.from-button').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    fromAccount = e.target.dataset.account;
  });
});

// 移動先ボタン
document.querySelectorAll('.to-button').forEach(button => {
  button.addEventListener('click', (e) => {
    document.querySelectorAll('.to-button').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    toAccount = e.target.dataset.account;
  });
});

// クイックタイトル選択ボタン
document.querySelectorAll('.quick-title-btn').forEach(button => {
  button.addEventListener('click', (e) => {
    titleInput.value = e.target.textContent;
  });
});

// バックアップ＆インポート
document.getElementById('exportButton').addEventListener('click', exportData);
document.getElementById('importButton').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', importData);

// =====================
// 関数定義
// =====================

function openModal(transaction = null) {
  modal.classList.remove('hidden');
  
  if (transaction) {
    // 編集モード
    editingId = transaction.id;
    modalTitle.textContent = '取引を編集';
    saveTransactionButton.textContent = '更新する';
    titleInput.value = transaction.title;
    amountInput.value = transaction.amount;
    
    currentType = transaction.type;
    updateSelectedButton('.type-button', 'type', currentType);
    
    if (currentType === 'transfer') {
      fromAccount = transaction.from;
      toAccount = transaction.to;
      updateSelectedButton('.from-button', 'account', fromAccount);
      updateSelectedButton('.to-button', 'account', toAccount);
      accountArea.classList.add('hidden');
      transferArea.classList.remove('hidden');
    } else {
      selectedAccount = transaction.account;
      updateSelectedButton('.account-button', 'account', selectedAccount);
      accountArea.classList.remove('hidden');
      transferArea.classList.add('hidden');
    }
  } else {
    // 新規追加モード
    editingId = null;
    modalTitle.textContent = '取引を追加';
    saveTransactionButton.textContent = '追加する';
    titleInput.value = '';
    amountInput.value = '';
    
    currentType = 'expense';
    updateSelectedButton('.type-button', 'type', currentType);
    selectedAccount = 'cash';
    updateSelectedButton('.account-button', 'account', selectedAccount);
    accountArea.classList.remove('hidden');
    transferArea.classList.add('hidden');
  }
}

function closeModal() {
  modal.classList.add('hidden');
}

function updateSelectedButton(selector, datasetKey, value) {
  document.querySelectorAll(selector).forEach(btn => {
    if (btn.dataset[datasetKey] === value) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

function saveTransaction() {
  const amount = Number(amountInput.value);
  if (!amount || amount <= 0) {
    alert('有効な金額を入力してください');
    return;
  }

  // タイトルが空の場合はデフォルト名を設定
  let title = titleInput.value.trim();
  if (!title) {
    if (currentType === 'income') title = '収入';
    else if (currentType === 'expense') title = '支出';
    else title = '口座移動';
  }

  const transactionData = {
    id: editingId ? editingId : Date.now(),
    date: new Date().toISOString(),
    type: currentType,
    title: title,
    amount: amount,
    account: selectedAccount,
    from: fromAccount,
    to: toAccount
  };

  if (editingId) {
    const index = transactions.findIndex(t => t.id === editingId);
    if (index !== -1) {
      transactions[index] = transactionData;
    }
  } else {
    transactions.unshift(transactionData); // 先頭に追加
  }

  saveAndRefresh();
  closeModal();
}

function deleteTransaction(id) {
  if (confirm('この取引を削除しますか？')) {
    transactions = transactions.filter(t => t.id !== id);
    saveAndRefresh();
  }
}

function saveAndRefresh() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  updateUI();
}

function toggleBalanceVisibility() {
  hideBalance = !hideBalance;
  toggleBalanceButton.textContent = hideBalance ? '🙈 非表示' : '👁 表示';
  updateUI();
}

// 画面の更新（残高計算・収支・履歴の描画）
function updateUI() {
  let balances = { cash: 0, olive: 0, paypay: 0, suica: 0 };
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  transactionListEl.innerHTML = '';

  transactions.forEach(t => {
    // 残高計算
    if (t.type === 'income') {
      balances[t.account] += t.amount;
    } else if (t.type === 'expense') {
      balances[t.account] -= t.amount;
    } else if (t.type === 'transfer') {
      balances[t.from] -= t.amount;
      balances[t.to] += t.amount;
    }

    // 今月の収支計算
    const tDate = new Date(t.date);
    if (tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth) {
      if (t.type === 'income') monthlyIncome += t.amount;
      if (t.type === 'expense') monthlyExpense += t.amount;
    }

    // 履歴カードの生成
    const itemEl = document.createElement('div');
    itemEl.className = 'transaction';
    
    let accountName = { cash: '現金', olive: 'Olive', paypay: 'PayPay', suica: 'Suica' };
    let subText = '';
    if (t.type === 'transfer') {
      subText = `${accountName[t.from]} ➔ ${accountName[t.to]}`;
    } else {
      subText = accountName[t.account];
    }

    let amountFormatted = `¥${t.amount.toLocaleString()}`;
    if (t.type === 'expense') amountFormatted = `-¥${t.amount.toLocaleString()}`;
    if (t.type === 'income') amountFormatted = `+¥${t.amount.toLocaleString()}`;

    itemEl.innerHTML = `
      <div class="transaction-info">
        <strong>${t.title}</strong>
        <span class="transaction-date">${tDate.getMonth() + 1}/${tDate.getDate()} (${subText})</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: bold;">${amountFormatted}</span>
        <div>
          <button onclick="editTransaction(${t.id})">編集</button>
          <button onclick="deleteTransaction(${t.id})">削除</button>
        </div>
      </div>
    `;
    transactionListEl.appendChild(itemEl);
  });

  // 残高表示の更新（目隠し対応）
  cashBalanceEl.textContent = hideBalance ? '••••' : `¥${balances.cash.toLocaleString()}`;
  oliveBalanceEl.textContent = hideBalance ? '••••' : `¥${balances.olive.toLocaleString()}`;
  paypayBalanceEl.textContent = hideBalance ? '••••' : `¥${balances.paypay.toLocaleString()}`;
  suicaBalanceEl.textContent = hideBalance ? '••••' : `¥${balances.suica.toLocaleString()}`;

  monthlyIncomeEl.textContent = `¥${monthlyIncome.toLocaleString()}`;
  monthlyExpenseEl.textContent = `¥${monthlyExpense.toLocaleString()}`;
  monthlyBalanceEl.textContent = `¥${(monthlyIncome - monthlyExpense).toLocaleString()}`;
}

// 編集ボタン用（グローバルスコープに配置）
window.editTransaction = function(id) {
  const transaction = transactions.find(t => t.id === id);
  if (transaction) openModal(transaction);
};

// バックアップ書き出し
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `kotaro_money_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// データインポート
function importData(event) {
  const fileReader = new FileReader();
  if (event.target.files[0]) {
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          transactions = imported;
          saveAndRefresh();
          alert('データを復元しました！');
        } else {
          alert('ファイルの形式が正しくありません');
        }
      } catch (error) {
        alert('JSONファイルの読み込みに失敗しました');
      }
    };
  }
}

// 初期化実行
updateUI();
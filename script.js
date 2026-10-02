// =====================
// 初期データ・状態管理
// =====================
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let quickTitles = JSON.parse(localStorage.getItem('quickTitles')) || ['昼食', 'おやつ', '夕食', 'カラオケ'];

let currentType = 'expense'; 
let selectedAccount = 'cash';
let fromAccount = 'cash';
let toAccount = 'olive';
let editingId = null; 
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
const quickTitlesContainer = document.getElementById('quickTitlesContainer');

// 設定モーダル用DOM
const settingsModal = document.getElementById('settingsModal');
const openSettingsButton = document.getElementById('openSettings');
const closeSettingsModalButton = document.getElementById('closeSettingsModal');
const newQuickTitleInput = document.getElementById('newQuickTitleInput');
const addQuickTitleButton = document.getElementById('addQuickTitleButton');
const settingsQuickList = document.getElementById('settingsQuickList');

// =====================
// イベントリスナーの設定
// =====================
addButton.addEventListener('click', () => openModal());
closeModalButton.addEventListener('click', closeModal);
saveTransactionButton.addEventListener('click', saveTransaction);
toggleBalanceButton.addEventListener('click', toggleBalanceVisibility);

openSettingsButton.addEventListener('click', openSettings);
closeSettingsModalButton.addEventListener('click', closeSettings);
addQuickTitleButton.addEventListener('click', addQuickTitle);

// 背景タップで閉じる
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettings();
});

// 種類ボタン
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

document.querySelectorAll('.account-button').forEach(button => {
  button.addEventListener('click', (e) => {
    document.querySelectorAll('.account-button').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    selectedAccount = e.target.dataset.account;
  });
});

document.querySelectorAll('.from-button').forEach(button => {
  button.addEventListener('click', (e) => {
    document.querySelectorAll('.from-button').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    fromAccount = e.target.dataset.account;
  });
});

document.querySelectorAll('.to-button').forEach(button => {
  button.addEventListener('click', (e) => {
    document.querySelectorAll('.to-button').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    toAccount = e.target.dataset.account;
  });
});

document.getElementById('exportButton').addEventListener('click', exportData);
document.getElementById('importButton').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', importData);

// =====================
// 関数定義
// =====================

function renderQuickTitles() {
  quickTitlesContainer.innerHTML = '';
  quickTitles.forEach(title => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-title-btn choice-button';
    btn.style.fontSize = '12px';
    btn.style.padding = '6px 10px';
    btn.textContent = title;
    btn.addEventListener('click', () => {
      titleInput.value = title;
    });
    quickTitlesContainer.appendChild(btn);
  });
}

function openModal(transaction = null) {
  renderQuickTitles();
  modal.classList.remove('hidden');
  
  if (transaction) {
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

function openSettings() {
  renderSettingsQuickList();
  settingsModal.classList.remove('hidden');
}

function closeSettings() {
  settingsModal.classList.add('hidden');
}

function renderSettingsQuickList() {
  settingsQuickList.innerHTML = '';
  quickTitles.forEach((title, index) => {
    const tag = document.createElement('div');
    tag.style.display = 'inline-flex';
    tag.style.alignItems = 'center';
    tag.style.gap = '6px';
    tag.style.background = 'rgba(128, 128, 128, 0.1)';
    tag.style.padding = '6px 12px';
    tag.style.borderRadius = '8px';
    tag.style.fontSize = '13px';
    tag.style.fontWeight = '600';

    tag.innerHTML = `
      <span>${title}</span>
      <button type="button" style="background: none; border: none; color: #ff3b30; cursor: pointer; font-weight: bold; font-size: 14px;">×</button>
    `;

    tag.querySelector('button').addEventListener('click', () => {
      quickTitles.splice(index, 1);
      localStorage.setItem('quickTitles', JSON.stringify(quickTitles));
      renderSettingsQuickList();
    });

    settingsQuickList.appendChild(tag);
  });
}

function addQuickTitle() {
  const newTitle = newQuickTitleInput.value.trim();
  if (!newTitle) return;
  if (quickTitles.includes(newTitle)) {
    alert('すでに存在します');
    return;
  }
  quickTitles.push(newTitle);
  localStorage.setItem('quickTitles', JSON.stringify(quickTitles));
  newQuickTitleInput.value = '';
  renderSettingsQuickList();
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
    transactions.unshift(transactionData);
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

function updateUI() {
  let balances = { cash: 0, olive: 0, paypay: 0, suica: 0 };
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  transactionListEl.innerHTML = '';

  transactions.forEach(t => {
    if (t.type === 'income') {
      balances[t.account] += t.amount;
    } else if (t.type === 'expense') {
      balances[t.account] -= t.amount;
    } else if (t.type === 'transfer') {
      balances[t.from] -= t.amount;
      balances[t.to] += t.amount;
    }

    const tDate = new Date(t.date);
    if (tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth) {
      if (t.type === 'income') monthlyIncome += t.amount;
      if (t.type === 'expense') monthlyExpense += t.amount;
    }

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

    if (hideBalance) {
      amountFormatted = '••••';
    }

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

  cashBalanceEl.textContent = hideBalance ? '••••' : `¥${balances.cash.toLocaleString()}`;
  oliveBalanceEl.textContent = hideBalance ? '••••' : `¥${balances.olive.toLocaleString()}`;
  paypayBalanceEl.textContent = hideBalance ? '••••' : `¥${balances.paypay.toLocaleString()}`;
  suicaBalanceEl.textContent = hideBalance ? '••••' : `¥${balances.suica.toLocaleString()}`;

  monthlyIncomeEl.textContent = hideBalance ? '••••' : `¥${monthlyIncome.toLocaleString()}`;
  monthlyExpenseEl.textContent = hideBalance ? '••••' : `¥${monthlyExpense.toLocaleString()}`;
  monthlyBalanceEl.textContent = hideBalance ? '••••' : `¥${(monthlyIncome - monthlyExpense).toLocaleString()}`;
}

window.editTransaction = function(id) {
  const transaction = transactions.find(t => t.id === id);
  if (transaction) openModal(transaction);
};

function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `kotaro_money_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

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

updateUI();
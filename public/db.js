let db;
// open requests opening a connection to a database
const request = window.indexedDB.open("budgetDB", 1);

request.onupgradeneeded = function (event) {
  //make the object store (table) where data will be stored
  db = event.target.result;
  const objStore = db.createObjectStore("BudgetStore", { keyPath: "id", autoIncrement:true });
  objStore.createIndex("name", "name");
  objStore.createIndex("value", "value");
  objStore.createIndex("date", "date");
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("error occured! ");
  console.log(event.target.errorCode)
};

function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const db = request.result;
  const transaction = db.transaction(["BudgetStore"], "readwrite");
  // access your pending object store
  const BudgetStoreObj = transaction.objectStore("BudgetStore");
  // add record to your store with add method.
  BudgetStoreObj.add({name: record.name, value: record.value, date: new Date().toISOString()});
}

function checkDatabase() {
  // open a transaction on your pending db
  var transaction = db.transaction(["BudgetStore"], "readwrite");
  // access your pending object store
  const BudgetStoreObj = transaction.objectStore("BudgetStore");
  // get all records from store and set to a variable
  var getAll = BudgetStoreObj.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          var transaction = db.transaction(["BudgetStore"], "readwrite");
          // access your pending object store
          const BudgetStoreObj = transaction.objectStore("BudgetStore");
          // clear all items in your store
          BudgetStoreObj.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);

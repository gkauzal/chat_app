import './scss/style.scss';
import config from './db_config.js';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import scrollIntoView from 'scroll-into-view-if-needed';

const app = initializeApp(config);
const db = getFirestore(app);

/**
 * sends the message to the database
 * @param {object} message the message to send
 */
async function sendMessage(message) {
  const docRef = await addDoc(collection(db, 'messages'), message);
  console.log('Document written with ID: ', docRef.id);
}

function createMessage() {
  const message = document.querySelector('#message').value;
  const username = document.querySelector('#nickname').value;
  const date = Timestamp.now();
  return { message, username, date };
}
//function to remove messages from UI on selected ID
async function removeMessage(id) {
  const element = document.getElementById(id);
  await element.remove();
}
//function to delete messages from db on selected ID
async function deleteMessage(id) {
  const docRef = doc(db, 'messages', id);
  await deleteDoc(docRef);
}
//function to modify messages in db on selected ID
async function modifyMessage(id, newMessage) {
  const docRef = doc(db, 'messages', id);
  await updateDoc(docRef, { message: newMessage });
}
//function to modify messages in UI on selected ID
async function setMessageText(id, newText) {
  document.querySelector(`.message[id="${id}"] .message-text`).textContent = newText;
}
//function to display a popup textarea to modify messages
function displayEditMessage(id) {
  const editPopupHTML = /*html*/ `
    <div class="popup-container" id="popup">
      <div class="edit-message" id="edit-message" id="${id}">
        <div id="close-popup" class="button">
          Close <i class="fa fa-window-close" aria-hidden="true"></i>
        </div>
        <textarea id="edit" name="" cols="30" rows="10">${document
          .querySelector(`.message[id="${id}"] .message-text`)
          .textContent.trim()}</textarea>
        <div id="save-message" class="button">
          Save message<i class="fas fa-save"></i>
        </div>
      </div>
    </div>
`;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', editPopupHTML);
  // close popup onclick the close btn
  document.querySelector('#close-popup').addEventListener('click', function () {
    document.getElementById('popup').remove();
  });
  //save the modify message and close the popup area onclick the save btn
  document.querySelector('#save-message').addEventListener('click', function () {
    modifyMessage(id, document.querySelector('#edit-message #edit').value);
    document.getElementById('popup').remove();
  });
}

/**
 * downloads all messages from the database and displays them ordered by date
 */
async function displayAllMessages() {
  const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
  const messages = await getDocs(q);
  document.querySelector('#messages').innerHTML = '';
  messages.forEach((doc) => {
    displayMessage(doc.data(), doc.id);
  });
}

function displayMessage(message, id) {
  const dateFormat = message.date.toDate().toLocaleString('hu');
  const messageHTML = /*html*/ `
    <div class="message" id="${id}">
      <i class="fas fa-user"></i>
      <div>
        <span class="username">${message.username}
          <time>${dateFormat}</time>
        </span>
        <br>
        <span class="message-text">
          ${message.message}
        </span>
      </div>
      <div class="message-edit-buttons">
        <i class="fas fa-trash-alt"></i>
        <i class="fas fa-pen"></i>
      </div>
    </div>
  `;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', messageHTML);
  scrollIntoView(document.querySelector('#messages'), {
    scrollMode: 'if-needed',
    block: 'end'
  });
  //delete the selected message onclick the trash btn
  var x = document.querySelector(`[id="${id}"] .fa-trash-alt`);
  x.addEventListener('click', function () {
    deleteMessage(`${id}`);
  });
  //open the popup area with the original message to modify it
  document.querySelector(`[id="${id}"] .fa-pen`).addEventListener('click', function () {
    displayEditMessage(`${id}`);
  });
}

function handleSubmit() {
  const message = createMessage();
  sendMessage(message);
  //displayMessage(message);
}

document.querySelector('#send').addEventListener('click', handleSubmit);

// send the message if the enter key is pressed
document.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    handleSubmit();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  // the document is fully loaded
  displayAllMessages();
});

// document.querySelector('#messages').innerHTML = '';

let initialLoad = true;
//change the datas on UI if data has changed (added, modified, removed) in db
const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      console.log('added');
      if (!initialLoad) {
        displayMessage(change.doc.data(), change.doc.id);
      }
    }
    if (change.type === 'modified') {
      console.log('Modified');
      if (!initialLoad) {
        setMessageText(change.doc.id, change.doc.data().message);
      }
    }
    if (change.type === 'removed') {
      console.log('Removed');
      if (!initialLoad) {
        removeMessage(change.doc.id);
      }
    }
  });
  initialLoad = false;
});

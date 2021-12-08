document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = e => send_email(e);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#content-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#content-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  get_mailbox(mailbox);
}

function send_email(e){
  e.preventDefault();
  recipients = document.querySelector('#compose-recipients').value;
  subject = document.querySelector('#compose-subject').value;
  body = document.querySelector('#compose-body').value;

  if (recipients === ''){
    alert("Recipients field is empty!");
    return false;
  }

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    // print result
    if (result["message"] == undefined){
      alert(`${result.error}`);
    }else{
      alert(`${result.message}`);
    }
  })
  .then(load_mailbox('sent'));
}

function get_mailbox(mailbox) {
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(result => {
    
    // show email previews
    for (let i = 0; i < result.length; i++) {
      const data = result[i];
      if (mailbox === 'inbox' && data.archived === false) {
        display_mail(data, mailbox);
      } else if (mailbox === 'archive' && data.archived === true) {
        display_mail(data, mailbox);
      } else {
        display_mail(data, mailbox);
      }
    }
  });
}

function display_mail(data, mailbox) {
  const emails_view = document.querySelector('#emails-view');
  const container = document.createElement('div');
  container.classList.add('border', 'border-dark', 'p-3', 'container');
  if (!data.read){
    container.classList.add('bg-white');
  }else{
    container.classList.add('bg-secondary', 'text-white')
  }
  container.id = data.id

  const sender = document.createElement('div');
  const subject = document.createElement('div');
  const timestamp = document.createElement('div');
  const archive_button = document.createElement('button');

  if (mailbox === 'inbox' || mailbox === 'archive') {
    archive_button.classList.add('btn', 'btn-primary', 'btn-sm', 'float-right', 'm-2');

    if (mailbox === 'inbox') {
      archive_button.innerHTML = 'Archive';
      archive_button.id = 'archive';
    } else {
      archive_button.innerHTML = 'Unarchive';
      archive_button.id = 'unarchive';
    }
    container.append(archive_button);
  }
  
  sender.innerHTML = `<b>${data.sender}</b>`;
  subject.innerHTML = `${data.subject}`;
  timestamp.innerHTML = `${data.timestamp}`;

  sender.classList.add('d-inline-flex', 'm-2');
  subject.classList.add('d-inline-flex', 'm-2');
  timestamp.classList.add('d-inline-flex', 'm-2', 'float-right');

  emails_view.append(container);
  container.append(sender);
  container.append(subject);
  container.append(timestamp);

  container.onclick = e => load_mail(e, data.id, mailbox);
}

function load_mail(e, email_id, mailbox) {
  if (e.target.tagName === 'BUTTON') {
    let archive = false;
    if (e.target.id === 'archive') {
      archive = true;
    }
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: archive
      })
    })
    .then(() => load_mailbox('inbox'));
  } else {
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      // show the email
      const content_view = document.querySelector('#content-view');
      content_view.innerHTML = '';
      const emails_view = document.querySelector('#emails-view')
      content_view.style.display = 'block';
      emails_view.style.display = 'none';
      
      const sender = document.createElement('div');
      const recipients = document.createElement('div')
      const subject = document.createElement('div');
      const timestamp = document.createElement('div');
      const body = document.createElement('div');
      const button = document.createElement('button');
      const reply = document.createElement('button');
      
      button.innerHTML = 'Back';
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm', 'mb-2', 'mr-3');
      button.onclick = () => {
        load_mailbox(mailbox);
      };

      reply.innerHTML = 'Reply';
      reply.classList.add('btn', 'btn-primary', 'btn-sm', 'mb-2');
      reply.onclick = () => {
        compose_email();
        document.querySelector('#compose-recipients').value = email.sender;
        document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
        document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
      };
  
      sender.innerHTML = `<b>From: </b>${email.sender}`;
      recipients.innerHTML = `<b>To: </b>${email.recipients}`;
      subject.innerHTML = `<b>Subject: </b>${email.subject}`;
      timestamp.innerHTML = `<b>Timestamp: </b>${email.timestamp}`;
      body.innerText = email.body;
      body.classList.add('border-top', 'border-dark', 'mt-2', 'pt-2');
  
      content_view.append(button);
      content_view.append(reply);
      content_view.append(sender);
      content_view.append(recipients);
      content_view.append(subject);
      content_view.append(timestamp);
      content_view.append(body);
  
      // set read to true
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      });
    });
  }
}
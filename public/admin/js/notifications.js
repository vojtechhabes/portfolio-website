const notifications = document.createElement("section");
notifications.classList.add("notifications");
document.body.appendChild(notifications);

const createNotification = (text, type) => {
  const notification = document.createElement("article");
  notification.innerHTML = `
    <p>${text}</p>
  `;
  notification.classList.add(type);
  notifications.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("hidden");

    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 4000);
};

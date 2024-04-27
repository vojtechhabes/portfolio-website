const menuButton = document.querySelector(".menu-button");
const navHeader = document.querySelector(".navigation-header");

menuButton.addEventListener("click", () => {
  navHeader.classList.toggle("open");
  menuButton.classList.toggle("open");
});

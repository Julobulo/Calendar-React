export const scrollToSignup = () => {
  const el = document.getElementById("signup");
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      el.classList.add("pop-on-scroll");
      setTimeout(() => el.classList.remove("pop-on-scroll"), 800);
    }, 600);
  }
};

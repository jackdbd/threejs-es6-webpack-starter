export const makeLi = ({ text, style }) => {
  const li = document.createElement("li");
  li.innerText = text;
  li.style = style;
  return li;
};
